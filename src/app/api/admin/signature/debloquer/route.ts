import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { signatureService } from '@/lib/services/signature.service';
import { errorResponse } from '@/lib/validation';

/**
 * POST /api/admin/signature/debloquer
 * Permet à un admin de débloquer le PIN d'un directeur
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return errorResponse('Non autorisé', 403);
        }

        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return errorResponse('ID utilisateur manquant', 400);
        }

        const result = await signatureService.debloquerPin(userId, session.user.id);

        if (!result.success) {
            return errorResponse(result.message, 400);
        }

        return NextResponse.json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        console.error('Erreur déblocage PIN:', error);
        return errorResponse('Erreur interne du serveur', 500);
    }
}
