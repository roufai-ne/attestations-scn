/**
 * API Route - Demande de réinitialisation de mot de passe
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unifiedEmailService } from '@/lib/notifications/unified-email.service';
import { rateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    // Rate limiting strict pour éviter le spam d'emails
    const rateLimitResult = await rateLimit(request, 'auth');
    if (!rateLimitResult.success) {
        return rateLimitResult.response;
    }

    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email requis' },
                { status: 400 }
            );
        }

        // Chercher l'utilisateur
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        // Ne pas révéler si l'utilisateur existe ou non
        if (!user) {
            // Simuler un délai pour éviter le timing attack - augmenté à 1.5s
            await new Promise((resolve) => setTimeout(resolve, 1500));
            return NextResponse.json({
                success: true,
                message: 'Si un compte existe, un email a été envoyé',
            });
        }

        // Générer un token unique
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 heure

        // Supprimer les anciens tokens de cet utilisateur
        await prisma.passwordResetToken.deleteMany({
            where: { userId: user.id },
        });

        // Créer le nouveau token
        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token,
                expiresAt,
            },
        });

        // Envoyer l'email
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const resetLink = `${baseUrl}/reset-password?token=${token}`;

        try {
            await unifiedEmailService.sendPasswordReset(user.email, {
                nom: user.nom,
                prenom: user.prenom,
                resetLink,
                expiresIn: '1 heure',
            });
        } catch (emailError) {
            console.error('Erreur envoi email:', emailError);
            // On ne révèle pas l'erreur d'envoi à l'utilisateur
        }

        // Log dans l'audit
        await prisma.auditLog.create({
            data: {
                action: 'PASSWORD_RESET_REQUESTED',
                userId: user.id,
                details: JSON.stringify({
                    email: user.email,
                    ip: request.headers.get('x-forwarded-for') || 'unknown',
                }),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Si un compte existe, un email a été envoyé',
        });
    } catch (error) {
        console.error('Erreur forgot-password:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
