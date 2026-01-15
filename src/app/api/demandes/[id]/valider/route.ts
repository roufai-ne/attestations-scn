/**
 * API Route - Validation d'une demande
 * Permet à un agent de valider une demande
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

    const { observations, envoyerNotification = true } = await request.json();

    // Vérifier que la demande existe
    const demande = await prisma.demande.findUnique({
      where: { id: id },
    });

    if (!demande) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
    }

    // Vérifier que la demande peut être validée
    if (!['ENREGISTREE', 'EN_TRAITEMENT', 'PIECES_NON_CONFORMES'].includes(demande.statut)) {
      return NextResponse.json(
        { error: 'Cette demande ne peut pas être validée dans son état actuel' },
        { status: 400 }
      );
    }

    // Mettre à jour la demande
    const updated = await prisma.demande.update({
      where: { id: id },
      data: {
        statut: 'VALIDEE',
        dateValidation: new Date(),
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
        demandeId: id,
        details: JSON.stringify({ observations }),
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    // Envoyer une notification à l'appelé (si demandé)
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
          type: TypeNotification.DEMANDE_EN_TRAITEMENT,
          canaux,
          data: {
            numeroEnregistrement: updated.numeroEnregistrement,
            nom: updated.appele.nom,
            prenom: updated.appele.prenom,
          },
        });
      }
      } catch (notifError) {
        console.error('Erreur envoi notification:', notifError);
        // Ne pas bloquer la validation si la notification échoue
      }
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
