/**
 * OTP Store avec support Redis pour production
 * Utilise Redis en production, Map en développement
 */

import { Redis } from 'ioredis';

interface OTPData {
    code: string;
    expiresAt: Date;
    attempts: number;
    action: string;
}

/**
 * Store abstrait pour OTP
 */
export interface OTPStore {
    set(key: string, data: OTPData): Promise<void>;
    get(key: string): Promise<OTPData | undefined>;
    delete(key: string): Promise<void>;
    increment(key: string): Promise<void>;
}

/**
 * Store en mémoire (développement)
 */
class MemoryOTPStore implements OTPStore {
    private store = new Map<string, OTPData>();

    async set(key: string, data: OTPData): Promise<void> {
        this.store.set(key, data);
    }

    async get(key: string): Promise<OTPData | undefined> {
        return this.store.get(key);
    }

    async delete(key: string): Promise<void> {
        this.store.delete(key);
    }

    async increment(key: string): Promise<void> {
        const data = this.store.get(key);
        if (data) {
            data.attempts++;
        }
    }

    // Nettoyage des OTPs expirés
    cleanup(): void {
        const now = new Date();
        for (const [key, data] of this.store.entries()) {
            if (now > data.expiresAt) {
                this.store.delete(key);
            }
        }
    }
}

/**
 * Store Redis (production)
 */
class RedisOTPStore implements OTPStore {
    private redis: Redis;
    private prefix = 'otp:';

    constructor(redis: Redis) {
        this.redis = redis;
    }

    async set(key: string, data: OTPData): Promise<void> {
        const redisKey = this.prefix + key;
        const ttl = Math.floor((data.expiresAt.getTime() - Date.now()) / 1000);
        
        if (ttl > 0) {
            await this.redis.setex(
                redisKey,
                ttl,
                JSON.stringify({
                    code: data.code,
                    expiresAt: data.expiresAt.toISOString(),
                    attempts: data.attempts,
                    action: data.action,
                })
            );
        }
    }

    async get(key: string): Promise<OTPData | undefined> {
        const redisKey = this.prefix + key;
        const data = await this.redis.get(redisKey);
        
        if (!data) {
            return undefined;
        }

        const parsed = JSON.parse(data);
        return {
            code: parsed.code,
            expiresAt: new Date(parsed.expiresAt),
            attempts: parsed.attempts,
            action: parsed.action,
        };
    }

    async delete(key: string): Promise<void> {
        const redisKey = this.prefix + key;
        await this.redis.del(redisKey);
    }

    async increment(key: string): Promise<void> {
        const data = await this.get(key);
        if (data) {
            data.attempts++;
            await this.set(key, data);
        }
    }
}

/**
 * Factory pour créer le store approprié
 */
export function createOTPStore(): OTPStore {
    const redisUrl = process.env.REDIS_URL;
    
    if (redisUrl && process.env.NODE_ENV === 'production') {
        try {
            const redis = new Redis(redisUrl, {
                maxRetriesPerRequest: 3,
                retryStrategy: (times: number) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
            });

            redis.on('error', (error) => {
                console.error('❌ Redis OTP Store Error:', error);
            });

            console.log('✅ OTP Store: Redis configuré');
            return new RedisOTPStore(redis);
        } catch (error) {
            console.warn('⚠️ Redis non disponible, fallback vers Memory Store');
            return createMemoryStore();
        }
    }

    return createMemoryStore();
}

function createMemoryStore(): OTPStore {
    const store = new MemoryOTPStore();
    
    // Nettoyage périodique en mémoire
    if (typeof setInterval !== 'undefined') {
        setInterval(() => store.cleanup(), 60 * 1000);
    }
    
    console.log('⚠️ OTP Store: Memory (développement uniquement)');
    return store;
}

// Export singleton
export const otpStore = createOTPStore();
