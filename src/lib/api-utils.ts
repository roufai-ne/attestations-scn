/**
 * Utilitaires pour les API Routes
 * Centralise les patterns communs : rate limiting, erreurs, réponses
 */

import { NextResponse } from 'next/server';
import { rateLimit, RateLimitType, getClientIdentifier, getRateLimitHeaders } from './rate-limit';

/**
 * Réponse d'erreur standardisée
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details && process.env.NODE_ENV === 'development' ? { details } : {}),
    },
    { status }
  );
}

/**
 * Réponse de succès standardisée
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Messages d'erreur courants
 */
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Non autorisé',
  FORBIDDEN: 'Accès refusé',
  NOT_FOUND: 'Ressource non trouvée',
  BAD_REQUEST: 'Requête invalide',
  VALIDATION_ERROR: 'Données invalides',
  RATE_LIMITED: 'Trop de requêtes. Veuillez réessayer plus tard.',
  SERVER_ERROR: 'Erreur serveur',
} as const;

/**
 * Wrapper pour les handlers d'API avec rate limiting
 */
export async function withRateLimit<T>(
  request: Request,
  type: RateLimitType,
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse> {
  const rateLimitResult = await rateLimit(request, type);

  if (!rateLimitResult.success) {
    return rateLimitResult.response as NextResponse;
  }

  try {
    const response = await handler();

    // Ajouter les headers de rate limit à la réponse
    const identifier = getClientIdentifier(request);
    const headers = getRateLimitHeaders(identifier, type);

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR,
      500,
      error
    );
  }
}

/**
 * Vérifie si l'utilisateur est admin
 */
export function isAdmin(role?: string): boolean {
  return role === 'ADMIN';
}

/**
 * Vérifie si l'utilisateur est directeur ou admin
 */
export function isDirecteurOrAdmin(role?: string): boolean {
  return role === 'DIRECTEUR' || role === 'ADMIN';
}

/**
 * Vérifie si l'utilisateur est agent, directeur ou admin
 */
export function isAgentOrAbove(role?: string): boolean {
  return ['AGENT', 'DIRECTEUR', 'ADMIN'].includes(role || '');
}

/**
 * Vérifie si l'utilisateur a un rôle de saisie ou supérieur
 */
export function isSaisieOrAbove(role?: string): boolean {
  return ['SAISIE', 'AGENT', 'DIRECTEUR', 'ADMIN'].includes(role || '');
}

/**
 * Log d'audit pour les actions importantes
 */
export interface AuditLogData {
  action: string;
  userId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Extrait les métadonnées de la requête pour l'audit
 */
export function getRequestMetadata(request: Request): {
  ipAddress: string;
  userAgent: string;
} {
  return {
    ipAddress: getClientIdentifier(request),
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}

/**
 * Pagination standardisée
 */
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function getPaginationParams(
  searchParams: URLSearchParams,
  defaultLimit: number = 20,
  maxLimit: number = 100
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(searchParams.get('limit') || String(defaultLimit), 10))
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Réponse paginée standardisée
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): NextResponse<PaginatedResponse<T>> {
  const totalPages = Math.ceil(total / params.limit);

  return NextResponse.json({
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasMore: params.page < totalPages,
    },
  });
}
