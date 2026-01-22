import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { signatureService } from '@/lib/services/signature.service';
import { TypeNotification } from '@/lib/notifications/templates';
import { CanalNotification } from '@prisma/client';
import { withRateLimit, errorResponse, isDirecteurOrAdmin } from '@/lib/api-utils';
import { twoFactorService } from '@/lib/security/two-factor.service';

/**
 * POST /api/directeur/attestations/[id]/signer
 * Signe une attestation avec vérification 2FA
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // Rate limit strict pour la signature (opération sensible)
    return withRateLimit(request, 'generation', async () => {
        const session = await auth();

        if (!session || session.user.role !== 'DIRECTEUR') {
            return errorResponse('Non autorisé', 403);
        }

        const { id } = await params;

        const body = await request.json();
        const { pin, twoFactorToken } = body;

        if (!pin) {
            return errorResponse('PIN manquant', 400);
        }

        // Vérifier si 2FA est requis
        const is2FARequired = await twoFactorService.is2FARequired(session.user.id);
        
        if (is2FARequired) {
            // Vérifier le token 2FA
            if (!twoFactorToken) {
                return errorResponse('Code 2FA requis. Demandez un code via /api/directeur/2fa/request-otp avec action=SIGN_ATTESTATION', 403);
            }

            const tokenVerification = twoFactorService.verifySessionToken(
                twoFactorToken,
                'SIGN_ATTESTATION'
            );

            if (!tokenVerification.valid || tokenVerification.userId !== session.user.id) {
                return errorResponse('Code 2FA invalide ou expiré', 403);
            }
        }

        // Signer l'attestation
        const attestation = await signatureService.signAttestation(
            id,
            session.user.id,
            pin
        );

        // Envoyer une notification à l'appelé
        try {
            const { prisma } = await import('@/lib/prisma');

            const attestationData = await prisma.attestation.findUnique({
                where: { id: id },
                include: {
                    demande: {
                        include: {
                            appele: true,
                        },
                    },
                },
            });

            if (attestationData?.demande.appele) {
                const appele = attestationData.demande.appele;
                if (appele.email || appele.telephone) {
                    const { notificationService } = await import('@/lib/notifications/notification.service');
                    
                    // Build canaux array based on available contact methods
                    const canaux: CanalNotification[] = [];
                    if (appele.email) canaux.push(CanalNotification.EMAIL);
                    if (appele.telephone) canaux.push(CanalNotification.SMS);
                    
                    await notificationService.send({
                        demandeId: attestationData.demande.id,
                        type: TypeNotification.ATTESTATION_PRETE,
                        canaux,
                        data: {
                            numeroEnregistrement: attestationData.demande.numeroEnregistrement,
                            nom: appele.nom,
                            prenom: appele.prenom,
                            numeroAttestation: attestation.numero,
                        },
                    });
                }
            }
        } catch (notifError) {
            console.error('Erreur notification signature attestation:', notifError);
            // Ne pas bloquer si la notification échoue
        }

        return NextResponse.json({
            success: true,
            message: 'Attestation signée avec succès',
            attestation: {
                id: attestation.id,
                numero: attestation.numero,
                statut: attestation.statut,
                dateSignature: attestation.dateSignature,
            },
        });
    });
}
