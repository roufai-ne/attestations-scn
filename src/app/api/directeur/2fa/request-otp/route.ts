/**
 * API Route - Demande d'un code OTP 2FA
 * POST /api/directeur/2fa/request-otp
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { twoFactorService } from '@/lib/security/two-factor.service';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    // Rate limiting strict
    const rateLimitResult = await rateLimit(request, 'auth');
    if (!rateLimitResult.success) {
        return rateLimitResult.response;
    }

    try {
        const session = await auth();

        if (!session || session.user.role !== 'DIRECTEUR') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { action, pin } = body;

        // Valider l'action
        const validActions = ['SIGN_ATTESTATION', 'SIGN_BATCH', 'CHANGE_PIN', 'CONFIG_UPDATE'];
        if (!action || !validActions.includes(action)) {
            return NextResponse.json(
                { error: 'Action invalide' },
                { status: 400 }
            );
        }

        // Vérifier le PIN avant d'envoyer l'OTP (première couche de sécurité)
        if (pin) {
            const { signatureService } = await import('@/lib/services/signature.service');
            const pinValidation = await signatureService.validatePin(session.user.id, pin);
            
            if (!pinValidation.valid) {
                return NextResponse.json(
                    { error: pinValidation.reason || 'PIN incorrect' },
                    { status: 403 }
                );
            }
        }

        // Vérifier si 2FA est requis et récupérer la méthode
        const status = await twoFactorService.get2FAStatus(session.user.id);
        if (!status.enabled) {
            return NextResponse.json(
                { error: '2FA non configuré pour ce compte' },
                { status: 400 }
            );
        }

        const { prisma } = await import('@/lib/prisma');

        // Si méthode TOTP, pas besoin d'envoyer d'email
        if (status.method === 'totp' && status.totpConfigured) {
            // Log audit
            await prisma.auditLog.create({
                data: {
                    action: '2FA_TOTP_READY',
                    userId: session.user.id,
                    details: JSON.stringify({ action }),
                },
            });

            return NextResponse.json({
                success: true,
                message: 'PIN validé. Entrez votre code TOTP.',
                method: 'totp',
            });
        }

        // Méthode Email OTP - Envoyer l'OTP par email
        const result = await twoFactorService.sendOTPByEmail(
            session.user.id,
            action as 'SIGN_ATTESTATION' | 'SIGN_BATCH' | 'CHANGE_PIN' | 'CONFIG_UPDATE'
        );

        if (!result.success) {
            return NextResponse.json(
                { error: result.message },
                { status: 500 }
            );
        }

        // Log audit
        await prisma.auditLog.create({
            data: {
                action: '2FA_OTP_REQUESTED',
                userId: session.user.id,
                details: JSON.stringify({ action, method: 'email' }),
            },
        });

        return NextResponse.json({
            success: true,
            message: result.message,
            method: 'email',
            expiresInMinutes: 5,
        });
    } catch (error) {
        console.error('[2FA] Erreur request OTP:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
