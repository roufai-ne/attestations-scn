/**
 * API Route - Changement de mot de passe
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const { currentPassword, newPassword } = await request.json();

        // Validation
        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Mot de passe actuel et nouveau requis' },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' },
                { status: 400 }
            );
        }

        // Récupérer l'utilisateur avec son mot de passe
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, password: true },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Utilisateur non trouvé' },
                { status: 404 }
            );
        }

        // Vérifier le mot de passe actuel
        const isValid = await bcrypt.compare(currentPassword, user.password);

        if (!isValid) {
            // Logger la tentative échouée
            await prisma.auditLog.create({
                data: {
                    action: 'PASSWORD_CHANGE_FAILED',
                    userId: session.user.id,
                    details: JSON.stringify({ reason: 'current_password_invalid' }),
                    ipAddress: request.headers.get('x-forwarded-for') || undefined,
                },
            });

            return NextResponse.json(
                { error: 'Mot de passe actuel incorrect' },
                { status: 400 }
            );
        }

        // Hasher le nouveau mot de passe
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Mettre à jour
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: newPasswordHash },
        });

        // Logger le succès
        await prisma.auditLog.create({
            data: {
                action: 'PASSWORD_CHANGED',
                userId: session.user.id,
                details: JSON.stringify({ method: 'settings_page' }),
                ipAddress: request.headers.get('x-forwarded-for') || undefined,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Mot de passe modifié avec succès',
        });
    } catch (error) {
        console.error('Erreur changement mot de passe:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
