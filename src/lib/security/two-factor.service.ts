/**
 * Service 2FA (Two-Factor Authentication) pour le Directeur
 * Supporte deux méthodes: Email OTP et TOTP (Google Authenticator)
 */

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { TOTP, ScureBase32Plugin, NobleCryptoPlugin } from 'otplib';
import QRCode from 'qrcode';
import { otpStore } from './otp-store';

// Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 3;
const TOTP_WINDOW = 1; // Accepter 1 période avant/après (30s * 2)
const TOTP_STEP = 30; // Période de 30 secondes
const TOTP_EPOCH_TOLERANCE = TOTP_WINDOW * TOTP_STEP; // 30 secondes de tolérance

/**
 * Génère un code OTP numérique
 */
function generateOTPCode(): string {
    const min = Math.pow(10, OTP_LENGTH - 1);
    const max = Math.pow(10, OTP_LENGTH) - 1;
    return String(crypto.randomInt(min, max));
}

/**
 * Service 2FA
 */
export class TwoFactorService {
    /**
     * Génère un OTP pour une action spécifique
     */
    async generateOTP(
        userId: string,
        action: 'SIGN_ATTESTATION' | 'SIGN_BATCH' | 'CHANGE_PIN' | 'CONFIG_UPDATE'
    ): Promise<{ code: string; expiresAt: Date }> {
        const code = generateOTPCode();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        const key = `${userId}:${action}`;

        // Supprimer l'ancien OTP s'il existe
        await otpStore.delete(key);

        // Stocker le nouveau
        await otpStore.set(key, {
            code,
            expiresAt,
            attempts: 0,
            action,
        });

        return { code, expiresAt };
    }

    /**
     * Vérifie un OTP (email ou TOTP)
     */
    async verifyOTP(
        userId: string,
        action: string,
        code: string
    ): Promise<{ valid: boolean; error?: string }> {
        // Récupérer la configuration du directeur
        const config = await prisma.directeurSignature.findUnique({
            where: { userId },
            select: { twoFactorMethod: true, totpSecret: true, totpEnabled: true },
        });

        if (!config) {
            return { valid: false, error: 'Configuration 2FA introuvable' };
        }

        // Vérifier selon la méthode configurée
        if (config.twoFactorMethod === 'totp' && config.totpEnabled && config.totpSecret) {
            return this.verifyTOTP(userId, code);
        } else {
            return this.verifyEmailOTP(userId, action, code);
        }
    }

    /**
     * Vérifie un OTP envoyé par email
     */
    private async verifyEmailOTP(
        userId: string,
        action: string,
        code: string
    ): Promise<{ valid: boolean; error?: string }> {
        const key = `${userId}:${action}`;
        const otpData = await otpStore.get(key);

        if (!otpData) {
            return { valid: false, error: 'Code invalide ou expiré' };
        }

        // Vérifier l'expiration
        if (new Date() > otpData.expiresAt) {
            await otpStore.delete(key);
            return { valid: false, error: 'Code expiré' };
        }

        // Vérifier le nombre de tentatives
        if (otpData.attempts >= OTP_MAX_ATTEMPTS) {
            await otpStore.delete(key);
            return { valid: false, error: 'Trop de tentatives. Demandez un nouveau code.' };
        }

        // Incrémenter les tentatives
        await otpStore.increment(key);
        const updatedData = await otpStore.get(key);

        // Vérifier le code
        if (otpData.code !== code) {
            return {
                valid: false,
                error: `Code incorrect. ${OTP_MAX_ATTEMPTS - (updatedData?.attempts || 1)} tentatives restantes.`
            };
        }

        // Code valide - le supprimer
        await otpStore.delete(key);
        return { valid: true };
    }

    /**
     * Génère un secret TOTP et un QR code pour Google Authenticator
     */
    async setupTOTP(
        userId: string
    ): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
        // Récupérer l'utilisateur
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, nom: true, prenom: true },
        });

        if (!user) {
            throw new Error('Utilisateur introuvable');
        }

        // Générer un secret unique
        const totp = new TOTP({
            crypto: new NobleCryptoPlugin(),
            base32: new ScureBase32Plugin(),
        });
        const secret = totp.generateSecret();

        // Créer l'URL TOTP
        const appName = 'Attestations SCN';
        const accountName = `${user.prenom} ${user.nom} (${user.email})`;
        const otpauthUrl = totp.toURI({
            issuer: appName,
            label: accountName,
            secret: secret,
        });

        // Générer le QR code
        const qrCode = await QRCode.toDataURL(otpauthUrl);

        // Générer des codes de backup (10 codes)
        const backupCodes = Array.from({ length: 10 }, () =>
            crypto.randomBytes(4).toString('hex').toUpperCase()
        );

        return { secret, qrCode, backupCodes };
    }

    /**
     * Active TOTP pour un directeur après vérification du premier code
     */
    async enableTOTP(
        userId: string,
        secret: string,
        verificationCode: string,
        backupCodes: string[]
    ): Promise<{ success: boolean; message: string }> {
        // Vérifier le code TOTP avant d'activer
        const totp = new TOTP({
            secret: secret,
            crypto: new NobleCryptoPlugin(),
            base32: new ScureBase32Plugin(),
        });
        const result = await totp.verify(verificationCode);

        if (!result.valid) {
            return {
                success: false,
                message: 'Code invalide. Vérifiez le code dans votre application.',
            };
        }

        // Chiffrer le secret avant de le stocker
        const encryptedSecret = this.encryptData(secret);
        const encryptedBackupCodes = this.encryptData(JSON.stringify(backupCodes));

        // Activer TOTP dans la base de données
        await prisma.directeurSignature.update({
            where: { userId },
            data: {
                twoFactorMethod: 'totp',
                totpSecret: encryptedSecret,
                totpEnabled: true,
                totpBackupCodes: encryptedBackupCodes,
            },
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                action: 'TOTP_ENABLED',
                userId,
                details: JSON.stringify({ method: 'totp' }),
            },
        });

        return {
            success: true,
            message: 'TOTP activé avec succès. Conservez vos codes de backup en lieu sûr.',
        };
    }

    /**
     * Vérifie un code TOTP
     */
    async verifyTOTP(
        userId: string,
        code: string
    ): Promise<{ valid: boolean; error?: string }> {
        // Récupérer le secret
        const config = await prisma.directeurSignature.findUnique({
            where: { userId },
            select: { totpSecret: true, totpBackupCodes: true, totpEnabled: true },
        });

        if (!config || !config.totpEnabled || !config.totpSecret) {
            return { valid: false, error: 'TOTP non configuré' };
        }

        // Déchiffrer le secret
        const secret = this.decryptData(config.totpSecret);

        // Vérifier le code TOTP avec fenêtre de tolérance
        const totp = new TOTP({
            secret: secret,
            crypto: new NobleCryptoPlugin(),
            base32: new ScureBase32Plugin(),
        });
        const result = await totp.verify(code, { epochTolerance: TOTP_EPOCH_TOLERANCE });

        if (result.valid) {
            return { valid: true };
        }

        // Si le code TOTP est invalide, vérifier si c'est un code de backup
        if (config.totpBackupCodes) {
            const backupCodes = JSON.parse(this.decryptData(config.totpBackupCodes)) as string[];
            
            if (backupCodes.includes(code.toUpperCase())) {
                // Retirer le code de backup utilisé
                const updatedCodes = backupCodes.filter(c => c !== code.toUpperCase());
                
                await prisma.directeurSignature.update({
                    where: { userId },
                    data: {
                        totpBackupCodes: this.encryptData(JSON.stringify(updatedCodes)),
                    },
                });

                // Log audit
                await prisma.auditLog.create({
                    data: {
                        action: 'BACKUP_CODE_USED',
                        userId,
                        details: JSON.stringify({ codesRemaining: updatedCodes.length }),
                    },
                });

                return { valid: true };
            }
        }

        return { valid: false, error: 'Code TOTP invalide' };
    }

    /**
     * Désactive TOTP et revient à email OTP
     */
    async disableTOTP(
        userId: string,
        verificationCode: string
    ): Promise<{ success: boolean; message: string }> {
        // Vérifier le code avant de désactiver
        const verification = await this.verifyTOTP(userId, verificationCode);
        
        if (!verification.valid) {
            return {
                success: false,
                message: 'Code invalide. Impossible de désactiver TOTP.',
            };
        }

        // Désactiver TOTP
        await prisma.directeurSignature.update({
            where: { userId },
            data: {
                twoFactorMethod: 'email',
                totpSecret: null,
                totpEnabled: false,
                totpBackupCodes: null,
            },
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                action: 'TOTP_DISABLED',
                userId,
                details: JSON.stringify({ newMethod: 'email' }),
            },
        });

        return {
            success: true,
            message: 'TOTP désactivé. La méthode email OTP est maintenant active.',
        };
    }

    /**
     * Change la méthode 2FA préférée
     */
    async setPreferredMethod(
        userId: string,
        method: 'email' | 'totp'
    ): Promise<{ success: boolean; message: string }> {
        const config = await prisma.directeurSignature.findUnique({
            where: { userId },
            select: { totpEnabled: true },
        });

        if (!config) {
            return { success: false, message: 'Configuration introuvable' };
        }

        // Si on veut passer à TOTP mais qu'il n'est pas configuré
        if (method === 'totp' && !config.totpEnabled) {
            return {
                success: false,
                message: 'TOTP non configuré. Activez-le d\'abord via /setup-totp',
            };
        }

        await prisma.directeurSignature.update({
            where: { userId },
            data: { twoFactorMethod: method },
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                action: 'TWO_FACTOR_METHOD_CHANGED',
                userId,
                details: JSON.stringify({ newMethod: method }),
            },
        });

        return {
            success: true,
            message: `Méthode 2FA changée vers ${method === 'email' ? 'email OTP' : 'TOTP (Authenticator)'}`,
        };
    }

    /**
     * Chiffre des données sensibles
     */
    private encryptData(data: string): string {
        const algorithm = 'aes-256-gcm';
        const secret = process.env.NEXTAUTH_SECRET;
        if (!secret) {
            throw new Error('NEXTAUTH_SECRET environment variable is required for encryption');
        }
        const key = crypto.scryptSync(secret, 'salt', 32);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }

    /**
     * Déchiffre des données sensibles
     */
    private decryptData(encryptedData: string): string {
        const algorithm = 'aes-256-gcm';
        const secret = process.env.NEXTAUTH_SECRET;
        if (!secret) {
            throw new Error('NEXTAUTH_SECRET environment variable is required for decryption');
        }
        const key = crypto.scryptSync(secret, 'salt', 32);
        
        const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    /**
     * Récupère la méthode 2FA active et son statut
     */
    async get2FAStatus(userId: string): Promise<{
        enabled: boolean;
        method: 'email' | 'totp';
        totpConfigured: boolean;
    }> {
        const config = await prisma.directeurSignature.findUnique({
            where: { userId },
            select: {
                twoFactorMethod: true,
                totpEnabled: true,
                totpSecret: true,
            },
        });

        if (!config) {
            return {
                enabled: false,
                method: 'email',
                totpConfigured: false,
            };
        }

        return {
            enabled: true,
            method: config.twoFactorMethod as 'email' | 'totp',
            totpConfigured: config.totpEnabled && !!config.totpSecret,
        };
    }



    /**
     * Envoie un OTP par email au directeur
     */
    async sendOTPByEmail(
        userId: string,
        action: 'SIGN_ATTESTATION' | 'SIGN_BATCH' | 'CHANGE_PIN' | 'CONFIG_UPDATE'
    ): Promise<{ success: boolean; message: string }> {
        try {
            // Récupérer l'utilisateur
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { email: true, nom: true, prenom: true },
            });

            if (!user) {
                return { success: false, message: 'Utilisateur introuvable' };
            }

            // Générer l'OTP
            const { code, expiresAt } = await this.generateOTP(userId, action);

            // Préparer le message selon l'action
            const actionLabels: Record<string, string> = {
                'SIGN_ATTESTATION': 'signature d\'attestation',
                'SIGN_BATCH': 'signature en lot',
                'CHANGE_PIN': 'changement de PIN',
                'CONFIG_UPDATE': 'modification de configuration',
            };

            const actionLabel = actionLabels[action] || action;

            // Envoyer l'email
            const { unifiedEmailService } = await import('@/lib/notifications/unified-email.service');

            await unifiedEmailService.sendEmail({
                to: user.email,
                subject: `Code de vérification - ${actionLabel}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1a365d;">Code de vérification</h2>
                        <p>Bonjour ${user.prenom} ${user.nom},</p>
                        <p>Vous avez demandé une ${actionLabel}. Voici votre code de vérification :</p>
                        <div style="background: #f0f4f8; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">
                                ${code}
                            </span>
                        </div>
                        <p style="color: #666;">Ce code expire dans ${OTP_EXPIRY_MINUTES} minutes.</p>
                        <p style="color: #dc2626; font-size: 14px;">
                            Si vous n'êtes pas à l'origine de cette demande, ignorez cet email et contactez l'administrateur.
                        </p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                        <p style="color: #999; font-size: 12px;">
                            Attestations Service Civique - Sécurité 2FA
                        </p>
                    </div>
                `,
                text: `Code de vérification: ${code}\nCe code expire dans ${OTP_EXPIRY_MINUTES} minutes.`,
            });

            return {
                success: true,
                message: `Code envoyé à ${user.email.replace(/(.{2}).*(@.*)/, '$1***$2')}`
            };
        } catch (error) {
            console.error('[2FA] Erreur envoi OTP:', error);
            return { success: false, message: 'Erreur lors de l\'envoi du code' };
        }
    }

    /**
     * Vérifie si 2FA est requis pour un directeur
     */
    async is2FARequired(userId: string): Promise<boolean> {
        // Récupérer la config du directeur
        const config = await prisma.directeurSignature.findUnique({
            where: { userId },
            select: { id: true },
        });

        // 2FA est requis si le directeur a une config de signature
        return !!config;
    }

    /**
     * Génère un token de session 2FA valide pour une durée limitée
     * Utilisé après validation de l'OTP pour éviter de redemander le code
     */
    generateSessionToken(userId: string, action: string): string {
        const payload = {
            userId,
            action,
            timestamp: Date.now(),
            validUntil: Date.now() + 15 * 60 * 1000, // 15 minutes
        };

        // Signer le token avec une clé secrète
        const secret = process.env.NEXTAUTH_SECRET;
        if (!secret) {
            throw new Error('NEXTAUTH_SECRET environment variable is required for token signing');
        }
        const data = JSON.stringify(payload);
        const signature = crypto
            .createHmac('sha256', secret)
            .update(data)
            .digest('hex');

        return Buffer.from(JSON.stringify({ data, signature })).toString('base64');
    }

    /**
     * Vérifie un token de session 2FA
     */
    verifySessionToken(token: string, expectedAction: string): { valid: boolean; userId?: string } {
        try {
            const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
            const { data, signature } = decoded;

            // Vérifier la signature
            const secret = process.env.NEXTAUTH_SECRET;
            if (!secret) {
                throw new Error('NEXTAUTH_SECRET environment variable is required for token verification');
            }
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(data)
                .digest('hex');

            if (signature !== expectedSignature) {
                return { valid: false };
            }

            const payload = JSON.parse(data);

            // Vérifier l'expiration
            if (Date.now() > payload.validUntil) {
                return { valid: false };
            }

            // Vérifier l'action
            if (payload.action !== expectedAction) {
                return { valid: false };
            }

            return { valid: true, userId: payload.userId };
        } catch {
            return { valid: false };
        }
    }
}

export const twoFactorService = new TwoFactorService();
