/**
 * Rate Limiting - Protection contre les abus d'API
 * Utilise un stockage en mémoire simple (pour production, utiliser Redis)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Stockage en mémoire des limites par IP
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration par défaut
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = 60; // 60 requêtes par minute

// Configuration par type d'endpoint
export const RATE_LIMITS = {
  // Endpoints d'authentification (plus stricts)
  auth: { windowMs: 15 * 60 * 1000, max: 10 }, // 10 tentatives par 15 minutes

  // Endpoints publics
  public: { windowMs: 60 * 1000, max: 30 }, // 30 requêtes par minute

  // Endpoints authentifiés standard
  standard: { windowMs: 60 * 1000, max: 100 }, // 100 requêtes par minute

  // Endpoints d'administration
  admin: { windowMs: 60 * 1000, max: 200 }, // 200 requêtes par minute

  // Endpoints de génération (PDF, attestations)
  generation: { windowMs: 60 * 1000, max: 10 }, // 10 générations par minute

  // Endpoints de notification
  notification: { windowMs: 60 * 1000, max: 20 }, // 20 notifications par minute
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Nettoie les entrées expirées du store
 */
function cleanupStore() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Nettoyage périodique toutes les 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupStore, 5 * 60 * 1000);
}

/**
 * Vérifie et applique le rate limiting pour une requête
 */
export function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'standard'
): { success: boolean; remaining: number; resetIn: number } {
  const config = RATE_LIMITS[type];
  const now = Date.now();
  const key = `${type}:${identifier}`;

  let entry = rateLimitStore.get(key);

  // Si pas d'entrée ou entrée expirée, créer une nouvelle
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
    return {
      success: true,
      remaining: config.max - 1,
      resetIn: config.windowMs,
    };
  }

  // Incrémenter le compteur
  entry.count++;

  // Vérifier si la limite est dépassée
  if (entry.count > config.max) {
    return {
      success: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  return {
    success: true,
    remaining: config.max - entry.count,
    resetIn: entry.resetTime - now,
  };
}

/**
 * Extrait l'identifiant (IP) d'une requête
 */
export function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback pour le développement
  return 'localhost';
}

/**
 * Middleware de rate limiting pour les API Routes
 * Usage:
 * const rateLimitResult = await rateLimit(request, 'standard');
 * if (!rateLimitResult.success) {
 *   return rateLimitResult.response;
 * }
 */
export async function rateLimit(
  request: Request,
  type: RateLimitType = 'standard'
): Promise<{ success: true } | { success: false; response: Response }> {
  const identifier = getClientIdentifier(request);
  const result = checkRateLimit(identifier, type);

  if (!result.success) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: 'Trop de requêtes. Veuillez réessayer plus tard.',
          retryAfter: Math.ceil(result.resetIn / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(result.resetIn / 1000)),
            'X-RateLimit-Limit': String(RATE_LIMITS[type].max),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(result.resetIn / 1000)),
          },
        }
      ),
    };
  }

  return { success: true };
}

/**
 * Headers de rate limit à ajouter aux réponses
 */
export function getRateLimitHeaders(
  identifier: string,
  type: RateLimitType = 'standard'
): Record<string, string> {
  const result = checkRateLimit(identifier, type);
  const config = RATE_LIMITS[type];

  return {
    'X-RateLimit-Limit': String(config.max),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetIn / 1000)),
  };
}
