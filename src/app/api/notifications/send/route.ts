/**
 * API Route - Envoi de notifications
 * POST /api/notifications/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { enqueueNotification } from '@/lib/notifications';
import { TypeNotification } from '@/lib/notifications/templates';
import { CanalNotification } from '@prisma/client';
import { z } from 'zod';
import { withRateLimit, errorResponse } from '@/lib/api-utils';

// Schéma de validation
const sendNotificationSchema = z.object({
  demandeId: z.string().min(1, 'ID de demande requis'),
  type: z.nativeEnum(TypeNotification),
  canaux: z.array(z.nativeEnum(CanalNotification)).min(1, 'Au moins un canal requis'),
  data: z.object({
    numeroEnregistrement: z.string(),
    numeroAttestation: z.string().optional(),
    nom: z.string(),
    prenom: z.string(),
    dateEnregistrement: z.string().optional(),
    motifRejet: z.string().optional(),
    messagePersonnalise: z.string().optional(),
  }),
  messagePersonnalise: z.string().optional(),
  immediate: z.boolean().optional(), // Si true, envoi immédiat (priorité haute)
});

export async function POST(request: NextRequest) {
  return withRateLimit(request, 'notification', async () => {
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user) {
      return errorResponse('Non authentifié', 401);
    }

    // Vérifier les permissions (Agent ou Admin)
    if (session.user.role !== 'AGENT' && session.user.role !== 'ADMIN') {
      return errorResponse('Non autorisé', 403);
    }

    // Récupérer et valider les données
    const body = await request.json();
    const validation = sendNotificationSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse('Données invalides', 400, validation.error.issues);
    }

    const { demandeId, type, canaux, data, messagePersonnalise, immediate } = validation.data;

    // Ajouter la notification à la queue
    const job = await enqueueNotification(
      {
        demandeId,
        type,
        canaux,
        data,
        messagePersonnalise,
      },
      {
        priority: immediate ? 1 : 5, // Haute priorité si immédiat
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Notification ajoutée à la queue',
      jobId: job.id,
      canaux: canaux,
    });
  });
}
