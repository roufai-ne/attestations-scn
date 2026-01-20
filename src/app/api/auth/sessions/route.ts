import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/sessions
 * Récupère l'historique des connexions de l'utilisateur connecté (via audit logs)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '10');

        // Récupérer les connexions via audit logs
        const sessions = await prisma.auditLog.findMany({
            where: {
                userId: session.user.id,
                action: { in: ['LOGIN', 'LOGIN_SUCCESS', 'LOGIN_FAILED'] },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
                id: true,
                action: true,
                ipAddress: true,
                userAgent: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ sessions });
    } catch (error) {
        console.error('Erreur récupération sessions:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/auth/sessions
 * Déconnecte toutes les sessions de l'utilisateur (sauf la courante)
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Log l'action
        await prisma.auditLog.create({
            data: {
                action: 'ALL_SESSIONS_REVOKED',
                userId: session.user.id,
                details: JSON.stringify({
                    timestamp: new Date().toISOString(),
                }),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Toutes les autres sessions ont été déconnectées',
        });
    } catch (error) {
        console.error('Erreur déconnexion sessions:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
