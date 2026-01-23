/**
 * API Route - Notifications utilisateur
 * GET /api/notifications - Récupérer les notifications de l'utilisateur connecté
 * PATCH /api/notifications/[id] - Marquer une notification comme lue
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/notifications
 * Récupère les notifications récentes de l'utilisateur connecté
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const nonLues = searchParams.get('nonLues') === 'true';

    // Pour l'instant, on retourne les dernières actions d'audit de l'utilisateur
    // comme "notifications" (en attendant un vrai système de notifications internes)
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        userId: session.user.id,
        ...(nonLues ? {} : {}), // Placeholder pour futur système de lecture
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        demande: {
          select: {
            id: true,
            statut: true,
            appele: {
              select: {
                nom: true,
                prenom: true,
              },
            },
          },
        },
      },
    });

    // Formater les logs d'audit en notifications
    const notifications = auditLogs.map((log) => ({
      id: log.id,
      titre: getNotificationTitle(log.action),
      message: getNotificationMessage(log.action, log.demande),
      type: getNotificationType(log.action),
      lu: false, // Placeholder
      createdAt: log.createdAt,
      demandeId: log.demandeId,
    }));

    return NextResponse.json({
      notifications,
      total: notifications.length,
      nonLues: notifications.filter((n) => !n.lu).length,
    });
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Helpers pour formater les notifications
function getNotificationTitle(action: string): string {
  const titles: Record<string, string> = {
    // Demandes
    DEMANDE_CREEE: 'Nouvelle demande créée',
    DEMANDE_VALIDATED: 'Demande validée',
    DEMANDE_VALIDEE: 'Demande validée',
    DEMANDE_REJETEE: 'Demande rejetée',
    DEMANDE_MODIFIEE: 'Demande modifiée',
    
    // Attestations
    ATTESTATION_GENEREE: 'Attestation générée',
    ATTESTATION_SIGNEE: 'Attestation signée',
    ATTESTATION_TELECHARGEE: 'Attestation téléchargée',
    
    // Pièces
    VERIFICATION_PIECE: 'Vérification en cours',
    PIECE_VALIDEE: 'Pièce validée',
    PIECE_REJETEE: 'Pièce rejetée',
    PIECES_UPLOADEES: 'Pièces ajoutées',
    
    // Utilisateurs (Admin)
    USER_CREATED: 'Nouvel utilisateur',
    USER_UPDATED: 'Utilisateur modifié',
    USER_DELETED: 'Utilisateur supprimé',
    
    // Arrêtés (Admin)
    ARRETE_UPLOADED: 'Arrêté importé',
    ARRETE_INDEXED: 'Arrêté indexé',
    ARRETE_DELETED: 'Arrêté supprimé',
    
    // Autres
    LOGIN: 'Connexion',
    LOGOUT: 'Déconnexion',
    PASSWORD_CHANGED: 'Mot de passe modifié',
  };

  return titles[action] || formatActionName(action);
}

function formatActionName(action: string): string {
  return action
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getNotificationMessage(action: string, demande: any): string {
  if (!demande) {
    // Messages sans demande (actions admin, utilisateurs, etc.)
    const messages: Record<string, string> = {
      USER_CREATED: 'Un nouvel utilisateur a été créé',
      USER_UPDATED: 'Un utilisateur a été modifié',
      USER_DELETED: 'Un utilisateur a été supprimé',
      ARRETE_UPLOADED: 'Un nouvel arrêté a été importé',
      ARRETE_INDEXED: 'Un arrêté a été indexé avec succès',
      ARRETE_DELETED: 'Un arrêté a été supprimé',
      LOGIN: 'Vous vous êtes connecté',
      LOGOUT: 'Vous vous êtes déconnecté',
      PASSWORD_CHANGED: 'Votre mot de passe a été modifié',
    };
    
    return messages[action] || 'Action effectuée';
  }

  if (!demande.appele) return 'Action sur une demande';

  const nom = `${demande.appele.prenom} ${demande.appele.nom}`;

  const messages: Record<string, string> = {
    DEMANDE_CREEE: `Nouvelle demande pour ${nom}`,
    DEMANDE_VALIDATED: `La demande de ${nom} a été validée`,
    DEMANDE_VALIDEE: `La demande de ${nom} a été validée`,
    DEMANDE_REJETEE: `La demande de ${nom} a été rejetée`,
    DEMANDE_MODIFIEE: `La demande de ${nom} a été modifiée`,
    ATTESTATION_GENEREE: `L'attestation de ${nom} a été générée`,
    ATTESTATION_SIGNEE: `L'attestation de ${nom} a été signée`,
    ATTESTATION_TELECHARGEE: `L'attestation de ${nom} a été téléchargée`,
    VERIFICATION_PIECE: `Vérification des pièces de ${nom} en cours`,
    PIECE_VALIDEE: `Les pièces de ${nom} ont été validées`,
    PIECE_REJETEE: `Les pièces de ${nom} ont été rejetées`,
    PIECES_UPLOADEES: `De nouvelles pièces ont été ajoutées pour ${nom}`,
  };

  return messages[action] || `Action effectuée sur la demande de ${nom}`;
}

function getNotificationType(action: string): 'info' | 'success' | 'warning' | 'error' {
  if (action.includes('VALIDEE') || action.includes('GENEREE') || action.includes('SIGNEE')) {
    return 'success';
  }
  if (action.includes('REJETEE')) {
    return 'error';
  }
  if (action.includes('VERIFICATION')) {
    return 'warning';
  }
  return 'info';
}
