import { NextRequest, NextResponse } from 'next/server';
import { attestationService } from '@/lib/services/attestation.service';

/**
 * GET /api/verifier/[code]
 * Vérifie l'authenticité d'une attestation (accessible publiquement)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const signature = searchParams.get('sig');
        const timestamp = searchParams.get('ts');

        const { code } = await params;

        // Si signature et timestamp sont fournis, faire une validation sécurisée
        // Sinon, faire une validation simple par numéro
        let result;
        if (signature && timestamp) {
            result = await attestationService.validateAttestation(
                code,
                signature,
                parseInt(timestamp)
            );
        } else {
            // Validation simple par numéro uniquement
            result = await attestationService.validateAttestationByNumero(code);
        }

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
