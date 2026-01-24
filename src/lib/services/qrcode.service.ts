import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * Récupère le secret QR de manière sécurisée
 * Lève une erreur si non défini en production
 */
function getQRSecret(): string {
    const secret = process.env.QR_SECRET_KEY;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('QR_SECRET_KEY doit être défini en production pour signer les QR codes');
        }
        console.warn('[SECURITY] QR_SECRET_KEY non défini - utilisation d\'une valeur de développement');
        return 'dev-only-qr-secret-do-not-use-in-production';
    }
    return secret;
}

export interface QRCodeData {
    id: string;
    numero: string;
    nom: string;
    prenom: string;
    dateNaissance: string;
}

export interface SignedQRData extends QRCodeData {
    signature: string;
    timestamp: number;
}

/**
 * Service de génération et validation de QR Code sécurisés
 */
export class QRCodeService {
    /**
     * Génère une signature HMAC-SHA256 pour les données
     */
    private generateSignature(data: QRCodeData): string {
        const payload = `${data.id}|${data.numero}|${data.nom}|${data.prenom}|${data.dateNaissance}`;
        return crypto
            .createHmac('sha256', getQRSecret())
            .update(payload)
            .digest('hex');
    }

    /**
     * Valide une signature HMAC
     */
    private validateSignature(data: QRCodeData, signature: string): boolean {
        const expectedSignature = this.generateSignature(data);
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    }

    /**
     * Génère un QR Code avec données signées
     * @param data Données de l'attestation
     * @param baseUrl URL de base pour la vérification (ex: https://example.com)
     * @returns QR Code en base64
     */
    async generateQRCode(data: QRCodeData, baseUrl: string): Promise<string> {
        const signature = this.generateSignature(data);
        const timestamp = Date.now();

        const signedData: SignedQRData = {
            ...data,
            signature,
            timestamp,
        };

        // URL de vérification
        const verificationUrl = `${baseUrl}/verifier/${data.numero}?sig=${signature}&ts=${timestamp}`;

        try {
            // Générer le QR Code en base64
            const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
                errorCorrectionLevel: 'H',
                type: 'image/png',
                width: 200,
                margin: 1,
            });

            return qrCodeDataUrl;
        } catch (error) {
            console.error('Erreur lors de la génération du QR Code:', error);
            throw new Error('Impossible de générer le QR Code');
        }
    }

    /**
     * Génère un QR Code en buffer (pour insertion dans PDF)
     */
    async generateQRCodeBuffer(data: QRCodeData, baseUrl: string): Promise<Buffer> {
        const signature = this.generateSignature(data);
        const timestamp = Date.now();

        const verificationUrl = `${baseUrl}/verifier/${data.numero}?sig=${signature}&ts=${timestamp}`;

        try {
            const buffer = await QRCode.toBuffer(verificationUrl, {
                errorCorrectionLevel: 'H',
                type: 'png',
                width: 200,
                margin: 1,
            });

            return buffer;
        } catch (error) {
            console.error('Erreur lors de la génération du QR Code:', error);
            throw new Error('Impossible de générer le QR Code');
        }
    }

    /**
     * Valide un QR Code
     * @param data Données extraites du QR Code
     * @param signature Signature à valider
     * @param timestamp Timestamp de génération
     * @returns true si valide, false sinon
     */
    validateQRCode(
        data: QRCodeData,
        signature: string,
        timestamp: number
    ): { valid: boolean; reason?: string } {
        // Vérifier que la signature est valide
        if (!this.validateSignature(data, signature)) {
            return { valid: false, reason: 'Signature invalide' };
        }

        // Optionnel : vérifier que le QR Code n'est pas trop ancien (ex: 10 ans)
        const maxAge = 10 * 365 * 24 * 60 * 60 * 1000; // 10 ans en millisecondes
        if (Date.now() - timestamp > maxAge) {
            return { valid: false, reason: 'QR Code expiré' };
        }

        return { valid: true };
    }

    /**
     * Génère les données JSON signées pour stockage en base
     */
    generateQRData(data: QRCodeData): string {
        const signature = this.generateSignature(data);
        const timestamp = Date.now();

        const signedData: SignedQRData = {
            ...data,
            signature,
            timestamp,
        };

        return JSON.stringify(signedData);
    }

    /**
     * Parse et valide les données QR stockées
     */
    parseAndValidateQRData(jsonData: string): {
        valid: boolean;
        data?: SignedQRData;
        reason?: string;
    } {
        try {
            const parsed: SignedQRData = JSON.parse(jsonData);

            const validation = this.validateQRCode(
                {
                    id: parsed.id,
                    numero: parsed.numero,
                    nom: parsed.nom,
                    prenom: parsed.prenom,
                    dateNaissance: parsed.dateNaissance,
                },
                parsed.signature,
                parsed.timestamp
            );

            if (!validation.valid) {
                return { valid: false, reason: validation.reason };
            }

            return { valid: true, data: parsed };
        } catch (error) {
            return { valid: false, reason: 'Données QR Code invalides' };
        }
    }
}

export const qrcodeService = new QRCodeService();
