import Redis from 'ioredis';

// Configuration Redis pour le système de queue
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Client Redis pour Bull
export const redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

// Gestion des événements Redis
redisClient.on('connect', () => {
    console.log('✅ Redis connecté avec succès');
});

redisClient.on('error', (error) => {
    console.error('❌ Erreur Redis:', error);
});

redisClient.on('ready', () => {
    console.log('✅ Redis prêt à recevoir des commandes');
});

export default redisClient;
