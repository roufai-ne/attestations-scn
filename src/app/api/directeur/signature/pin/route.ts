import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { signatureService } from '@/lib/services/signature.service';
import { changerPinSchema, validateRequest, errorResponse } from '@/lib/validation';

/**
 * PUT /api/directeur/signature/pin
 * Permet au directeur de changer son PIN
 */
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'DIRECTEUR') {
            return errorResponse('Non autorisé', 403);
        }

        const body = await request.json();

        // Validation Zod
        const validation = validateRequest(changerPinSchema, body);
        if (!validation.success) {
            return validation.response;
        }

        const { ancienPin, nouveauPin } = validation.data;

        // Changer le PIN
        const result = await signatureService.changerPin(
            session.user.id,
            ancienPin,
            nouveauPin
        );

        if (!result.success) {
            return errorResponse(result.message, 400);
        }

        return NextResponse.json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        console.error('Erreur changement PIN:', error);
        return errorResponse('Erreur interne du serveur', 500);
    }
}
