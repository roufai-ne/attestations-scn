/**
 * API Route - Réinitialisation du mot de passe
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, password } = body;

        if (!token || !password) {
            return NextResponse.json(
                { error: 'Token et mot de passe requis' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Le mot de passe doit contenir au moins 8 caractères' },
                { status: 400 }
            );
        }

        // Vérifier le token
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!resetToken) {
            return NextResponse.json(
                { error: 'Token invalide' },
                { status: 400 }
            );
        }

        if (resetToken.expiresAt < new Date()) {
            await prisma.passwordResetToken.delete({
                where: { token },
            });
            return NextResponse.json(
                { error: 'Token expiré' },
                { status: 400 }
            );
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Mettre à jour le mot de passe et supprimer le token
        await prisma.$transaction([
            prisma.user.update({
                where: { id: resetToken.userId },
                data: { password: hashedPassword },
            }),
            prisma.passwordResetToken.delete({
                where: { token },
            }),
        ]);

        // Log dans l'audit
        await prisma.auditLog.create({
            data: {
                action: 'PASSWORD_RESET_COMPLETED',
                userId: resetToken.userId,
                details: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    ip: request.headers.get('x-forwarded-for') || 'unknown',
                }),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Mot de passe réinitialisé avec succès',
        });
    } catch (error) {
        console.error('Erreur reset-password:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
