import ExcelJS from 'exceljs';
import { readFile } from 'fs/promises';

export interface AppeleFromExcel {
    numeroOrdre: number;
    nom: string;
    prenoms: string;
    dateNaissance: Date | null;
    lieuNaissance: string | null;
    diplome: string | null;
    lieuService?: string | null;
}

export interface ExcelParseResult {
    success: boolean;
    appeles: AppeleFromExcel[];
    errors: string[];
    warnings: string[];
}

export interface ColumnMapping {
    numero: string | number;      // Index ou nom de la colonne
    nom: string | number;
    prenoms: string | number;
    dateNaissance?: string | number;
    lieuNaissance?: string | number;
    diplome?: string | number;
    lieuService?: string | number;
}

export interface ExcelPreviewResult {
    headers: string[];            // Tous les en-têtes détectés
    suggestedMapping: ColumnMapping; // Mapping suggéré automatiquement
    sampleRows: any[][];         // 5 premières lignes de données
    totalRows: number;           // Nombre total de lignes
}

/**
 * Service pour parser les fichiers Excel contenant les listes d'appelés
 */
export class ExcelParserService {
    /**
     * Analyse un fichier Excel et propose un mapping automatique
     * 
     * @param filePath Chemin absolu vers le fichier Excel
     * @returns Preview avec en-têtes, mapping suggéré et échantillon de données
     */
    async previewExcelFile(filePath: string): Promise<ExcelPreviewResult> {
        const buffer = await readFile(filePath);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer.buffer);
        const worksheet = workbook.worksheets[0];

        if (!worksheet) {
            throw new Error('Fichier Excel vide ou invalide');
        }

        // Extraire les en-têtes (ligne 1)
        const headerRow = worksheet.getRow(1);
        const headers: string[] = [];
        headerRow.eachCell((cell, colNumber) => {
            headers[colNumber - 1] = cell.value?.toString() || `Colonne ${colNumber}`;
        });

        // Suggérer un mapping automatique
        const suggestedMapping = this.suggestMapping(headers);

        // Extraire 5 lignes d'exemple
        const sampleRows: any[][] = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            if (sampleRows.length >= 5) return; // Limit to 5 samples
            
            const rowData: any[] = [];
            row.eachCell((cell, colNumber) => {
                rowData[colNumber - 1] = cell.value;
            });
            sampleRows.push(rowData);
        });

        return {
            headers,
            suggestedMapping,
            sampleRows,
            totalRows: worksheet.rowCount - 1, // Excluding header
        };
    }

    /**
     * Parse un fichier Excel avec un mapping de colonnes spécifié
     * 
     * @param filePath Chemin absolu vers le fichier Excel
     * @param columnMapping Mapping des colonnes (optionnel, auto-détection si non fourni)
     * @returns Résultat du parsing avec les appelés extraits et les erreurs
     */
    async parseExcelFile(filePath: string, columnMapping?: ColumnMapping): Promise<ExcelParseResult> {
        const errors: string[] = [];
        const warnings: string[] = [];
        const appeles: AppeleFromExcel[] = [];

        try {
            console.log(`📊 Lecture du fichier Excel: ${filePath}`);

            // Lire le fichier
            const buffer = await readFile(filePath);
            
            // Charger le workbook
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer.buffer);

            // Prendre la première feuille
            const worksheet = workbook.worksheets[0];
            
            if (!worksheet) {
                return {
                    success: false,
                    appeles: [],
                    errors: ['Le fichier Excel est vide ou invalide'],
                    warnings: [],
                };
            }

            console.log(`📄 Feuille: "${worksheet.name}" - ${worksheet.rowCount} lignes`);

            // Déterminer le mapping des colonnes
            let headers: Record<string, number>;
            
            if (columnMapping) {
                // Utiliser le mapping fourni
                headers = this.convertMappingToIndexes(columnMapping, worksheet.getRow(1));
                console.log(`🔍 Mapping utilisé: ${JSON.stringify(headers)}`);
            } else {
                // Auto-détection des en-têtes
                const headerRow = worksheet.getRow(1);
                headers = this.extractHeaders(headerRow);
                console.log(`🔍 En-têtes auto-détectés: ${JSON.stringify(headers)}`);
            }

            // Valider les en-têtes requis
            const requiredHeaders = ['numero', 'nom', 'prenoms'];
            const missingHeaders = requiredHeaders.filter(h => !headers[h]);
            
            if (missingHeaders.length > 0) {
                return {
                    success: false,
                    appeles: [],
                    errors: [`Colonnes manquantes: ${missingHeaders.join(', ')}`],
                    warnings: [],
                };
            }

            // Parser chaque ligne (à partir de la ligne 2)
            let rowCount = 0;
            worksheet.eachRow((row, rowNumber) => {
                // Ignorer la ligne d'en-têtes
                if (rowNumber === 1) return;

                try {
                    const appele = this.parseRow(row, headers);
                    if (appele) {
                        appeles.push(appele);
                        rowCount++;
                    }
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Erreur inconnue';
                    errors.push(`Ligne ${rowNumber}: ${message}`);
                }
            });

            console.log(`✅ ${rowCount} appelés extraits`);

            // Vérifier les doublons de numéro d'ordre
            const numeros = appeles.map(a => a.numeroOrdre);
            const duplicates = numeros.filter((n, i) => numeros.indexOf(n) !== i);
            if (duplicates.length > 0) {
                warnings.push(`Numéros en double détectés: ${[...new Set(duplicates)].join(', ')}`);
            }

            return {
                success: errors.length === 0,
                appeles,
                errors,
                warnings,
            };

        } catch (error) {
            console.error('❌ Erreur lors du parsing Excel:', error);
            return {
                success: false,
                appeles: [],
                errors: [`Erreur de lecture: ${error instanceof Error ? error.message : 'Erreur inconnue'}`],
                warnings: [],
            };
        }
    }

    /**
     * Suggère un mapping automatique basé sur les en-têtes
     */
    private suggestMapping(headers: string[]): ColumnMapping {
        const mapping: any = {};

        headers.forEach((header, index) => {
            const normalized = header.toLowerCase().trim();
            const colIndex = index + 1; // Excel columns are 1-based

            if (normalized.includes('n°') || normalized.includes('numero') || normalized === 'n') {
                mapping.numero = colIndex;
            } else if (normalized.includes('nom') && !normalized.includes('prénom')) {
                mapping.nom = colIndex;
            } else if (normalized.includes('prénom') || normalized.includes('prenom')) {
                mapping.prenoms = colIndex;
            } else if (normalized.includes('date') && normalized.includes('naissance')) {
                mapping.dateNaissance = colIndex;
            } else if (normalized.includes('lieu') && normalized.includes('naissance')) {
                mapping.lieuNaissance = colIndex;
            } else if (normalized.includes('diplôme') || normalized.includes('diplome') || normalized.includes('formation')) {
                mapping.diplome = colIndex;
            } else if (normalized.includes('lieu') && normalized.includes('service')) {
                mapping.lieuService = colIndex;
            }
        });

        return mapping as ColumnMapping;
    }

    /**
     * Convertit un mapping utilisateur en index de colonnes
     */
    private convertMappingToIndexes(
        mapping: ColumnMapping,
        headerRow: ExcelJS.Row
    ): Record<string, number> {
        const result: Record<string, number> = {};

        Object.entries(mapping).forEach(([key, value]) => {
            if (typeof value === 'number') {
                // Déjà un index de colonne
                result[key] = value;
            } else if (typeof value === 'string') {
                // Nom de colonne, trouver l'index
                let found = false;
                headerRow.eachCell((cell, colNumber) => {
                    if (cell.value?.toString().toLowerCase().trim() === value.toLowerCase().trim()) {
                        result[key] = colNumber;
                        found = true;
                    }
                });
                if (!found) {
                    throw new Error(`Colonne "${value}" introuvable dans les en-têtes`);
                }
            }
        });

        return result;
    }

    /**
     * Extrait les en-têtes et détermine les index des colonnes (auto-détection)
     */
    private extractHeaders(headerRow: ExcelJS.Row): Record<string, number> {
        const headers: Record<string, number> = {};
        
        headerRow.eachCell((cell, colNumber) => {
            const value = cell.value?.toString().toLowerCase().trim() || '';
            
            // Mapper les noms de colonnes aux clés standardisées
            if (value.includes('n°') || value.includes('numero') || value === 'n') {
                headers.numero = colNumber;
            } else if (value.includes('nom') && !value.includes('prénom')) {
                headers.nom = colNumber;
            } else if (value.includes('prénom') || value.includes('prenom')) {
                headers.prenoms = colNumber;
            } else if (value.includes('date') && value.includes('naissance')) {
                headers.dateNaissance = colNumber;
            } else if (value.includes('lieu') && value.includes('naissance')) {
                headers.lieuNaissance = colNumber;
            } else if (value.includes('diplôme') || value.includes('diplome') || value.includes('formation')) {
                headers.diplome = colNumber;
            } else if (value.includes('lieu') && value.includes('service')) {
                headers.lieuService = colNumber;
            }
        });

        return headers;
    }

    /**
     * Parse une ligne du fichier Excel
     */
    private parseRow(
        row: ExcelJS.Row,
        headers: Record<string, number>
    ): AppeleFromExcel | null {
        // Vérifier si la ligne est vide
        if (row.cellCount === 0 || !row.hasValues) {
            return null;
        }

        // Extraire les valeurs
        const numeroCell = row.getCell(headers.numero);
        const nomCell = row.getCell(headers.nom);
        const prenomsCell = row.getCell(headers.prenoms);
        const dateNaissanceCell = headers.dateNaissance ? row.getCell(headers.dateNaissance) : null;
        const lieuNaissanceCell = headers.lieuNaissance ? row.getCell(headers.lieuNaissance) : null;
        const diplomeCell = headers.diplome ? row.getCell(headers.diplome) : null;
        const lieuServiceCell = headers.lieuService ? row.getCell(headers.lieuService) : null;

        // Validation du numéro d'ordre
        const numeroOrdre = this.parseNumero(numeroCell);
        if (numeroOrdre === null) {
            throw new Error('Numéro d\'ordre manquant ou invalide');
        }

        // Validation du nom
        const nom = this.parseText(nomCell);
        if (!nom) {
            throw new Error('Nom manquant');
        }

        // Prénoms (optionnels mais recommandés)
        const prenoms = this.parseText(prenomsCell) || '';

        // Date de naissance (optionnelle)
        const dateNaissance = dateNaissanceCell ? this.parseDate(dateNaissanceCell) : null;

        // Autres champs optionnels
        const lieuNaissance = lieuNaissanceCell ? this.parseText(lieuNaissanceCell) : null;
        const diplome = diplomeCell ? this.parseText(diplomeCell) : null;
        const lieuService = lieuServiceCell ? this.parseText(lieuServiceCell) : null;

        return {
            numeroOrdre,
            nom,
            prenoms,
            dateNaissance,
            lieuNaissance,
            diplome,
            lieuService,
        };
    }

    /**
     * Parse un numéro (entier)
     */
    private parseNumero(cell: ExcelJS.Cell): number | null {
        const value = cell.value;
        
        if (value === null || value === undefined || value === '') {
            return null;
        }

        // Si c'est déjà un nombre
        if (typeof value === 'number') {
            return Math.round(value);
        }

        // Si c'est du texte, essayer de le convertir
        const num = parseInt(value.toString().trim(), 10);
        return isNaN(num) ? null : num;
    }

    /**
     * Parse du texte
     */
    private parseText(cell: ExcelJS.Cell): string | null {
        const value = cell.value;
        
        if (value === null || value === undefined || value === '') {
            return null;
        }

        return value.toString().trim();
    }

    /**
     * Parse une date
     */
    private parseDate(cell: ExcelJS.Cell): Date | null {
        const value = cell.value;

        if (value === null || value === undefined || value === '') {
            return null;
        }

        // Si c'est déjà une date
        if (value instanceof Date) {
            return value;
        }

        // Si c'est un nombre (date Excel sérialisée)
        if (typeof value === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
            return date;
        }

        // Si c'est du texte, essayer plusieurs formats
        const text = value.toString().trim();
        
        // Format JJ/MM/AAAA
        const match1 = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (match1) {
            const [, day, month, year] = match1;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }

        // Format AAAA-MM-JJ
        const match2 = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (match2) {
            const [, year, month, day] = match2;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }

        // Essayer le parsing standard
        const date = new Date(text);
        return isNaN(date.getTime()) ? null : date;
    }
}

// Export d'une instance singleton
export const excelParserService = new ExcelParserService();
