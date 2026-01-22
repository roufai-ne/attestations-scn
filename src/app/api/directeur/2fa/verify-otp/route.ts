/**
 * API Route - Vérification d'un code OTP 2FA
 * POST /api/directeur/2fa/verify-otp
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
        const { action, code } = body;

        if (!action || !code) {
            return NextResponse.json(
                { error: 'Action et code requis' },
                { status: 400 }
            );
        }

        // Vérifier l'OTP
        const result = await twoFactorService.verifyOTP(
            session.user.id,
            action,
            code.toString()
        );

        if (!result.valid) {
            // Log audit échec
            const { prisma } = await import('@/lib/prisma');
            await prisma.auditLog.create({
                data: {
                    action: '2FA_OTP_FAILED',
                    userId: session.user.id,
                    details: JSON.stringify({ action, error: result.error }),
                },
            });

            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        // Générer un token de session 2FA (valide 15 minutes)
        const sessionToken = twoFactorService.generateSessionToken(
            session.user.id,
            action
        );

        // Log audit succès
        const { prisma } = await import('@/lib/prisma');
        await prisma.auditLog.create({
            data: {
                action: '2FA_OTP_VERIFIED',
                userId: session.user.id,
                details: JSON.stringify({ action }),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Code vérifié avec succès',
            sessionToken,
            validForMinutes: 15,
        });
    } catch (error) {
        console.error('[2FA] Erreur verify OTP:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
