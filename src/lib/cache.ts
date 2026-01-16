/**
 * Système de cache basé sur Redis
 * Utilise le client Redis existant pour mettre en cache les configurations et données fréquemment accédées
 */

import redisClient from './redis.config';

interface CacheOptions {
  ttl?: number; // Time to live en secondes (défaut: 5 minutes)
}

/**
 * Service de cache Redis
 */
class RedisCache {
  private prefix: string = 'cache:';
  private defaultTTL: number = 5 * 60; // 5 minutes par défaut en secondes

  /**
   * Récupère une valeur du cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(this.prefix + key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`[Cache] Erreur get ${key}:`, error);
      return null;
    }
  }

  /**
   * Stocke une valeur dans le cache
   */
  async set<T>(key: string, data: T, options?: CacheOptions): Promise<boolean> {
    try {
      const ttl = options?.ttl ?? this.defaultTTL;
      const serialized = JSON.stringify(data);
      await redisClient.setex(this.prefix + key, ttl, serialized);
      return true;
    } catch (error) {
      console.error(`[Cache] Erreur set ${key}:`, error);
      return false;
    }
  }

  /**
   * Supprime une entrée du cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      await redisClient.del(this.prefix + key);
      return true;
    } catch (error) {
      console.error(`[Cache] Erreur delete ${key}:`, error);
      return false;
    }
  }

  /**
   * Supprime toutes les entrées correspondant à un pattern
   */
  async deleteByPattern(pattern: string): Promise<number> {
    try {
      const keys = await redisClient.keys(this.prefix + pattern);
      if (keys.length === 0) return 0;
      await redisClient.del(...keys);
      return keys.length;
    } catch (error) {
      console.error(`[Cache] Erreur deleteByPattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Récupère ou calcule une valeur (pattern cache-aside)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    await this.set(key, data, options);
    return data;
  }

  /**
   * Vérifie si une clé existe
   */
  async has(key: string): Promise<boolean> {
    try {
      const exists = await redisClient.exists(this.prefix + key);
      return exists === 1;
    } catch (error) {
      console.error(`[Cache] Erreur has ${key}:`, error);
      return false;
    }
  }

  /**
   * Récupère le TTL restant d'une clé (en secondes)
   */
  async ttl(key: string): Promise<number> {
    try {
      return await redisClient.ttl(this.prefix + key);
    } catch (error) {
      console.error(`[Cache] Erreur ttl ${key}:`, error);
      return -1;
    }
  }
}

// Instance globale du cache
export const cache = new RedisCache();

/**
 * Clés de cache prédéfinies pour les configurations
 */
export const CACHE_KEYS = {
  // Configurations
  CONFIG_SMTP: 'config:smtp',
  CONFIG_SMS: 'config:sms',
  CONFIG_WHATSAPP: 'config:whatsapp',
  CONFIG_ATTESTATION: 'config:attestation',
  CONFIG_NOTIFICATIONS: 'config:notifications',

  // Templates
  TEMPLATES_EMAIL: 'templates:email',
  TEMPLATES_SMS: 'templates:sms',
  TEMPLATES_WHATSAPP: 'templates:whatsapp',

  // Statistiques
  STATS_DASHBOARD: 'stats:dashboard',
  STATS_ADMIN: 'stats:admin',

  // Utilisateurs
  USER_BY_ID: (id: string) => `user:${id}`,
} as const;

/**
 * Durées de cache prédéfinies (en secondes)
 */
export const CACHE_TTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 5 * 60,      // 5 minutes
  LONG: 15 * 60,       // 15 minutes
  VERY_LONG: 60 * 60,  // 1 heure
} as const;

/**
 * Invalide le cache pour des clés spécifiques
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  for (const key of keys) {
    if (key.endsWith('*')) {
      // Supprime par pattern si se termine par *
      await cache.deleteByPattern(key);
    } else {
      await cache.delete(key);
    }
  }
}

export default cache;
