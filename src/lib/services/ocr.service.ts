// Charger les polyfills AVANT tout autre import
import '../polyfills/promise-with-resolvers';
import '../polyfills/dom-matrix';
import '../polyfills/path2d';
import '../polyfills/buffer-transfertofixedlength';
import '../polyfills/image-data';

import Tesseract from 'tesseract.js';
import { readFile } from 'fs/promises';
import path from 'path';

// Pas d'import statique de pdfjs-dist - on le charge dynamiquement
let pdfjsLib: any = null;
let pdfjsWorkerModule: any = null;
let isInitialized = false;

/**
 * Initialise pdfjs avec le worker (import dynamique)
 */
async function initializePdfjs() {
    if (isInitialized) {
        return pdfjsLib;
    }

    // Import dynamique de pdfjs-dist APRÈS que le polyfill soit défini
    pdfjsLib = await import('pdfjs-dist');
    
    // Configuration du worker pdfjs
    if (typeof window === 'undefined') {
        try {
            if (!pdfjsWorkerModule) {
                pdfjsWorkerModule = await import('pdfjs-dist/build/pdf.worker.mjs');
            }
            pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerModule.default;
        } catch (error) {
            console.warn('⚠️ Impossible de charger le worker pdfjs:', error);
        }
    }
    
    isInitialized = true;
    return pdfjsLib;
}

export interface OCRResult {
    text: string;
    confidence: number;
    pageCount: number;
    processingTime: number;
}

/**
 * Service d'extraction de texte depuis des fichiers PDF via OCR
 */
export class OCRService {
    /**
     * Extrait le texte d'un fichier PDF en utilisant Tesseract.js
     * @param filePath Chemin absolu vers le fichier PDF
     * @returns Résultat de l'OCR avec le texte extrait
     */
    async extractTextFromPDF(filePath: string): Promise<OCRResult> {
        // Initialiser pdfjs avec import dynamique
        const pdfjs = await initializePdfjs();
        
        const startTime = Date.now();

        try {
            console.log(`🔍 Début de l'extraction OCR pour: ${filePath}`);

            // Lire le fichier PDF
            const pdfBuffer = await readFile(filePath);
            
            // Convertir Buffer en Uint8Array (requis par pdfjs-dist)
            const pdfData = new Uint8Array(pdfBuffer);

            // Charger le document PDF
            const loadingTask = pdfjs.getDocument({
                data: pdfData,
                useSystemFonts: true,
            });

            const pdfDocument = await loadingTask.promise;
            const pageCount = pdfDocument.numPages;

            console.log(`📄 PDF chargé: ${pageCount} page(s)`);

            // Extraire le texte de chaque page
            const pageTexts: string[] = [];
            let totalConfidence = 0;

            for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
                console.log(`📖 Traitement de la page ${pageNum}/${pageCount}...`);

                const page = await pdfDocument.getPage(pageNum);

                // Convertir la page en image
                const viewport = page.getViewport({ scale: 2.0 }); // Échelle 2x pour meilleure qualité
                const canvas = await this.renderPageToCanvas(page, viewport);

                // Effectuer l'OCR sur le canvas (avec les polyfills, Tesseract peut maintenant l'accepter)
                const result = await Tesseract.recognize(canvas as any, 'fra', {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            console.log(`  ⚙️ Page ${pageNum}: ${Math.round(m.progress * 100)}%`);
                        }
                    },
                });

                pageTexts.push(result.data.text);
                totalConfidence += result.data.confidence;

                // Nettoyer
                page.cleanup();
            }

            const fullText = pageTexts.join('\n\n--- PAGE BREAK ---\n\n');
            const averageConfidence = totalConfidence / pageCount;
            const processingTime = Date.now() - startTime;

            console.log(`✅ OCR terminé en ${processingTime}ms (confiance: ${averageConfidence.toFixed(2)}%)`);

            return {
                text: fullText,
                confidence: averageConfidence,
                pageCount,
                processingTime,
            };

        } catch (error) {
            console.error('❌ Erreur lors de l\'extraction OCR:', error);
            throw new Error(`Échec de l'extraction OCR: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    }

    /**
     * Rend une page PDF sur un canvas pour l'OCR
     */
    private async renderPageToCanvas(
        page: any,
        viewport: any
    ): Promise<HTMLCanvasElement> {
        // En environnement Node.js, utiliser node-canvas
        const { createCanvas } = await import('canvas');
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');

        await page.render({
            canvasContext: context as any,
            viewport: viewport,
            canvas: canvas as any,
        }).promise;

        return canvas as any;
    }

    /**
     * Nettoie le texte extrait par OCR
     * - Supprime les espaces multiples
     * - Normalise les sauts de ligne
     * - Supprime les caractères spéciaux indésirables
     */
    cleanText(text: string): string {
        return text
            .replace(/\s+/g, ' ') // Espaces multiples → simple
            .replace(/\n\s*\n/g, '\n') // Lignes vides multiples → simple
            .trim();
    }
}

export const ocrService = new OCRService();
