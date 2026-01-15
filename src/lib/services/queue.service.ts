import { Queue, Worker, Job } from 'bullmq';
import { prisma } from '../prisma';
import { StatutIndexation } from '@prisma/client';

// Configuration Redis
const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Queue pour l'extraction de texte des arrêtés
export const ocrQueue = new Queue('text-extraction', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
    },
});

// Interface pour les données du job d'extraction
export interface TextExtractionJobData {
    arreteId: string;
    filePath: string;
}

/**
 * Worker pour l'extraction de texte des arrêtés PDF
 * Extrait le texte natif d'un arrêté PDF et met à jour la base de données
 */
export const ocrWorker = new Worker<TextExtractionJobData>(
    'text-extraction',
    async (job: Job<TextExtractionJobData>) => {
        const { arreteId, filePath } = job.data;

        console.log(`🚀 Démarrage de l'extraction de texte pour l'arrêté ${arreteId}`);

        try {
            // Mettre à jour le statut à EN_COURS
            await prisma.arrete.update({
                where: { id: arreteId },
                data: {
                    statutIndexation: StatutIndexation.EN_COURS,
                    messageErreur: null,
                },
            });

            await job.updateProgress(10);

            // Import dynamique du service d'extraction de texte
            const { pdfTextExtractor } = await import('./pdf-text-extractor.service');

            // Extraire le texte du PDF
            const result = await pdfTextExtractor.extractText(filePath);

            await job.updateProgress(80);

            // Nettoyer le texte si trouvé
            const cleanedText = result.hasText ? pdfTextExtractor.cleanText(result.text) : null;

            await job.updateProgress(90);

            // Mettre à jour l'arrêté avec le texte extrait
            await prisma.arrete.update({
                where: { id: arreteId },
                data: {
                    contenuOCR: cleanedText,
                    statutIndexation: result.hasText ? StatutIndexation.INDEXE : StatutIndexation.ERREUR,
                    dateIndexation: new Date(),
                    messageErreur: result.hasText ? null : 'PDF scanné - Texte non extractible',
                },
            });

            await job.updateProgress(100);

            console.log(`✅ Extraction terminée pour l'arrêté ${arreteId} (${result.pageCount} pages, ${result.hasText ? 'texte trouvé' : 'PDF scanné'})`);

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
    },
    {
        connection: redisConnection,
        concurrency: 5,
    }
);

// Événements du worker
ocrWorker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} complété`);
});

ocrWorker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} échoué:`, err);
});

/**
 * Ajoute un arrêté à la queue pour traitement OCR
 */
export async function addOCRJob(arreteId: string, filePath: string) {
    const job = await ocrQueue.add(
        'process-ocr',
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
    const progress = job.progress;

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
