import { NextRequest, NextResponse } from 'next/server';
import { attestationService } from '@/lib/services/attestation.service';

/**
 * GET /api/verifier/[code]
 * Vérifie l'authenticité d'une attestation (accessible publiquement)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { code: string } }
) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const signature = searchParams.get('sig');
        const timestamp = searchParams.get('ts');

        if (!signature || !timestamp) {
            return NextResponse.json(
                { error: 'Paramètres de vérification manquants' },
                { status: 400 }
            );
        }

        // Valider l'attestation
        const result = await attestationService.validateAttestation(
            params.code,
            signature,
            parseInt(timestamp)
        );

        if (!result.valid) {
            return NextResponse.json(
                {
                    valid: false,
                    reason: result.reason,
                },
                { status: 200 }
            );
        }

        return NextResponse.json({
            valid: true,
            attestation: result.attestation,
        });

    } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
