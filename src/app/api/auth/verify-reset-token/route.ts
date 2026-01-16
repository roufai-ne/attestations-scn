/**
 * API Route - Vérification du token de reset
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const token = request.nextUrl.searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { valid: false, error: 'Token manquant' },
                { status: 400 }
            );
        }

        // Chercher le token
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
        });

        if (!resetToken) {
            return NextResponse.json(
                { valid: false, error: 'Token invalide' },
                { status: 404 }
            );
        }

        // Vérifier l'expiration
        if (resetToken.expiresAt < new Date()) {
            return NextResponse.json(
                { valid: false, error: 'Token expiré' },
                { status: 400 }
            );
        }

        return NextResponse.json({ valid: true });
    } catch (error) {
        console.error('Erreur verify-reset-token:', error);
        return NextResponse.json(
            { valid: false, error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
