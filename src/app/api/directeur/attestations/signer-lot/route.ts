import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { signatureService } from '@/lib/services/signature.service';
import { twoFactorService } from '@/lib/security/two-factor.service';

/**
 * POST /api/directeur/attestations/signer-lot
 * Signe plusieurs attestations en lot avec vérification 2FA
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'DIRECTEUR') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { attestationIds, pin, twoFactorToken } = body;

        if (!attestationIds || !Array.isArray(attestationIds) || attestationIds.length === 0) {
            return NextResponse.json(
                { error: 'Liste d\'attestations manquante' },
                { status: 400 }
            );
        }

        if (!pin) {
            return NextResponse.json(
                { error: 'PIN manquant' },
                { status: 400 }
            );
        }

        // Vérifier si 2FA est requis
        const is2FARequired = await twoFactorService.is2FARequired(session.user.id);
        
        if (is2FARequired) {
            // Vérifier le token 2FA
            if (!twoFactorToken) {
                return NextResponse.json(
                    { error: 'Code 2FA requis. Demandez un code via /api/directeur/2fa/request-otp avec action=SIGN_BATCH' },
                    { status: 403 }
                );
            }

            const tokenVerification = twoFactorService.verifySessionToken(
                twoFactorToken,
                'SIGN_BATCH'
            );

            if (!tokenVerification.valid || tokenVerification.userId !== session.user.id) {
                return NextResponse.json(
                    { error: 'Code 2FA invalide ou expiré' },
                    { status: 403 }
                );
            }
        }

        // Signer en lot
        const results = await signatureService.signAttestationsLot(
            attestationIds,
            session.user.id,
            pin
        );

        return NextResponse.json({
            success: true,
            message: `${results.success.length} attestation(s) signée(s)`,
            results: {
                signees: results.success.length,
                erreurs: results.errors.length,
                details: results.errors,
            },
        });
    } catch (error) {
        console.error('Erreur lors de la signature en lot:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erreur serveur' },
            { status: 500 }
        );
    }
}
