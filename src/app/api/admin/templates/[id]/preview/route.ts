/**
 * API Route - Génère un aperçu PDF du template
 * POST /api/admin/templates/[id]/preview
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { readFile } from 'fs/promises';
import path from 'path';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Données exemple pour l'aperçu
const SAMPLE_DATA: Record<string, string> = {
    numero: 'ATT-2026-00001',
    civilite: 'M.',
    prenomNom: 'Ibrahim AMADOU',
    dateNaissance: '15 mai 1995',
    lieuNaissance: 'Niamey',
    diplome: 'Licence en Informatique',
    lieuService: "Ministère de l'Éducation",
    dateDebutService: '01/01/2024',
    dateFinService: '31/12/2024',
    dateSignature: format(new Date(), 'dd MMMM yyyy', { locale: fr }),
    nomDirecteur: 'Le Directeur du SCN',
    promotion: '2023-2024',
};

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const config = body.config;

        if (!config) {
            return NextResponse.json(
                { error: 'Configuration manquante' },
                { status: 400 }
            );
        }

        // Créer le PDF
        const pdfDoc = await PDFDocument.create();

        // Dimensions de la page
        const pageWidth = config.pageWidth || 842;
        const pageHeight = config.pageHeight || 595;
        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Charger l'image de fond si disponible
        if (config.backgroundImage) {
            try {
                const bgPath = path.join(process.cwd(), 'public', config.backgroundImage);
                const bgBytes = await readFile(bgPath);
                const bgImage = config.backgroundImage.endsWith('.png')
                    ? await pdfDoc.embedPng(bgBytes)
                    : await pdfDoc.embedJpg(bgBytes);

                page.drawImage(bgImage, {
                    x: 0,
                    y: 0,
                    width: pageWidth,
                    height: pageHeight,
                });
            } catch (err) {
                console.warn('Image de fond non trouvée:', err);
            }
        }

        // Charger les polices
        const fonts = {
            Helvetica: await pdfDoc.embedFont(StandardFonts.Helvetica),
            HelveticaBold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
            Times: await pdfDoc.embedFont(StandardFonts.TimesRoman),
            TimesBold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
            Courier: await pdfDoc.embedFont(StandardFonts.Courier),
            CourierBold: await pdfDoc.embedFont(StandardFonts.CourierBold),
        };

        // Dessiner les champs
        for (const field of config.fields || []) {
            if (field.type === 'qrcode' || field.type === 'signature') {
                // Dessiner un placeholder pour QR/Signature
                const width = field.width || 80;
                const height = field.height || 80;

                page.drawRectangle({
                    x: field.x,
                    y: pageHeight - field.y - height,
                    width,
                    height,
                    borderColor: rgb(0.5, 0.5, 0.5),
                    borderWidth: 1,
                    color: rgb(0.95, 0.95, 0.95),
                });

                // Texte au centre
                const helvetica = fonts.Helvetica;
                const label = field.type === 'qrcode' ? '[QR Code]' : '[Signature]';
                const textWidth = helvetica.widthOfTextAtSize(label, 10);
                page.drawText(label, {
                    x: field.x + (width - textWidth) / 2,
                    y: pageHeight - field.y - height / 2 - 5,
                    size: 10,
                    font: helvetica,
                    color: rgb(0.5, 0.5, 0.5),
                });
            } else {
                // Champ texte ou date
                const value = (field.prefix || '') +
                    (SAMPLE_DATA[field.id] || `[${field.label}]`) +
                    (field.suffix || '');

                const fontKey = field.fontWeight === 'bold'
                    ? `${field.fontFamily}Bold`
                    : field.fontFamily;
                const font = fonts[fontKey as keyof typeof fonts] || fonts.Helvetica;

                // Convertir couleur hex en RGB
                const colorHex = field.color || '#000000';
                const r = parseInt(colorHex.slice(1, 3), 16) / 255;
                const g = parseInt(colorHex.slice(3, 5), 16) / 255;
                const b = parseInt(colorHex.slice(5, 7), 16) / 255;

                page.drawText(value, {
                    x: field.x,
                    y: pageHeight - field.y - field.fontSize,
                    size: field.fontSize || 12,
                    font,
                    color: rgb(r, g, b),
                });
            }
        }

        // Dessiner les zones de position signature et QR
        const signaturePos = config.signaturePosition;
        if (signaturePos) {
            page.drawRectangle({
                x: signaturePos.x,
                y: pageHeight - signaturePos.y - signaturePos.height,
                width: signaturePos.width,
                height: signaturePos.height,
                borderColor: rgb(1, 0.6, 0), // Orange
                borderWidth: 2,
            });

            const helvetica = fonts.Helvetica;
            page.drawText('[Zone Signature]', {
                x: signaturePos.x + 10,
                y: pageHeight - signaturePos.y - signaturePos.height / 2 - 5,
                size: 10,
                font: helvetica,
                color: rgb(1, 0.6, 0),
            });
        }

        const qrPos = config.qrCodePosition;
        if (qrPos) {
            page.drawRectangle({
                x: qrPos.x,
                y: pageHeight - qrPos.y - qrPos.size,
                width: qrPos.size,
                height: qrPos.size,
                borderColor: rgb(0.5, 0, 0.8), // Violet
                borderWidth: 2,
            });

            const helvetica = fonts.Helvetica;
            page.drawText('[QR]', {
                x: qrPos.x + qrPos.size / 2 - 10,
                y: pageHeight - qrPos.y - qrPos.size / 2 - 5,
                size: 10,
                font: helvetica,
                color: rgb(0.5, 0, 0.8),
            });
        }

        // Générer le PDF
        const pdfBytes = await pdfDoc.save();

        return new NextResponse(new Uint8Array(pdfBytes), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="preview-${id}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Erreur génération aperçu:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la génération' },
            { status: 500 }
        );
    }
}
