import Queue from 'bull';
import redisClient from '../redis.config';
import { ocrService } from './ocr.service';
import { prisma } from '../prisma';
import { StatutIndexation } from '@prisma/client';

// Queue pour le traitement OCR des arrêtés
export const ocrQueue = new Queue('ocr-processing', {
    redis: {
        port: parseInt(process.env.REDIS_PORT || '6379'),
        host: process.env.REDIS_HOST || 'localhost',
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: 100, // Garder les 100 derniers jobs complétés
        removeOnFail: 200, // Garder les 200 derniers jobs échoués
    },
});

// Interface pour les données du job OCR
export interface OCRJobData {
    arreteId: string;
    filePath: string;
}

/**
 * Processeur de jobs OCR
 * Extrait le texte d'un arrêté PDF et met à jour la base de données
 */
ocrQueue.process(async (job) => {
    const { arreteId, filePath } = job.data as OCRJobData;

    console.log(`🚀 Démarrage du job OCR pour l'arrêté ${arreteId}`);

    try {
        // Mettre à jour le statut à EN_COURS
        await prisma.arrete.update({
            where: { id: arreteId },
            data: {
                statutIndexation: StatutIndexation.EN_COURS,
                messageErreur: null,
            },
        });

        job.progress(10);

        // Extraire le texte via OCR
        const result = await ocrService.extractTextFromPDF(filePath);

        job.progress(80);

        // Nettoyer le texte
        const cleanedText = ocrService.cleanText(result.text);

        job.progress(90);

        // Mettre à jour l'arrêté avec le contenu OCR
        await prisma.arrete.update({
            where: { id: arreteId },
            data: {
                contenuOCR: cleanedText,
                statutIndexation: StatutIndexation.INDEXE,
                dateIndexation: new Date(),
                messageErreur: null,
            },
        });

        job.progress(100);

        console.log(`✅ Job OCR terminé pour l'arrêté ${arreteId} (${result.pageCount} pages, confiance: ${result.confidence.toFixed(2)}%)`);

        return {
            success: true,
            arreteId,
            pageCount: result.pageCount,
            confidence: result.confidence,
            textLength: cleanedText.length,
        };

    } catch (error) {
        console.error(`❌ Erreur lors du traitement OCR de l'arrêté ${arreteId}:`, error);

        // Mettre à jour le statut à ERREUR
        await prisma.arrete.update({
            where: { id: arreteId },
            data: {
                statutIndexation: StatutIndexation.ERREUR,
                messageErreur: error instanceof Error ? error.message : 'Erreur inconnue',
            },
        });

        throw error;
    }
});

// Événements de la queue
ocrQueue.on('completed', (job, result) => {
    console.log(`✅ Job ${job.id} complété:`, result);
});

ocrQueue.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} échoué:`, err);
});

ocrQueue.on('stalled', (job) => {
    console.warn(`⚠️ Job ${job.id} bloqué`);
});

/**
 * Ajoute un arrêté à la queue pour traitement OCR
 */
export async function addOCRJob(arreteId: string, filePath: string) {
    const job = await ocrQueue.add(
        { arreteId, filePath },
        {
            jobId: `ocr-${arreteId}`,
            priority: 1,
        }
    );

    console.log(`📋 Job OCR ajouté à la queue: ${job.id}`);

    return job;
}

/**
 * Obtient le statut d'un job OCR
 */
export async function getOCRJobStatus(arreteId: string) {
    const job = await ocrQueue.getJob(`ocr-${arreteId}`);

    if (!job) {
        return null;
    }

    const state = await job.getState();
    const progress = job.progress();

    return {
        id: job.id,
        state,
        progress,
        data: job.data,
        failedReason: job.failedReason,
        finishedOn: job.finishedOn,
    };
}

export default ocrQueue;
