/**
 * API Route - Validation d'une demande
 * Permet à un agent de valider une demande
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'AGENT') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { observations } = await request.json();

    // Vérifier que la demande existe
    const demande = await prisma.demande.findUnique({
      where: { id: params.id },
    });

    if (!demande) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
    }

    // Vérifier que la demande peut être validée
    if (!['EN_TRAITEMENT', 'PIECES_NON_CONFORMES'].includes(demande.statut)) {
      return NextResponse.json(
        { error: 'Cette demande ne peut pas être validée dans son état actuel' },
        { status: 400 }
      );
    }

    // Mettre à jour la demande
    const updated = await prisma.demande.update({
      where: { id: params.id },
      data: {
        statut: 'VALIDEE',
        dateTraitement: new Date(),
        observations: observations || demande.observations,
      },
      include: {
        appele: true,
        agent: true,
      },
    });

    // Logger l'action
    await prisma.auditLog.create({
      data: {
        action: 'DEMANDE_VALIDATED',
        userId: session.user.id,
        demandeId: params.id,
        details: JSON.stringify({ observations }),
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    // Envoyer une notification à l'appelé
    try {
      const { NotificationService } = await import('@/lib/notifications/notification.service');

      if (updated.appele?.email || updated.appele?.telephone) {
        await NotificationService.send({
          type: 'DEMANDE_EN_TRAITEMENT',
          destinataire: {
            nom: `${updated.appele.prenom} ${updated.appele.nom}`,
            email: updated.appele.email || undefined,
            telephone: updated.appele.telephone || undefined,
          },
          data: {
            numeroEnregistrement: updated.numeroEnregistrement,
            nomAppele: `${updated.appele.prenom} ${updated.appele.nom}`,
          },
          demandeId: updated.id,
        });
      }
    } catch (notifError) {
      console.error('Erreur envoi notification:', notifError);
      // Ne pas bloquer la validation si la notification échoue
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erreur validation demande:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la validation' },
      { status: 500 }
    );
  }
}
