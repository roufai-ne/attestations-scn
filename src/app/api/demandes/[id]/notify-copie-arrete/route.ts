/**
 * API Route - Envoyer notification pour demande de copie d'arrêté
 * POST /api/demandes/[id]/notify-copie-arrete
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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

        // Récupérer la demande avec l'appelé
        const demande = await prisma.demande.findUnique({
            where: { id },
            include: {
                appele: true,
            },
        });

        if (!demande) {
            return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
        }

        if (!demande.appele) {
            return NextResponse.json({ error: 'Appelé non trouvé' }, { status: 404 });
        }

        // Vérifier que l'appelé a au moins un moyen de contact
        if (!demande.appele.email && !demande.appele.telephone && !demande.appele.whatsapp) {
            return NextResponse.json(
                { error: 'Aucun moyen de contact disponible pour l\'appelé' },
                { status: 400 }
            );
        }

        // Construire le message de notification
        const message = `Bonjour ${demande.appele.prenom} ${demande.appele.nom},

Votre demande d'attestation de service civique (N° ${demande.numeroEnregistrement}) nécessite une vérification supplémentaire.

Nous n'avons pas pu trouver votre nom dans nos arrêtés enregistrés. Veuillez nous fournir une copie de votre arrêté d'affectation au service civique.

Vous pouvez vous présenter au bureau du Service Civique National avec :
- Une copie de votre arrêté d'affectation
- Une pièce d'identité

Cordialement,
Le Service Civique National`;

        // Déterminer les canaux de notification
        const canaux: CanalNotification[] = [];
        if (demande.appele.email) canaux.push(CanalNotification.EMAIL);
        if (demande.appele.telephone) canaux.push(CanalNotification.SMS);
        if (demande.appele.whatsapp) canaux.push(CanalNotification.WHATSAPP);

        // Créer les notifications
        const notifications = await Promise.all(
            canaux.map((canal) =>
                prisma.notification.create({
                    data: {
                        demandeId: id,
                        canal,
                        destinataire:
                            canal === CanalNotification.EMAIL
                                ? demande.appele!.email!
                                : canal === CanalNotification.WHATSAPP
                                    ? demande.appele!.whatsapp!
                                    : demande.appele!.telephone!,
                        contenu: message,
                        statut: 'EN_ATTENTE',
                    },
                })
            )
        );

        // Essayer d'envoyer les notifications via le service
        try {
            const { notificationService } = await import('@/lib/notifications/notification.service');

            for (const canal of canaux) {
                await notificationService.send({
                    demandeId: id,
                    type: 'DEMANDE_COPIE_ARRETE' as any,
                    canaux: [canal],
                    data: {
                        numeroEnregistrement: demande.numeroEnregistrement,
                        nom: demande.appele.nom,
                        prenom: demande.appele.prenom,
                    },
                });
            }
        } catch (notifError) {
            console.error('Erreur envoi notification copie arrêté:', notifError);
            // Les notifications sont créées mais l'envoi a échoué
        }

        // Logger l'action
        await prisma.auditLog.create({
            data: {
                action: 'NOTIFICATION_COPIE_ARRETE',
                userId: session.user.id,
                demandeId: id,
                details: JSON.stringify({
                    canaux,
                    appelé: {
                        nom: demande.appele.nom,
                        prenom: demande.appele.prenom,
                    },
                }),
                ipAddress: request.headers.get('x-forwarded-for') || undefined,
                userAgent: request.headers.get('user-agent') || undefined,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Notification envoyée avec succès',
            notifications: notifications.length,
            canaux,
        });
    } catch (error) {
        console.error('Erreur envoi notification copie arrêté:', error);
        return NextResponse.json(
            { error: 'Erreur lors de l\'envoi de la notification' },
            { status: 500 }
        );
    }
}
