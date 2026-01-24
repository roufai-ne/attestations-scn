/**
 * Service de vérification hCaptcha côté serveur
 * Documentation: https://docs.hcaptcha.com/#verify-the-user-response-server-side
 */

export interface HCaptchaVerificationResult {
    success: boolean;
    challenge_ts?: string;
    hostname?: string;
    'error-codes'?: string[];
    credit?: boolean;
}

/**
 * Vérifie un token hCaptcha auprès de l'API hCaptcha
 * @param token - Le token retourné par le widget hCaptcha côté client
 * @param remoteIp - L'adresse IP du client (optionnel mais recommandé)
 * @returns Résultat de la vérification
 */
export async function verifyHCaptchaToken(
    token: string,
    remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
    const secretKey = process.env.HCAPTCHA_SECRET_KEY;

    // Vérifier que la clé secrète est définie
    if (!secretKey) {
        // En développement, permettre un bypass avec un token spécifique
        if (process.env.NODE_ENV === 'development' && token === 'dev-bypass-token') {
            console.warn('[HCAPTCHA] Bypass en mode développement');
            return { success: true };
        }

        console.error('[HCAPTCHA] Secret key not configured');
        return {
            success: false,
            error: 'Configuration hCaptcha manquante',
        };
    }

    try {
        const formData = new URLSearchParams();
        formData.append('secret', secretKey);
        formData.append('response', token);
        if (remoteIp) {
            formData.append('remoteip', remoteIp);
        }

        const response = await fetch(
            'https://api.hcaptcha.com/siteverify',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            }
        );

        if (!response.ok) {
            console.error('[HCAPTCHA] API error:', response.status);
            return {
                success: false,
                error: 'Erreur lors de la vérification CAPTCHA',
            };
        }

        const data: HCaptchaVerificationResult = await response.json();

        if (!data.success) {
            console.warn('[HCAPTCHA] Verification failed:', data['error-codes']);
            return {
                success: false,
                error: getHCaptchaErrorMessage(data['error-codes'] || []),
            };
        }

        // Log du succès (optionnel, pour audit)
        console.log('[HCAPTCHA] Verification successful', {
            hostname: data.hostname,
            timestamp: data.challenge_ts,
            credit: data.credit,
        });

        return { success: true };
    } catch (error) {
        console.error('[HCAPTCHA] Verification error:', error);
        return {
            success: false,
            error: 'Erreur lors de la vérification de sécurité',
        };
    }
}

/**
 * Convertit les codes d'erreur hCaptcha en messages lisibles
 */
function getHCaptchaErrorMessage(errorCodes: string[]): string {
    const errorMessages: Record<string, string> = {
        'missing-input-secret': 'Configuration serveur manquante',
        'invalid-input-secret': 'Configuration serveur invalide',
        'missing-input-response': 'Token CAPTCHA manquant',
        'invalid-input-response': 'Token CAPTCHA invalide ou expiré',
        'bad-request': 'Requête invalide',
        'invalid-or-already-seen-response': 'Token expiré ou déjà utilisé',
        'not-using-dummy-passcode': 'Code de test invalide',
        'sitekey-secret-mismatch': 'Incompatibilité site key / secret key',
    };

    if (errorCodes.length === 0) {
        return 'Erreur de vérification inconnue';
    }

    const firstError = errorCodes[0];
    return errorMessages[firstError] || `Erreur: ${firstError}`;
}

/**
 * Middleware pour vérifier le token hCaptcha dans une requête
 * Utilisation avec Next.js API routes
 */
export async function withHCaptchaVerification(
    request: Request
): Promise<{ success: boolean; error?: string }> {
    try {
        const body = await request.json();
        const token = body.hcaptchaToken;

        if (!token) {
            return {
                success: false,
                error: 'Token CAPTCHA manquant',
            };
        }

        // Extraire l'IP du client
        const forwardedFor = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        const remoteIp = forwardedFor?.split(',')[0] || realIp || undefined;

        return await verifyHCaptchaToken(token, remoteIp);
    } catch (error) {
        console.error('[HCAPTCHA] Request parsing error:', error);
        return {
            success: false,
            error: 'Erreur de traitement de la requête',
        };
    }
}
