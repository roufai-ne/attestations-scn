/**
 * Utilitaires de validation et gestion d'erreurs API
 */

import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

/**
 * Réponse d'erreur standard
 */
export interface ApiError {
    error: string;
    code?: string;
    details?: any;
}

/**
 * Crée une réponse d'erreur standardisée
 */
export function errorResponse(
    message: string,
    status: number = 400,
    details?: any
): NextResponse<ApiError> {
    const response: ApiError = { error: message };
    if (details) {
        response.details = details;
    }
    return NextResponse.json(response, { status });
}

/**
 * Crée une réponse de succès standardisée
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse<T> {
    return NextResponse.json(data, { status });
}

/**
 * Valide les données avec un schéma Zod
 * Retourne les données validées ou une réponse d'erreur
 */
export function validateRequest<T extends z.ZodSchema>(
    schema: T,
    data: unknown
): { success: true; data: z.infer<T> } | { success: false; response: NextResponse<ApiError> } {
    try {
        const validated = schema.parse(data);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof ZodError) {
            const formattedErrors = error.errors.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
            }));

            return {
                success: false,
                response: errorResponse('Données invalides', 400, formattedErrors),
            };
        }

        return {
            success: false,
            response: errorResponse('Erreur de validation', 400),
        };
    }
}

/**
 * Handler d'erreur global pour les API routes
 */
export function handleApiError(error: unknown): NextResponse<ApiError> {
    console.error('[API_ERROR]', error);

    // Erreurs Prisma
    if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as { code: string; meta?: { target?: string[] } };

        switch (prismaError.code) {
            case 'P2002': // Unique constraint violation
                const field = prismaError.meta?.target?.[0] || 'champ';
                return errorResponse(`Le ${field} existe déjà`, 409);

            case 'P2025': // Record not found
                return errorResponse('Enregistrement non trouvé', 404);

            case 'P2003': // Foreign key constraint failed
                return errorResponse('Référence invalide', 400);

            case 'P2014': // Relation violation
                return errorResponse('Violation de relation', 400);
        }
    }

    // Erreurs standard
    if (error instanceof Error) {
        // Ne pas exposer les détails internes en production
        if (process.env.NODE_ENV === 'production') {
            return errorResponse('Erreur interne du serveur', 500);
        }
        return errorResponse(error.message, 500);
    }

    return errorResponse('Erreur interne du serveur', 500);
}

/**
 * Wrapper pour les API routes avec gestion automatique des erreurs
 */
export function withErrorHandler<T>(
    handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiError>> {
    return handler().catch(handleApiError);
}

/**
 * Codes d'erreur métier standardisés
 */
export const ERROR_CODES = {
    // Auth
    UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
    FORBIDDEN: 'AUTH_FORBIDDEN',
    INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
    SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',

    // Demande
    DEMANDE_NOT_FOUND: 'DEMANDE_NOT_FOUND',
    DEMANDE_ALREADY_EXISTS: 'DEMANDE_ALREADY_EXISTS',
    DEMANDE_INVALID_STATUS: 'DEMANDE_INVALID_STATUS',

    // Attestation
    ATTESTATION_NOT_FOUND: 'ATTESTATION_NOT_FOUND',
    ATTESTATION_ALREADY_SIGNED: 'ATTESTATION_ALREADY_SIGNED',

    // Signature
    INVALID_PIN: 'SIGNATURE_INVALID_PIN',
    PIN_LOCKED: 'SIGNATURE_PIN_LOCKED',

    // Validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',

    // Générique
    NOT_FOUND: 'NOT_FOUND',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
