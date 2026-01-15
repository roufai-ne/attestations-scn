import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * PATCH /api/demandes/[id]/pieces/[pieceId]/verify
 * Marquer une pièce comme conforme ou non conforme
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; pieceId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        // Seuls les agents peuvent vérifier les pièces
        if (session.user.role !== 'AGENT') {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const { id: demandeId, pieceId } = await params;
        const body = await request.json();
        const { conforme } = body;

        if (typeof conforme !== 'boolean') {
            return NextResponse.json(
                { error: 'Le champ conforme est requis et doit être un booléen' },
                { status: 400 }
            );
        }

        // Vérifier que la demande existe et est en traitement
        const demande = await prisma.demande.findUnique({
            where: { id: demandeId },
            select: { 
                id: true, 
                statut: true,
                agentId: true,
            },
        });

        if (!demande) {
            return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
        }

        const statutsAutorisés = ['ENREGISTREE', 'EN_TRAITEMENT', 'PIECES_NON_CONFORMES'];
        if (!statutsAutorisés.includes(demande.statut)) {
            return NextResponse.json(
                { error: 'Cette demande ne peut plus être modifiée' },
                { status: 400 }
            );
        }

        // Vérifier que la pièce appartient à cette demande
        const piece = await prisma.pieceDossier.findFirst({
            where: {
                id: pieceId,
                demandeId: demandeId,
            },
        });

        if (!piece) {
            return NextResponse.json({ error: 'Pièce non trouvée' }, { status: 404 });
        }

        // Vérifier que la pièce est présente dans le dossier
        if (!piece.present) {
            return NextResponse.json(
                { error: 'Impossible de vérifier une pièce manquante' },
                { status: 400 }
            );
        }

        // Mettre à jour la pièce
        await prisma.pieceDossier.update({
            where: { id: pieceId },
            data: {
                conforme,
                statutVerification: conforme ? 'CONFORME' : 'NON_CONFORME',
                dateVerification: new Date(),
                verifiePar: session.user.id,
            },
        });

        // Créer une entrée dans l'historique
        await prisma.historiqueStatut.create({
            data: {
                demandeId,
                statut: demande.statut,
                commentaire: `Pièce "${piece.type}" marquée comme ${conforme ? 'conforme' : 'non conforme'}`,
                modifiePar: session.user.id,
            },
        });

        // Vérifier si toutes les pièces présentes sont vérifiées
        const allPieces = await prisma.pieceDossier.findMany({
            where: { demandeId },
            select: { present: true, statutVerification: true },
        });

        const piecesPresentes = allPieces.filter(p => p.present);
        const toutesVerifiees = piecesPresentes.length > 0 && 
            piecesPresentes.every(p => p.statutVerification !== null);

        // Si toutes les pièces présentes sont vérifiées, passer en EN_TRAITEMENT
        if (toutesVerifiees && demande.statut === 'ENREGISTREE') {
            await prisma.demande.update({
                where: { id: demandeId },
                data: { statut: 'EN_TRAITEMENT' },
            });

            await prisma.historiqueStatut.create({
                data: {
                    demandeId,
                    statut: 'EN_TRAITEMENT',
                    commentaire: 'Toutes les pièces présentes ont été vérifiées',
                    modifiePar: session.user.id,
                },
            });
        }

        return NextResponse.json({
            success: true,
            message: `Pièce marquée comme ${conforme ? 'conforme' : 'non conforme'}`,
        });
    } catch (error) {
        console.error('Erreur lors de la vérification de la pièce:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la vérification' },
            { status: 500 }
        );
    }
}
