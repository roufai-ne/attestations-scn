/**
 * Queue de notifications asynchrones avec Bull et Redis
 * Permet de traiter les envois de notifications en arrière-plan
 * Basé sur le Prompt 6.1 - Services de Notification
 */

import Queue, { Job } from 'bull';
import { notificationService } from './notification.service';
import { TypeNotification, NotificationData } from './templates';
import { CanalNotification } from '@prisma/client';

// Configuration Redis
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

export interface NotificationJob {
  demandeId: string;
  type: TypeNotification;
  canaux: CanalNotification[];
  data: NotificationData;
  messagePersonnalise?: string;
}

/**
 * Queue pour les notifications
 */
export const notificationQueue = new Queue<NotificationJob>('notifications', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3, // Nombre de tentatives en cas d'échec
    backoff: {
      type: 'exponential', // Délai exponentiel entre les tentatives
      delay: 5000, // Délai initial de 5 secondes
    },
    removeOnComplete: 100, // Garder les 100 derniers jobs complétés
    removeOnFail: 500, // Garder les 500 derniers jobs échoués
  },
});

/**
 * Traitement des jobs de notification
 */
notificationQueue.process(async (job: Job<NotificationJob>) => {
  const { demandeId, type, canaux, data, messagePersonnalise } = job.data;

  console.log(`Traitement notification pour demande ${demandeId}...`);

  try {
    const results = await notificationService.send({
      demandeId,
      type,
      canaux,
      data,
      messagePersonnalise,
    });

    // Vérifier si au moins un canal a réussi
    const hasSuccess = results.some((r) => r.success);

    if (!hasSuccess) {
      throw new Error('Échec de tous les canaux de notification');
    }

    console.log(`Notification envoyée pour demande ${demandeId}`);
    return results;
  } catch (error) {
    console.error(`Erreur traitement notification pour demande ${demandeId}:`, error);
    throw error; // Will trigger retry
  }
});

/**
 * Événements de la queue
 */
notificationQueue.on('completed', (job: Job, result: any) => {
  console.log(`✓ Job ${job.id} complété:`, result);
});

notificationQueue.on('failed', (job: Job, err: Error) => {
  console.error(`✗ Job ${job.id} échoué:`, err.message);
});

notificationQueue.on('stalled', (job: Job) => {
  console.warn(`⚠ Job ${job.id} bloqué`);
});

/**
 * Ajoute une notification à la queue
 */
export async function enqueueNotification(
  jobData: NotificationJob,
  options?: {
    delay?: number; // Délai avant traitement (ms)
    priority?: number; // Priorité (1-10, 1 = haute)
  }
): Promise<Job<NotificationJob>> {
  return notificationQueue.add(jobData, {
    delay: options?.delay,
    priority: options?.priority,
  });
}

/**
 * Envoie une notification immédiate (haute priorité, sans délai)
 */
export async function sendNotificationNow(jobData: NotificationJob): Promise<Job<NotificationJob>> {
  return enqueueNotification(jobData, { priority: 1 });
}

/**
 * Envoie une notification programmée
 */
export async function scheduleNotification(
  jobData: NotificationJob,
  delayMs: number
): Promise<Job<NotificationJob>> {
  return enqueueNotification(jobData, { delay: delayMs });
}

/**
 * Statistiques de la queue
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    notificationQueue.getWaitingCount(),
    notificationQueue.getActiveCount(),
    notificationQueue.getCompletedCount(),
    notificationQueue.getFailedCount(),
    notificationQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

/**
 * Vide la queue (à utiliser avec précaution)
 */
export async function clearQueue() {
  await notificationQueue.empty();
  console.log('Queue vidée');
}

/**
 * Récupère les jobs échoués pour réessayer
 */
export async function getFailedJobs() {
  return notificationQueue.getFailed();
}

/**
 * Réessaye un job échoué
 */
export async function retryFailedJob(jobId: string) {
  const job = await notificationQueue.getJob(jobId);
  if (job) {
    await job.retry();
    console.log(`Job ${jobId} réessayé`);
  }
}

/**
 * Réessaye tous les jobs échoués
 */
export async function retryAllFailedJobs() {
  const failedJobs = await getFailedJobs();
  for (const job of failedJobs) {
    await job.retry();
  }
  console.log(`${failedJobs.length} jobs réessayés`);
}

/**
 * Ferme proprement la queue (à appeler lors de l'arrêt de l'application)
 */
export async function closeQueue() {
  await notificationQueue.close();
  console.log('Queue fermée');
}

// Gestion de l'arrêt propre
if (process.env.NODE_ENV !== 'test') {
  process.on('SIGTERM', async () => {
    console.log('SIGTERM reçu, fermeture de la queue...');
    await closeQueue();
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT reçu, fermeture de la queue...');
    await closeQueue();
  });
}
