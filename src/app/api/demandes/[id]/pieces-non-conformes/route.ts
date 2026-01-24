/**
 * API Route - Signaler des pièces non conformes
 * Met à jour le statut de la demande et notifie l'appelé
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

    const { piecesNonConformes, observations } = await request.json();

    if (!piecesNonConformes || !Array.isArray(piecesNonConformes) || piecesNonConformes.length === 0) {
      return NextResponse.json(
        { error: 'Veuillez spécifier les pièces non conformes' },
        { status: 400 }
      );
    }

    // Vérifier que la demande existe
    const demande = await prisma.demande.findUnique({
      where: { id },
      include: {
        appele: true,
        pieces: true,
      },
    });

    if (!demande) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
    }

    // Vérifier que la demande peut être marquée non conforme
    if (!['EN_TRAITEMENT', 'ENREGISTREE'].includes(demande.statut)) {
      return NextResponse.json(
        { error: 'Cette demande ne peut pas être marquée non conforme dans son état actuel' },
        { status: 400 }
      );
    }

    // Mettre à jour les pièces non conformes
    for (const piece of piecesNonConformes) {
      await prisma.pieceDossier.updateMany({
        where: {
          demandeId: id,
          type: piece.type,
        },
        data: {
          conforme: false,
          observation: piece.observation || 'Pièce non conforme',
        },
      });
    }

    // Mettre à jour le statut de la demande
    const updated = await prisma.demande.update({
      where: { id },
      data: {
        statut: 'PIECES_NON_CONFORMES',
        observations: observations || `Pièces non conformes: ${piecesNonConformes.map((p: any) => p.type).join(', ')}`,
      },
      include: {
        appele: true,
        pieces: true,
      },
    });

    // Logger l'action
    await prisma.auditLog.create({
      data: {
        action: 'PIECES_NON_CONFORMES',
        userId: session.user.id,
        demandeId: id,
        details: JSON.stringify({ piecesNonConformes, observations }),
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    // Envoyer une notification à l'appelé (ACTIVÉE)
    if (updated.appele) {
      try {
        const { notificationService } = await import('@/lib/notifications/notification.service');
        const { shouldSendNotification } = await import('@/lib/notifications/notification.helpers');

        const notifDecision = shouldSendNotification(
          { enabled: true },
          updated.appele
        );

        if (notifDecision.send && notifDecision.channels.length > 0) {
          await notificationService.send({
            demandeId: updated.id,
            type: TypeNotification.PIECES_NON_CONFORMES,
            canaux: notifDecision.channels,
            data: {
              numeroEnregistrement: updated.numeroEnregistrement,
              nom: updated.appele.nom,
              prenom: updated.appele.prenom,
              observations: observations || 'Pièces non conformes détectées',
            },
          });
        }
      } catch (notifError) {
        console.error('Erreur envoi notification pièces non conformes:', notifError);
        // Ne pas bloquer si la notification échoue
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Demande marquée avec pièces non conformes',
      demande: updated,
    });
  } catch (error) {
    console.error('Erreur signalement pièces non conformes:', error);
    return NextResponse.json(
      { error: 'Erreur lors du signalement' },
      { status: 500 }
    );
  }
}
