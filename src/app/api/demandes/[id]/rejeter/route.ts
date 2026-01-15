/**
 * API Route - Rejet d'une demande
 * Permet à un agent de rejeter une demande
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TypeNotification } from '@/lib/notifications/templates';
import { CanalNotification } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'AGENT') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { id } = await params;

    const { motif, envoyerNotification = true } = await request.json();

    if (!motif || !motif.trim()) {
      return NextResponse.json(
        { error: 'Le motif de rejet est obligatoire' },
        { status: 400 }
      );
    }

    // Vérifier que la demande existe
    const demande = await prisma.demande.findUnique({
      where: { id: id },
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
      where: { id: id },
      data: {
        statut: 'REJETEE',
        dateValidation: new Date(),
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
        demandeId: id,
        details: JSON.stringify({ motif }),
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    // Envoyer une notification à l'appelé avec le motif (si demandé)
    if (envoyerNotification) {
      try {
        if (updated.appele?.email || updated.appele?.telephone) {
          const { notificationService } = await import('@/lib/notifications/notification.service');
          
          // Build canaux array based on available contact methods
          const canaux: CanalNotification[] = [];
          if (updated.appele.email) canaux.push(CanalNotification.EMAIL);
          if (updated.appele.telephone) canaux.push(CanalNotification.SMS);
          
          await notificationService.send({
            demandeId: updated.id,
            type: TypeNotification.DEMANDE_REJETEE,
            canaux,
            data: {
              numeroEnregistrement: updated.numeroEnregistrement,
              nom: updated.appele.nom,
              prenom: updated.appele.prenom,
              motifRejet: motif,
            },
          });
        }
      } catch (notifError) {
        console.error('Erreur envoi notification:', notifError);
        // Ne pas bloquer le rejet si la notification échoue
      }
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
