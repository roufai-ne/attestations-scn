'use client';

import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useRef, useState } from 'react';

interface HCaptchaWidgetProps {
    onSuccess: (token: string, eKey?: string) => void;
    onError?: () => void;
    onExpire?: () => void;
    onLoad?: () => void;
    onOpen?: () => void;
    onClose?: () => void;
    className?: string;
    size?: 'normal' | 'compact' | 'invisible';
    tabindex?: number;
    reCaptchaCompat?: boolean;
}

/**
 * Composant hCaptcha pour la protection CAPTCHA
 * Documentation: https://docs.hcaptcha.com/
 * 
 * @param onSuccess - Callback appelé avec le token et l'eKey (session ID) lors de la vérification réussie
 * @param onError - Callback appelé en cas d'erreur
 * @param onExpire - Callback appelé quand le token expire
 * @param onLoad - Callback appelé quand l'API hCaptcha est chargée
 * @param onOpen - Callback appelé quand le challenge s'ouvre
 * @param onClose - Callback appelé quand le challenge se ferme
 * @param size - Taille du widget : 'normal' (défaut), 'compact', ou 'invisible'
 * @param tabindex - Index de tabulation pour l'accessibilité (défaut: 0)
 * @param reCaptchaCompat - Compatibilité avec reCAPTCHA (défaut: true, mettre false si reCAPTCHA est présent)
 */
export function HCaptchaWidget({
    onSuccess,
    onError,
    onExpire,
    onLoad,
    onOpen,
    onClose,
    className = '',
    size = 'normal',
    tabindex = 0,
    reCaptchaCompat = true,
}: HCaptchaWidgetProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const captchaRef = useRef<HCaptcha>(null);
    const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

    // En développement, si la clé n'est pas définie, afficher un message
    if (!siteKey) {
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
                    <p className="font-semibold">⚠️ hCaptcha non configuré</p>
                    <p className="mt-1">
                        Définissez NEXT_PUBLIC_HCAPTCHA_SITE_KEY dans .env.local
                    </p>
                    <button
                        type="button"
                        onClick={() => onSuccess('dev-bypass-token')}
                        className="mt-2 rounded bg-yellow-200 px-3 py-1 text-xs hover:bg-yellow-300"
                    >
                        Bypass pour dev
                    </button>
                </div>
            );
        }
        return (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                Erreur: Configuration hCaptcha manquante
            </div>
        );
    }

    const handleVerify = (token: string, eKey: string) => {
        setStatus('success');
        onSuccess(token, eKey);
    };

    const handleError = () => {
        setStatus('error');
        onError?.();
        // Auto-reset après une erreur
        setTimeout(() => {
            captchaRef.current?.resetCaptcha();
            setStatus('idle');
        }, 2000);
    };

    const handleExpire = () => {
        setStatus('idle');
        onExpire?.();
        // Auto-reset après expiration
        captchaRef.current?.resetCaptcha();
    };

    return (
        <div className={`hcaptcha-container ${className}`}>
            <div className="inline-block">
                <HCaptcha
                    ref={captchaRef}
                    sitekey={siteKey}
                    size={size}
                    onVerify={handleVerify}
                    onError={handleError}
                    onExpire={handleExpire}
                    onLoad={onLoad}
                    onOpen={onOpen}
                    onClose={onClose}
                    languageOverride="fr"
                    tabIndex={tabindex}
                    reCaptchaCompat={reCaptchaCompat}
                />
            </div>

            {/* Indicateur de statut - affiché en dessous, centré */}
            {status === 'error' && (
                <p className="mt-2 text-sm text-red-600 text-center">
                    Échec de la vérification. Réinitialisation...
                </p>
            )}
        </div>
    );
}

/**
 * Hook pour gérer l'état du token hCaptcha avec ref
 * Utilise les méthodes natives de l'API hCaptcha pour un meilleur contrôle
 */
export function useHCaptcha() {
    const [token, setToken] = useState<string | null>(null);
    const [eKey, setEKey] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState(false);
    const captchaRef = useRef<HCaptcha>(null);

    const handleSuccess = (newToken: string, newEKey?: string) => {
        setToken(newToken);
        setEKey(newEKey || null);
        setIsVerified(true);
    };

    const handleError = () => {
        setToken(null);
        setEKey(null);
        setIsVerified(false);
    };

    const handleExpire = () => {
        setToken(null);
        setEKey(null);
        setIsVerified(false);
    };

    const reset = () => {
        setToken(null);
        setEKey(null);
        setIsVerified(false);
        // Utiliser la méthode native resetCaptcha() si disponible
        captchaRef.current?.resetCaptcha();
    };

    const execute = async () => {
        // Méthode pour déclencher le CAPTCHA programmatiquement
        return captchaRef.current?.execute();
    };

    const getResponse = () => {
        // Récupérer le token actuel via l'API
        return captchaRef.current?.getResponse();
    };

    const getRespKey = () => {
        // Récupérer l'ID de référence du challenge
        return captchaRef.current?.getRespKey();
    };

    return {
        token,
        eKey,
        isVerified,
        captchaRef,
        handleSuccess,
        handleError,
        handleExpire,
        reset,
        execute,
        getResponse,
        getRespKey,
    };
}

