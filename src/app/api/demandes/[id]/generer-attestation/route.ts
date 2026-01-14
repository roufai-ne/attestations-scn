import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { attestationService } from '@/lib/services/attestation.service';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/demandes/[id]/generer-attestation
 * Génère une attestation pour une demande validée
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !['AGENT', 'ADMIN'].includes(session.user.role)) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        // Récupérer la demande avec l'appelé
        const demande = await prisma.demande.findUnique({
            where: { id: params.id },
            include: {
                appele: true,
                attestation: true,
            },
        });

        if (!demande) {
            return NextResponse.json(
                { error: 'Demande introuvable' },
                { status: 404 }
            );
        }

        // Vérifier que la demande est validée
        if (demande.statut !== 'VALIDEE') {
            return NextResponse.json(
                { error: 'La demande doit être validée avant de générer l\'attestation' },
                { status: 400 }
            );
        }

        // Vérifier qu'une attestation n'existe pas déjà
        if (demande.attestation) {
            return NextResponse.json(
                { error: 'Une attestation existe déjà pour cette demande' },
                { status: 400 }
            );
        }

        // Vérifier que l'appelé existe
        if (!demande.appele) {
            return NextResponse.json(
                { error: 'Informations de l\'appelé manquantes' },
                { status: 400 }
            );
        }

        // Générer l'attestation
        const attestation = await attestationService.createAttestation(params.id, {
            demandeId: params.id,
            nom: demande.appele.nom,
            prenom: demande.appele.prenom,
            dateNaissance: demande.appele.dateNaissance,
            lieuNaissance: demande.appele.lieuNaissance,
            diplome: demande.appele.diplome,
            numeroArrete: demande.appele.numeroArrete || '',
            dateDebutService: demande.appele.dateDebutService,
            dateFinService: demande.appele.dateFinService,
            promotion: demande.appele.promotion,
        });

        return NextResponse.json({
            success: true,
            attestation: {
                id: attestation.id,
                numero: attestation.numero,
                dateGeneration: attestation.dateGeneration,
                statut: attestation.statut,
            },
            message: 'Attestation générée avec succès',
        });

    } catch (error) {
        console.error('Erreur lors de la génération de l\'attestation:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erreur serveur' },
            { status: 500 }
        );
    }
}
