/**
 * Gestion sécurisée des erreurs API
 * Évite les fuites d'informations sensibles
 */

import { NextResponse } from 'next/server';

interface APIErrorResponse {
    error: string;
    code?: string;
    details?: unknown;
}

/**
 * Erreurs utilisateur classifiées
 */
export const API_ERRORS = {
    // Authentification
    UNAUTHORIZED: { message: 'Non authentifié', status: 401 },
    FORBIDDEN: { message: 'Accès refusé', status: 403 },
    INVALID_CREDENTIALS: { message: 'Identifiants invalides', status: 401 },
    ACCOUNT_LOCKED: { message: 'Compte verrouillé. Réessayez plus tard.', status: 423 },

    // Validation
    VALIDATION_ERROR: { message: 'Données invalides', status: 400 },
    MISSING_FIELDS: { message: 'Champs obligatoires manquants', status: 400 },
    INVALID_FORMAT: { message: 'Format invalide', status: 400 },

    // Ressources
    NOT_FOUND: { message: 'Ressource introuvable', status: 404 },
    ALREADY_EXISTS: { message: 'Cette ressource existe déjà', status: 409 },

    // Rate limiting
    TOO_MANY_REQUESTS: { message: 'Trop de requêtes. Veuillez réessayer plus tard.', status: 429 },

    // Serveur
    INTERNAL_ERROR: { message: 'Une erreur est survenue. Veuillez réessayer.', status: 500 },
    SERVICE_UNAVAILABLE: { message: 'Service temporairement indisponible', status: 503 },

    // Fichiers
    FILE_TOO_LARGE: { message: 'Fichier trop volumineux', status: 413 },
    INVALID_FILE_TYPE: { message: 'Type de fichier non autorisé', status: 415 },
} as const;

export type APIErrorCode = keyof typeof API_ERRORS;

/**
 * Crée une réponse d'erreur sécurisée
 * Ne révèle pas les détails internes de l'erreur
 */
export function createErrorResponse(
    code: APIErrorCode,
    details?: string,
    debugInfo?: unknown
): NextResponse<APIErrorResponse> {
    const errorConfig = API_ERRORS[code];

    // Log l'erreur côté serveur avec les détails complets
    if (debugInfo) {
        console.error(`[API Error] ${code}:`, debugInfo);
    }

    return NextResponse.json(
        {
            error: errorConfig.message,
            code,
            // N'inclure les détails que si c'est sûr (pas d'info sensible)
            ...(details && { details }),
        },
        { status: errorConfig.status }
    );
}

/**
 * Handler d'erreur générique pour les routes API
 * Attrape toutes les erreurs et les convertit en réponses sécurisées
 */
export function handleAPIError(error: unknown): NextResponse<APIErrorResponse> {
    // Erreurs Prisma connues
    if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as { code: string; meta?: unknown };

        switch (prismaError.code) {
            case 'P2002': // Unique constraint violation
                return createErrorResponse('ALREADY_EXISTS');
            case 'P2025': // Record not found
                return createErrorResponse('NOT_FOUND');
            default:
                // Log l'erreur Prisma mais ne pas exposer les détails
                console.error('[Prisma Error]', prismaError.code, prismaError.meta);
        }
    }

    // Erreurs de validation Zod
    if (error && typeof error === 'object' && 'issues' in error) {
        return createErrorResponse('VALIDATION_ERROR');
    }

    // Erreur générique
    console.error('[API Error]', error);
    return createErrorResponse('INTERNAL_ERROR');
}

/**
 * Wrapper pour les handlers d'API avec gestion d'erreur automatique
 */
export function withErrorHandler<T>(
    handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | APIErrorResponse>> {
    return handler().catch((error) => handleAPIError(error));
}

/**
 * Créer une réponse de succès standardisée
 */
export function createSuccessResponse<T>(
    data: T,
    status: number = 200
): NextResponse<T> {
    return NextResponse.json(data, { status });
}

/**
 * Messages d'erreur utilisateur-friendly
 */
export const USER_MESSAGES = {
    LOGIN_SUCCESS: 'Connexion réussie',
    LOGIN_FAILED: 'Identifiants incorrects',
    LOGOUT_SUCCESS: 'Déconnexion réussie',
    PASSWORD_CHANGED: 'Mot de passe modifié avec succès',
    PASSWORD_RESET_SENT: 'Si un compte existe, un email a été envoyé',
    PIN_CHANGED: 'Code PIN modifié avec succès',
    ACCOUNT_UPDATED: 'Profil mis à jour',
    DEMANDE_CREATED: 'Demande enregistrée avec succès',
    DEMANDE_VALIDATED: 'Demande validée',
    DEMANDE_REJECTED: 'Demande rejetée',
    ATTESTATION_SIGNED: 'Attestation signée avec succès',
    FILE_UPLOADED: 'Fichier téléchargé avec succès',
} as const;
