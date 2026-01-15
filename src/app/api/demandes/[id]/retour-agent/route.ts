/**
 * API Route - Retour d'une demande à l'agent traitant
 * Permet au directeur de retourner un dossier avec une remarque
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'DIRECTEUR') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { id } = await params;
    const { remarque } = await request.json();

    if (!remarque || !remarque.trim()) {
      return NextResponse.json(
        { error: 'La remarque est obligatoire' },
        { status: 400 }
      );
    }

    // Vérifier que la demande existe
    const demande = await prisma.demande.findUnique({
      where: { id },
      include: { attestation: true },
    });

    if (!demande) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
    }

    // Vérifier que le dossier est en attente de signature
    if (demande.statut !== 'EN_ATTENTE_SIGNATURE') {
      return NextResponse.json(
        { error: 'Seuls les dossiers en attente de signature peuvent être retournés' },
        { status: 400 }
      );
    }

    // Retourner le dossier en EN_TRAITEMENT
    const updated = await prisma.demande.update({
      where: { id },
      data: {
        statut: 'EN_TRAITEMENT',
        observations: demande.observations 
          ? `${demande.observations}\n\n[Retour directeur] ${remarque}`
          : `[Retour directeur] ${remarque}`,
      },
    });

    // Logger l'action
    await prisma.auditLog.create({
      data: {
        action: 'DEMANDE_RETURNED_BY_DIRECTOR',
        userId: session.user.id,
        demandeId: id,
        details: JSON.stringify({ remarque }),
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    // Créer une entrée dans l'historique
    await prisma.historiqueStatut.create({
      data: {
        demandeId: id,
        statut: 'EN_TRAITEMENT',
        commentaire: `Retourné par le directeur: ${remarque}`,
        modifiePar: session.user.id,
      },
    });

    // Si une attestation existe, la supprimer ou la marquer comme annulée
    if (demande.attestation) {
      await prisma.attestation.delete({
        where: { id: demande.attestation.id },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erreur retour agent:', error);
    return NextResponse.json(
      { error: 'Erreur lors du retour' },
      { status: 500 }
    );
  }
}
