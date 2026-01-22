/**
 * API Route - Générer un QR code pour configurer TOTP
 * POST /api/directeur/2fa/setup-totp
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { twoFactorService } from '@/lib/security/two-factor.service';

export async function POST() {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'DIRECTEUR') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        // Générer le secret TOTP et le QR code
        const result = await twoFactorService.setupTOTP(session.user.id);

        return NextResponse.json({
            success: true,
            message: 'Scannez le QR code avec Google Authenticator ou une app TOTP',
            qrCode: result.qrCode,
            secret: result.secret, // Pour saisie manuelle si besoin
            backupCodes: result.backupCodes,
            instructions: [
                '1. Scannez le QR code avec votre application (Google Authenticator, Authy, etc.)',
                '2. Sauvegardez les codes de backup en lieu sûr',
                '3. Validez avec le code généré par l\'application pour activer TOTP',
            ],
        });
    } catch (error) {
        console.error('[2FA] Erreur setup TOTP:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
