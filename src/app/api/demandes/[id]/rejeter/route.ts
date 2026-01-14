/**
 * API Route - Rejet d'une demande
 * Permet à un agent de rejeter une demande
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

    const { motif } = await request.json();

    if (!motif || !motif.trim()) {
      return NextResponse.json(
        { error: 'Le motif de rejet est obligatoire' },
        { status: 400 }
      );
    }

    // Vérifier que la demande existe
    const demande = await prisma.demande.findUnique({
      where: { id: params.id },
    });

    if (!demande) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
    }

    // Vérifier que la demande peut être rejetée
    if (!['EN_TRAITEMENT', 'PIECES_NON_CONFORMES'].includes(demande.statut)) {
      return NextResponse.json(
        { error: 'Cette demande ne peut pas être rejetée dans son état actuel' },
        { status: 400 }
      );
    }

    // Mettre à jour la demande
    const updated = await prisma.demande.update({
      where: { id: params.id },
      data: {
        statut: 'REJETEE',
        dateTraitement: new Date(),
        observations: motif,
      },
      include: {
        appele: true,
        agent: true,
      },
    });

    // Logger l'action
    await prisma.auditLog.create({
      data: {
        action: 'DEMANDE_REJECTED',
        userId: session.user.id,
        demandeId: params.id,
        details: JSON.stringify({ motif }),
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    // Envoyer une notification à l'appelé avec le motif
    try {
      const { NotificationService } = await import('@/lib/notifications/notification.service');

      if (updated.appele?.email || updated.appele?.telephone) {
        await NotificationService.send({
          type: 'DEMANDE_REJETEE',
          destinataire: {
            nom: `${updated.appele.prenom} ${updated.appele.nom}`,
            email: updated.appele.email || undefined,
            telephone: updated.appele.telephone || undefined,
          },
          data: {
            numeroEnregistrement: updated.numeroEnregistrement,
            nomAppele: `${updated.appele.prenom} ${updated.appele.nom}`,
            motifRejet: motif,
          },
          demandeId: updated.id,
        });
      }
    } catch (notifError) {
      console.error('Erreur envoi notification:', notifError);
      // Ne pas bloquer le rejet si la notification échoue
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erreur rejet demande:', error);
    return NextResponse.json(
      { error: 'Erreur lors du rejet' },
      { status: 500 }
    );
  }
}
