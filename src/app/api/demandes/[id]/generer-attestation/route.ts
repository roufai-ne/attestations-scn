import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { attestationService } from '@/lib/services/attestation.service';
import { prisma } from '@/lib/prisma';
import { TypeNotification } from '@/lib/notifications/templates';
import { withRateLimit, errorResponse } from '@/lib/api-utils';

/**
 * POST /api/demandes/[id]/generer-attestation
 * Génère une attestation pour une demande validée
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withRateLimit(request, 'generation', async () => {
        const session = await auth();

        if (!session || !['AGENT', 'ADMIN'].includes(session.user.role)) {
            return errorResponse('Non autorisé', 403);
        }

        const { id } = await params;

        // Récupérer la demande avec l'appelé
        const demande = await prisma.demande.findUnique({
            where: { id },
            include: {
                appele: true,
                attestation: true,
            },
        });

        if (!demande) {
            return errorResponse('Demande introuvable', 404);
        }

        // Vérifier que la demande est validée
        if (demande.statut !== 'VALIDEE') {
            return errorResponse('La demande doit être validée avant de générer l\'attestation', 400);
        }

        // Vérifier qu'une attestation n'existe pas déjà
        if (demande.attestation) {
            return errorResponse('Une attestation existe déjà pour cette demande', 400);
        }

        // Vérifier que l'appelé existe
        if (!demande.appele) {
            return errorResponse('Informations de l\'appelé manquantes', 400);
        }

        // Générer l'attestation
        const attestation = await attestationService.createAttestation(id, {
            demandeId: id,
            nom: demande.appele.nom,
            prenom: demande.appele.prenom,
            dateNaissance: demande.appele.dateNaissance,
            lieuNaissance: demande.appele.lieuNaissance,
            diplome: demande.appele.diplome,
            numeroArrete: demande.appele.numeroArrete || '',
            dateDebutService: demande.appele.dateDebutService,
            dateFinService: demande.appele.dateFinService,
            promotion: demande.appele.promotion,
            lieuService: demande.appele.structure ?? undefined,
        });

        // Mettre à jour le statut de la demande à EN_ATTENTE_SIGNATURE
        await prisma.demande.update({
            where: { id },
            data: { statut: 'EN_ATTENTE_SIGNATURE' },
        });

        // Logger le changement de statut
        await prisma.historiqueStatut.create({
            data: {
                demandeId: id,
                statut: 'EN_ATTENTE_SIGNATURE',
                commentaire: 'Attestation générée, en attente de signature',
                modifiePar: session.user.id,
            },
        });

        // Envoyer une notification à l'appelé
        // Pas de notification lors de la génération (envoyée lors de la signature)

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
    });
}
