import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { TypePiece } from '@prisma/client';

// Schéma de validation pour la mise à jour
const updateDemandeSchema = z.object({
    numeroEnregistrement: z.string().min(1),
    dateEnregistrement: z.string().transform((val) => new Date(val)),
    nom: z.string().min(1),
    prenom: z.string().min(1),
    dateNaissance: z.string().transform((val) => new Date(val)),
    lieuNaissance: z.string().min(1),
    email: z.string().email().optional().or(z.literal('')),
    telephone: z.string().optional().or(z.literal('')),
    whatsapp: z.string().optional().or(z.literal('')),
    diplome: z.string().min(1),
    promotion: z.string().min(1),
    numeroArrete: z.string().optional().or(z.literal('')),
    structure: z.string().optional().or(z.literal('')),
    dateDebutService: z.string().transform((val) => new Date(val)),
    dateFinService: z.string().transform((val) => new Date(val)),
    pieces: z.array(z.object({
        type: z.nativeEnum(TypePiece),
        present: z.boolean(),
    })),
    observations: z.string().optional(),
});

/**
 * GET /api/saisie/demandes/[id]
 * Récupère les détails d'une demande
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'SAISIE') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        const { id } = await params;

        const demande = await prisma.demande.findUnique({
            where: { id },
            include: {
                appele: true,
                pieces: true,
                agent: {
                    select: { nom: true, prenom: true },
                },
            },
        });

        if (!demande) {
            return NextResponse.json(
                { error: 'Demande non trouvée' },
                { status: 404 }
            );
        }

        return NextResponse.json(demande);

    } catch (error) {
        console.error('Erreur lors de la récupération de la demande:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/saisie/demandes/[id]
 * Met à jour une demande (seulement si ENREGISTREE ou PIECES_NON_CONFORMES)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'SAISIE') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Vérifier que la demande existe et appartient à l'agent
        const existingDemande = await prisma.demande.findUnique({
            where: { id },
            include: { appele: true },
        });

        if (!existingDemande) {
            return NextResponse.json(
                { error: 'Demande non trouvée' },
                { status: 404 }
            );
        }

        // Vérifier que c'est bien l'agent qui a créé la demande
        if (existingDemande.agentId !== session.user.id) {
            return NextResponse.json(
                { error: 'Vous ne pouvez modifier que vos propres demandes' },
                { status: 403 }
            );
        }

        // Vérifier le statut - seules les demandes ENREGISTREE ou PIECES_NON_CONFORMES peuvent être modifiées
        if (!['ENREGISTREE', 'PIECES_NON_CONFORMES'].includes(existingDemande.statut)) {
            return NextResponse.json(
                { error: 'Cette demande ne peut plus être modifiée' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const data = updateDemandeSchema.parse(body);

        // Mettre à jour la demande
        const demande = await prisma.demande.update({
            where: { id },
            data: {
                numeroEnregistrement: data.numeroEnregistrement,
                dateEnregistrement: data.dateEnregistrement,
                observations: data.observations || null,
                appele: {
                    update: {
                        nom: data.nom.toUpperCase(),
                        prenom: data.prenom,
                        dateNaissance: data.dateNaissance,
                        lieuNaissance: data.lieuNaissance,
                        email: data.email || null,
                        telephone: data.telephone || null,
                        whatsapp: data.whatsapp || null,
                        diplome: data.diplome,
                        promotion: data.promotion,
                        numeroArrete: data.numeroArrete || null,
                        structure: data.structure || null,
                        dateDebutService: data.dateDebutService,
                        dateFinService: data.dateFinService,
                    },
                },
            },
            include: {
                appele: true,
            },
        });

        // Mettre à jour les pièces
        await prisma.pieceDossier.deleteMany({
            where: { demandeId: id },
        });

        await prisma.pieceDossier.createMany({
            data: data.pieces.map((piece) => ({
                demandeId: id,
                type: piece.type,
                present: piece.present,
                conforme: null,
            })),
        });

        // Log d'audit
        await prisma.auditLog.create({
            data: {
                action: 'DEMANDE_MODIFIEE_SAISIE',
                userId: session.user.id,
                demandeId: demande.id,
                details: JSON.stringify({
                    numeroEnregistrement: demande.numeroEnregistrement,
                }),
            },
        });

        return NextResponse.json(demande);

    } catch (error) {
        console.error('Erreur lors de la mise à jour de la demande:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Données invalides', details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
