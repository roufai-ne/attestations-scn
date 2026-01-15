import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { TypePiece } from '@prisma/client';

// Schéma de validation pour la création de demande par agent de saisie
const createDemandeSchema = z.object({
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
 * GET /api/saisie/demandes
 * Liste les demandes pour l'agent de saisie
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'SAISIE') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search') || '';
        const statut = searchParams.get('statut') || '';
        const mesDemandes = searchParams.get('mesDemandes') === 'true';

        // Construction du filtre
        const where: any = {};

        if (mesDemandes) {
            where.agentId = session.user.id;
        }

        if (statut) {
            where.statut = statut;
        }

        if (search) {
            where.OR = [
                { numeroEnregistrement: { contains: search, mode: 'insensitive' } },
                { appele: { nom: { contains: search, mode: 'insensitive' } } },
                { appele: { prenom: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const demandes = await prisma.demande.findMany({
            where,
            include: {
                appele: {
                    select: {
                        nom: true,
                        prenom: true,
                        promotion: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        return NextResponse.json({ demandes });

    } catch (error) {
        console.error('Erreur lors de la récupération des demandes:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/saisie/demandes
 * Crée une nouvelle demande (agent de saisie)
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'SAISIE') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const data = createDemandeSchema.parse(body);

        // Vérifier si le numéro d'enregistrement existe déjà
        const existing = await prisma.demande.findUnique({
            where: { numeroEnregistrement: data.numeroEnregistrement },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Ce numéro d\'enregistrement existe déjà' },
                { status: 400 }
            );
        }

        // Créer la demande avec l'appelé et les pièces
        const demande = await prisma.demande.create({
            data: {
                numeroEnregistrement: data.numeroEnregistrement,
                dateEnregistrement: data.dateEnregistrement,
                statut: 'ENREGISTREE',
                observations: data.observations || null,
                agentId: session.user.id,
                appele: {
                    create: {
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
                pieces: {
                    create: data.pieces.map((piece) => ({
                        type: piece.type,
                        present: piece.present,
                        conforme: null, // Sera vérifié par l'agent traitant
                    })),
                },
            },
            include: {
                appele: true,
                pieces: true,
            },
        });

        // Log d'audit
        await prisma.auditLog.create({
            data: {
                action: 'DEMANDE_CREEE_SAISIE',
                userId: session.user.id,
                demandeId: demande.id,
                details: JSON.stringify({
                    numeroEnregistrement: demande.numeroEnregistrement,
                    appeleName: `${data.nom} ${data.prenom}`,
                }),
            },
        });

        return NextResponse.json(demande, { status: 201 });

    } catch (error) {
        console.error('Erreur lors de la création de la demande:', error);

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
