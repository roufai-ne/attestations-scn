/**
 * Configuration de sécurité centralisée
 */

export const SECURITY_CONFIG = {
    // Session
    SESSION_MAX_AGE: 8 * 60 * 60, // 8 heures

    // Rate Limiting
    RATE_LIMIT: {
        // Authentification (strict)
        AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        AUTH_MAX_ATTEMPTS: 10,

        // API Standard
        API_WINDOW_MS: 60 * 1000, // 1 minute
        API_MAX_REQUESTS: 100,

        // Génération PDF
        GENERATION_WINDOW_MS: 60 * 1000,
        GENERATION_MAX_REQUESTS: 10,
    },

    // Verrouillage de compte
    ACCOUNT_LOCKOUT: {
        MAX_FAILED_ATTEMPTS: 5,
        LOCKOUT_DURATION_MS: 30 * 60 * 1000, // 30 minutes
    },

    // PIN du directeur
    PIN_CONFIG: {
        MIN_LENGTH: 4,
        MAX_LENGTH: 6,
        MAX_ATTEMPTS: 3,
        LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
    },

    // Mots de passe
    PASSWORD_CONFIG: {
        MIN_LENGTH: 8,
        REQUIRE_UPPERCASE: true,
        REQUIRE_LOWERCASE: true,
        REQUIRE_NUMBER: true,
        REQUIRE_SPECIAL: false, // Optionnel pour faciliter l'usage
        BCRYPT_ROUNDS: 10,
    },

    // Upload de fichiers
    UPLOAD_CONFIG: {
        // Images
        ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
        MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5 Mo

        // Excel
        ALLOWED_EXCEL_TYPES: [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
        ],
        MAX_EXCEL_SIZE: 10 * 1024 * 1024, // 10 Mo

        // PDF
        ALLOWED_PDF_TYPES: ['application/pdf'],
        MAX_PDF_SIZE: 20 * 1024 * 1024, // 20 Mo
    },

    // Tokens
    TOKENS: {
        PASSWORD_RESET_EXPIRY: 60 * 60 * 1000, // 1 heure
        EMAIL_VERIFICATION_EXPIRY: 24 * 60 * 60 * 1000, // 24 heures
    },

    // Audit
    AUDIT: {
        RETENTION_DAYS: 90, // Garder les logs 90 jours
        LOG_CRITICAL_TO_CONSOLE: true,
    },

    // Cookies
    COOKIES: {
        SECURE: process.env.NODE_ENV === 'production',
        HTTP_ONLY: true,
        SAME_SITE: 'lax' as const,
    },
} as const;

/**
 * Valide qu'un mot de passe respecte les règles de sécurité
 */
export function validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];
    const config = SECURITY_CONFIG.PASSWORD_CONFIG;

    if (password.length < config.MIN_LENGTH) {
        errors.push(`Le mot de passe doit contenir au moins ${config.MIN_LENGTH} caractères`);
    }

    if (config.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
        errors.push('Le mot de passe doit contenir au moins une majuscule');
    }

    if (config.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
        errors.push('Le mot de passe doit contenir au moins une minuscule');
    }

    if (config.REQUIRE_NUMBER && !/[0-9]/.test(password)) {
        errors.push('Le mot de passe doit contenir au moins un chiffre');
    }

    if (config.REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Le mot de passe doit contenir au moins un caractère spécial');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Valide un type de fichier uploadé
 */
export function validateFileType(
    mimeType: string,
    category: 'image' | 'excel' | 'pdf'
): boolean {
    const config = SECURITY_CONFIG.UPLOAD_CONFIG;

    switch (category) {
        case 'image':
            return (config.ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType);
        case 'excel':
            return (config.ALLOWED_EXCEL_TYPES as readonly string[]).includes(mimeType);
        case 'pdf':
            return (config.ALLOWED_PDF_TYPES as readonly string[]).includes(mimeType);
        default:
            return false;
    }
}

/**
 * Valide la taille d'un fichier uploadé
 */
export function validateFileSize(
    size: number,
    category: 'image' | 'excel' | 'pdf'
): boolean {
    const config = SECURITY_CONFIG.UPLOAD_CONFIG;

    switch (category) {
        case 'image':
            return size <= config.MAX_IMAGE_SIZE;
        case 'excel':
            return size <= config.MAX_EXCEL_SIZE;
        case 'pdf':
            return size <= config.MAX_PDF_SIZE;
        default:
            return false;
    }
}

export default SECURITY_CONFIG;
