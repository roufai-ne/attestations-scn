/**
 * API Route - Activer TOTP après vérification du code
 * POST /api/directeur/2fa/enable-totp
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
        const { secret, code, backupCodes } = body;

        if (!secret || !code || !backupCodes) {
            return NextResponse.json(
                { error: 'Secret, code et codes de backup requis' },
                { status: 400 }
            );
        }

        // Activer TOTP après vérification
        const result = await twoFactorService.enableTOTP(
            session.user.id,
            secret,
            code,
            backupCodes
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
            method: 'totp',
        });
    } catch (error) {
        console.error('[2FA] Erreur enable TOTP:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
