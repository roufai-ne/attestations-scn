/**
 * API Route - Changer la méthode 2FA préférée
 * PUT /api/directeur/2fa/method
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { twoFactorService } from '@/lib/security/two-factor.service';
import { rateLimit } from '@/lib/rate-limit';

export async function PUT(request: NextRequest) {
    // Rate limiting
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
        const { method } = body;

        if (!method || !['email', 'totp'].includes(method)) {
            return NextResponse.json(
                { error: 'Méthode invalide. Utilisez "email" ou "totp"' },
                { status: 400 }
            );
        }

        // Changer la méthode
        const result = await twoFactorService.setPreferredMethod(
            session.user.id,
            method as 'email' | 'totp'
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
            method,
        });
    } catch (error) {
        console.error('[2FA] Erreur changement méthode:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
