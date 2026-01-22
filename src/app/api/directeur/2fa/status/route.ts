/**
 * API Route - Vérifier le statut 2FA du directeur
 * GET /api/directeur/2fa/status
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { twoFactorService } from '@/lib/security/two-factor.service';

export async function GET() {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'DIRECTEUR') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        // Récupérer le statut complet
        const status = await twoFactorService.get2FAStatus(session.user.id);

        return NextResponse.json({
            enabled: status.enabled,
            currentMethod: status.method,
            methods: {
                email: {
                    available: true,
                    active: status.method === 'email',
                    description: 'Code envoyé par email (valide 5 minutes)',
                },
                totp: {
                    available: true,
                    configured: status.totpConfigured,
                    active: status.method === 'totp',
                    description: 'Google Authenticator ou app TOTP compatible',
                },
            },
            message: status.enabled
                ? `2FA actif - Méthode: ${status.method === 'email' ? 'Email OTP' : 'TOTP (Authenticator)'}`
                : '2FA non configuré',
        });
    } catch (error) {
        console.error('[2FA] Erreur status:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
