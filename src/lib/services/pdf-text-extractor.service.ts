// Service simplifié d'extraction de texte depuis des PDFs
import { readFile } from 'fs/promises';

let pdfjsLib: any = null;
let isInitialized = false;

/**
 * Initialise pdfjs-dist avec import dynamique
 */
async function initializePdfjs() {
    if (isInitialized && pdfjsLib) {
        return pdfjsLib;
    }

    // Import dynamique de pdfjs-dist
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    // Configuration du worker pdfjs
    if (typeof window === 'undefined') {
        try {
            const pdfjsWorkerModule = await import('pdfjs-dist/build/pdf.worker.mjs');
            pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerModule.default;
        } catch (error) {
            console.warn('⚠️ Impossible de charger le worker pdfjs:', error);
        }
    }
    
    isInitialized = true;
    return pdfjsLib;
}

export interface TextExtractionResult {
    text: string;
    pageCount: number;
    processingTime: number;
    hasText: boolean;
}

/**
 * Service d'extraction de texte natif depuis des fichiers PDF
 * Solution simple et rapide sans OCR
 */
export class PDFTextExtractor {
    /**
     * Extrait le texte natif d'un PDF
     * @param filePath Chemin absolu vers le fichier PDF
     * @returns Résultat de l'extraction
     */
    async extractText(filePath: string): Promise<TextExtractionResult> {
        const startTime = Date.now();

        try {
            const pdfjs = await initializePdfjs();

            console.log(`📄 Extraction de texte pour: ${filePath}`);

            // Lire le fichier PDF
            const pdfBuffer = await readFile(filePath);
            const pdfData = new Uint8Array(pdfBuffer);

            // Charger le document PDF
            const loadingTask = pdfjs.getDocument({
                data: pdfData,
                useSystemFonts: true,
            });

            const pdfDocument = await loadingTask.promise;
            const pageCount = pdfDocument.numPages;

            console.log(`📖 ${pageCount} page(s) trouvée(s)`);

            const pageTexts: string[] = [];

            // Extraire le texte de chaque page
            for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
                const page = await pdfDocument.getPage(pageNum);
                
                // Extraire le contenu textuel natif
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(' ')
                    .trim();

                if (pageText) {
                    pageTexts.push(pageText);
                }

                page.cleanup();
            }

            const fullText = pageTexts.join('\n\n');
            const processingTime = Date.now() - startTime;
            const hasText = fullText.trim().length > 0;

            if (!hasText) {
                console.warn('⚠️ Aucun texte trouvé - PDF scanné ou image');
            } else {
                console.log(`✅ Extraction terminée en ${processingTime}ms (${fullText.length} caractères)`);
            }

            return {
                text: fullText,
                pageCount,
                processingTime,
                hasText,
            };
        } catch (error) {
            console.error('❌ Erreur lors de l\'extraction:', error);
            throw new Error(`Échec de l'extraction: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    }

    /**
     * Nettoie le texte extrait
     */
    cleanText(text: string): string {
        return text
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n')
            .trim();
    }
}

export const pdfTextExtractor = new PDFTextExtractor();
