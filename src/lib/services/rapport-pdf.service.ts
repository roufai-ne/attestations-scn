/**
 * Service de génération de rapports PDF
 * Utilise pdf-lib pour créer des rapports professionnels
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface RapportData {
    titre: string;
    sousTitre?: string;
    dateDebut: Date;
    dateFin: Date;
    generePar: string;
    sections: RapportSection[];
}

export interface RapportSection {
    titre: string;
    type: 'table' | 'texte' | 'statistiques';
    contenu: any;
}

export interface StatistiqueItem {
    label: string;
    valeur: number | string;
    evolution?: number; // % par rapport à la période précédente
}

export interface TableauDonnees {
    colonnes: string[];
    lignes: any[][];
}

export class RapportPDFService {
    private readonly PAGE_WIDTH = 595; // A4
    private readonly PAGE_HEIGHT = 842;
    private readonly MARGIN = 50;
    private readonly CONTENT_WIDTH = 595 - 100; // PAGE_WIDTH - 2 * MARGIN

    /**
     * Génère un rapport PDF complet
     */
    async generateRapport(data: RapportData): Promise<Buffer> {
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Page de couverture
        await this.addCoverPage(pdfDoc, data, fontBold, font);

        // Pages de contenu
        let currentPage = pdfDoc.addPage([this.PAGE_WIDTH, this.PAGE_HEIGHT]);
        let yPosition = this.PAGE_HEIGHT - this.MARGIN;

        for (const section of data.sections) {
            // Vérifier si on a besoin d'une nouvelle page
            if (yPosition < 150) {
                currentPage = pdfDoc.addPage([this.PAGE_WIDTH, this.PAGE_HEIGHT]);
                yPosition = this.PAGE_HEIGHT - this.MARGIN;
            }

            // Titre de section
            currentPage.drawText(section.titre, {
                x: this.MARGIN,
                y: yPosition,
                size: 14,
                font: fontBold,
                color: rgb(0.2, 0.2, 0.4),
            });
            yPosition -= 30;

            // Contenu selon le type
            switch (section.type) {
                case 'statistiques':
                    yPosition = await this.drawStatistiques(
                        currentPage,
                        section.contenu as StatistiqueItem[],
                        yPosition,
                        font,
                        fontBold
                    );
                    break;

                case 'table':
                    const tableResult = await this.drawTable(
                        pdfDoc,
                        currentPage,
                        section.contenu as TableauDonnees,
                        yPosition,
                        font,
                        fontBold
                    );
                    currentPage = tableResult.page;
                    yPosition = tableResult.yPosition;
                    break;

                case 'texte':
                    yPosition = this.drawTexte(currentPage, section.contenu as string, yPosition, font);
                    break;
            }

            yPosition -= 30;
        }

        // Pied de page sur chaque page
        await this.addFooters(pdfDoc, font);

        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
    }

    /**
     * Ajoute la page de couverture
     */
    private async addCoverPage(
        pdfDoc: PDFDocument,
        data: RapportData,
        fontBold: any,
        font: any
    ) {
        const page = pdfDoc.addPage([this.PAGE_WIDTH, this.PAGE_HEIGHT]);

        // Fond coloré en haut
        page.drawRectangle({
            x: 0,
            y: this.PAGE_HEIGHT - 200,
            width: this.PAGE_WIDTH,
            height: 200,
            color: rgb(0.1, 0.3, 0.5),
        });

        // Titre principal
        page.drawText(data.titre, {
            x: this.MARGIN,
            y: this.PAGE_HEIGHT - 100,
            size: 28,
            font: fontBold,
            color: rgb(1, 1, 1),
        });

        // Sous-titre
        if (data.sousTitre) {
            page.drawText(data.sousTitre, {
                x: this.MARGIN,
                y: this.PAGE_HEIGHT - 140,
                size: 14,
                font: font,
                color: rgb(0.9, 0.9, 0.9),
            });
        }

        // Période
        const periodeTexte = `Période : du ${format(data.dateDebut, 'dd MMMM yyyy', { locale: fr })} au ${format(data.dateFin, 'dd MMMM yyyy', { locale: fr })}`;
        page.drawText(periodeTexte, {
            x: this.MARGIN,
            y: this.PAGE_HEIGHT - 300,
            size: 12,
            font: font,
            color: rgb(0.3, 0.3, 0.3),
        });

        // Date de génération
        page.drawText(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, {
            x: this.MARGIN,
            y: this.PAGE_HEIGHT - 330,
            size: 10,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
        });

        // Généré par
        page.drawText(`Par : ${data.generePar}`, {
            x: this.MARGIN,
            y: this.PAGE_HEIGHT - 350,
            size: 10,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
        });

        // Logo ou texte en bas
        page.drawText('Service Civique National du Niger', {
            x: this.MARGIN,
            y: 50,
            size: 12,
            font: fontBold,
            color: rgb(0.3, 0.3, 0.3),
        });
    }

    /**
     * Dessine des statistiques
     */
    private drawStatistiques(
        page: any,
        stats: StatistiqueItem[],
        yPosition: number,
        font: any,
        fontBold: any
    ): number {
        const boxWidth = 150;
        const boxHeight = 60;
        const gap = 20;
        const perRow = 3;

        stats.forEach((stat, index) => {
            const row = Math.floor(index / perRow);
            const col = index % perRow;
            const x = this.MARGIN + col * (boxWidth + gap);
            const y = yPosition - row * (boxHeight + gap);

            // Box
            page.drawRectangle({
                x,
                y: y - boxHeight,
                width: boxWidth,
                height: boxHeight,
                color: rgb(0.95, 0.95, 0.98),
                borderColor: rgb(0.8, 0.8, 0.8),
                borderWidth: 1,
            });

            // Valeur
            page.drawText(String(stat.valeur), {
                x: x + 10,
                y: y - 25,
                size: 16,
                font: fontBold,
                color: rgb(0.2, 0.2, 0.4),
            });

            // Label
            page.drawText(stat.label, {
                x: x + 10,
                y: y - 45,
                size: 9,
                font: font,
                color: rgb(0.4, 0.4, 0.4),
            });

            // Evolution
            if (stat.evolution !== undefined) {
                const evolutionText = stat.evolution >= 0 ? `+${stat.evolution}%` : `${stat.evolution}%`;
                const evolutionColor = stat.evolution >= 0 ? rgb(0.2, 0.6, 0.3) : rgb(0.7, 0.2, 0.2);
                page.drawText(evolutionText, {
                    x: x + boxWidth - 40,
                    y: y - 25,
                    size: 10,
                    font: font,
                    color: evolutionColor,
                });
            }
        });

        const rows = Math.ceil(stats.length / perRow);
        return yPosition - rows * (boxHeight + gap);
    }

    /**
     * Dessine un tableau
     */
    private async drawTable(
        pdfDoc: PDFDocument,
        page: any,
        data: TableauDonnees,
        yPosition: number,
        font: any,
        fontBold: any
    ): Promise<{ page: any; yPosition: number }> {
        const rowHeight = 25;
        const colWidth = this.CONTENT_WIDTH / data.colonnes.length;

        let currentPage = page;
        let y = yPosition;

        // Header du tableau
        currentPage.drawRectangle({
            x: this.MARGIN,
            y: y - rowHeight,
            width: this.CONTENT_WIDTH,
            height: rowHeight,
            color: rgb(0.2, 0.3, 0.5),
        });

        data.colonnes.forEach((col, i) => {
            currentPage.drawText(col, {
                x: this.MARGIN + i * colWidth + 5,
                y: y - 18,
                size: 10,
                font: fontBold,
                color: rgb(1, 1, 1),
            });
        });

        y -= rowHeight;

        // Lignes de données
        for (let rowIndex = 0; rowIndex < data.lignes.length; rowIndex++) {
            const row = data.lignes[rowIndex];

            // Nouvelle page si nécessaire
            if (y < 100) {
                currentPage = pdfDoc.addPage([this.PAGE_WIDTH, this.PAGE_HEIGHT]);
                y = this.PAGE_HEIGHT - this.MARGIN;
            }

            // Alternance de couleur
            if (rowIndex % 2 === 0) {
                currentPage.drawRectangle({
                    x: this.MARGIN,
                    y: y - rowHeight,
                    width: this.CONTENT_WIDTH,
                    height: rowHeight,
                    color: rgb(0.97, 0.97, 0.97),
                });
            }

            row.forEach((cell: any, i: number) => {
                const text = String(cell).substring(0, 25); // Tronquer si trop long
                currentPage.drawText(text, {
                    x: this.MARGIN + i * colWidth + 5,
                    y: y - 18,
                    size: 9,
                    font: font,
                    color: rgb(0.2, 0.2, 0.2),
                });
            });

            y -= rowHeight;
        }

        return { page: currentPage, yPosition: y };
    }

    /**
     * Dessine du texte simple
     */
    private drawTexte(page: any, text: string, yPosition: number, font: any): number {
        const lines = this.wrapText(text, 80);
        let y = yPosition;

        lines.forEach((line) => {
            page.drawText(line, {
                x: this.MARGIN,
                y: y,
                size: 11,
                font: font,
                color: rgb(0.2, 0.2, 0.2),
            });
            y -= 16;
        });

        return y;
    }

    /**
     * Wrap text helper
     */
    private wrapText(text: string, maxChars: number): string[] {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        words.forEach((word) => {
            if ((currentLine + ' ' + word).length <= maxChars) {
                currentLine = currentLine ? `${currentLine} ${word}` : word;
            } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
            }
        });

        if (currentLine) lines.push(currentLine);
        return lines;
    }

    /**
     * Ajoute les pieds de page
     */
    private async addFooters(pdfDoc: PDFDocument, font: any) {
        const pages = pdfDoc.getPages();

        pages.forEach((page, index) => {
            // Numéro de page
            page.drawText(`Page ${index + 1} / ${pages.length}`, {
                x: this.PAGE_WIDTH - 100,
                y: 30,
                size: 9,
                font: font,
                color: rgb(0.5, 0.5, 0.5),
            });

            // Ligne de séparation
            page.drawLine({
                start: { x: this.MARGIN, y: 50 },
                end: { x: this.PAGE_WIDTH - this.MARGIN, y: 50 },
                thickness: 0.5,
                color: rgb(0.8, 0.8, 0.8),
            });
        });
    }
}

export const rapportPDFService = new RapportPDFService();
