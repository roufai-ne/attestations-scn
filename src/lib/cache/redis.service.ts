/**
 * Service de cache Redis
 * Fournit un système de cache centralisé pour améliorer les performances
 */

import Redis from 'ioredis';

// Durées de cache par défaut (en secondes)
const CACHE_TTL = {
    SHORT: 60,           // 1 minute
    MEDIUM: 300,         // 5 minutes
    LONG: 3600,          // 1 heure
    VERY_LONG: 86400,    // 24 heures
};

class CacheService {
    private client: Redis | null = null;
    private connected = false;

    constructor() {
        this.initialize();
    }

    private async initialize() {
        const redisUrl = process.env.REDIS_URL;

        if (!redisUrl) {
            console.warn('⚠️ REDIS_URL non configuré. Cache désactivé.');
            return;
        }

        try {
            this.client = new Redis(redisUrl, {
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                retryStrategy: (times) => {
                    if (times > 3) {
                        console.error('Redis: Impossible de se connecter après 3 tentatives');
                        return null;
                    }
                    return Math.min(times * 200, 2000);
                },
            });

            this.client.on('connect', () => {
                this.connected = true;
                console.log('✅ Redis connecté');
            });

            this.client.on('error', (err) => {
                console.error('Redis error:', err.message);
                this.connected = false;
            });

            this.client.on('close', () => {
                this.connected = false;
            });
        } catch (error) {
            console.error('Erreur initialisation Redis:', error);
        }
    }

    /**
     * Vérifie si le cache est disponible
     */
    isAvailable(): boolean {
        return this.connected && this.client !== null;
    }

    /**
     * Récupère une valeur du cache
     */
    async get<T>(key: string): Promise<T | null> {
        if (!this.isAvailable()) return null;

        try {
            const value = await this.client!.get(key);
            if (!value) return null;
            return JSON.parse(value) as T;
        } catch (error) {
            console.error(`Cache GET error [${key}]:`, error);
            return null;
        }
    }

    /**
     * Stocke une valeur dans le cache
     */
    async set(key: string, value: any, ttlSeconds: number = CACHE_TTL.MEDIUM): Promise<boolean> {
        if (!this.isAvailable()) return false;

        try {
            await this.client!.setex(key, ttlSeconds, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Cache SET error [${key}]:`, error);
            return false;
        }
    }

    /**
     * Supprime une valeur du cache
     */
    async delete(key: string): Promise<boolean> {
        if (!this.isAvailable()) return false;

        try {
            await this.client!.del(key);
            return true;
        } catch (error) {
            console.error(`Cache DELETE error [${key}]:`, error);
            return false;
        }
    }

    /**
     * Supprime toutes les clés correspondant à un pattern
     */
    async deletePattern(pattern: string): Promise<number> {
        if (!this.isAvailable()) return 0;

        try {
            const keys = await this.client!.keys(pattern);
            if (keys.length === 0) return 0;
            return await this.client!.del(...keys);
        } catch (error) {
            console.error(`Cache DELETE PATTERN error [${pattern}]:`, error);
            return 0;
        }
    }

    /**
     * Récupère ou calcule une valeur (cache-aside pattern)
     */
    async getOrSet<T>(
        key: string,
        factory: () => Promise<T>,
        ttlSeconds: number = CACHE_TTL.MEDIUM
    ): Promise<T> {
        // Essayer le cache
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        // Calculer la valeur
        const value = await factory();

        // Mettre en cache (ne pas bloquer)
        this.set(key, value, ttlSeconds).catch(() => { });

        return value;
    }

    /**
     * Invalide le cache pour une entité spécifique
     */
    async invalidate(type: 'user' | 'demande' | 'attestation' | 'stats', id?: string): Promise<void> {
        if (!this.isAvailable()) return;

        const patterns = id
            ? [`${type}:${id}:*`, `${type}:list:*`]
            : [`${type}:*`];

        for (const pattern of patterns) {
            await this.deletePattern(pattern);
        }
    }

    /**
     * Génère une clé de cache standardisée
     */
    key(type: string, ...parts: (string | number)[]): string {
        return [type, ...parts].join(':');
    }

    /**
     * Ferme la connexion Redis
     */
    async close(): Promise<void> {
        if (this.client) {
            await this.client.quit();
            this.connected = false;
        }
    }
}

// Export singleton
export const cacheService = new CacheService();

// Export des constantes de TTL
export { CACHE_TTL };

// Types pour les clés de cache courantes
export const CacheKeys = {
    // Stats
    statsGlobales: () => 'stats:globales',
    statsAgent: (userId: string) => `stats:agent:${userId}`,
    statsDirecteur: (userId: string) => `stats:directeur:${userId}`,

    // Demandes
    demande: (id: string) => `demande:${id}`,
    demandesListe: (filters: string) => `demande:list:${filters}`,

    // Attestations
    attestation: (id: string) => `attestation:${id}`,
    attestationsListe: (filters: string) => `attestation:list:${filters}`,

    // Utilisateurs
    user: (id: string) => `user:${id}`,

    // Arrêtés
    arrete: (id: string) => `arrete:${id}`,
    arretesRecherche: (query: string) => `arrete:search:${query}`,
};
