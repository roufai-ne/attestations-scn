/**
 * API Route - Profil utilisateur
 * GET: Récupère le profil de l'utilisateur connecté
 * PUT: Met à jour le profil de l'utilisateur connecté
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                nom: true,
                prenom: true,
                role: true,
                actif: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Utilisateur non trouvé' },
                { status: 404 }
            );
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Erreur récupération profil:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { nom, prenom, telephone } = body;

        // Validation basique
        if (!nom || !prenom) {
            return NextResponse.json(
                { error: 'Nom et prénom requis' },
                { status: 400 }
            );
        }

        // Mise à jour
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                nom: nom.trim(),
                prenom: prenom.trim(),
                // Le téléphone n'est pas dans le schéma actuel, 
                // on peut l'ajouter si nécessaire
            },
            select: {
                id: true,
                email: true,
                nom: true,
                prenom: true,
                role: true,
                actif: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // Log de l'action
        await prisma.auditLog.create({
            data: {
                action: 'PROFILE_UPDATED',
                userId: session.user.id,
                details: JSON.stringify({
                    changes: { nom, prenom },
                }),
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
