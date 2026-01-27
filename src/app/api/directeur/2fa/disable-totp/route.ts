/**
 * API Route - Désactiver TOTP et revenir à Email OTP
 * POST /api/directeur/2fa/disable-totp
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
        const { code, force } = body;

        // Si force=true, désactiver sans vérification (pour reconfiguration)
        if (force) {
            const { prisma } = await import('@/lib/prisma');
            await prisma.directeurSignature.update({
                where: { userId: session.user.id },
                data: {
                    twoFactorMethod: 'email',
                    totpSecret: null,
                    totpEnabled: false,
                    totpBackupCodes: null,
                },
            });

            // Log audit
            await prisma.auditLog.create({
                data: {
                    action: 'TOTP_RESET',
                    userId: session.user.id,
                    details: JSON.stringify({ reason: 'reconfiguration' }),
                },
            });

            return NextResponse.json({
                success: true,
                message: 'TOTP réinitialisé pour reconfiguration',
                method: 'email',
            });
        }

        if (!code) {
            return NextResponse.json(
                { error: 'Code de vérification requis' },
                { status: 400 }
            );
        }

        // Désactiver TOTP après vérification
        const result = await twoFactorService.disableTOTP(
            session.user.id,
            code
        );

        if (!result.success) {
            return NextResponse.json(
                { error: result.message },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: result.message,
            method: 'email',
        });
    } catch (error) {
        console.error('[2FA] Erreur disable TOTP:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
