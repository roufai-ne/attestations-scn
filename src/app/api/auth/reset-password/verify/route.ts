/**
 * API Route - Vérification du token de réinitialisation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json(
                { error: 'Token requis' },
                { status: 400 }
            );
        }

        // Vérifier le token
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
        });

        if (!resetToken) {
            return NextResponse.json(
                { error: 'Token invalide' },
                { status: 400 }
            );
        }

        if (resetToken.expiresAt < new Date()) {
            // Supprimer le token expiré
            await prisma.passwordResetToken.delete({
                where: { token },
            });
            return NextResponse.json(
                { error: 'Token expiré' },
                { status: 400 }
            );
        }

        return NextResponse.json({ valid: true });
    } catch (error) {
        console.error('Erreur vérification token:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
