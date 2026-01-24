/**
 * API Route - Gestion d'un utilisateur spécifique (Admin)
 * GET /api/admin/users/[id] - Détails d'un utilisateur
 * PATCH /api/admin/users/[id] - Modifier un utilisateur
 * DELETE /api/admin/users/[id] - Supprimer un utilisateur
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditService } from '@/lib/audit';
import { z } from 'zod';

// Schéma de validation pour modification
const updateUserSchema = z.object({
  nom: z.string().min(1).optional(),
  prenom: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['SAISIE', 'AGENT', 'DIRECTEUR', 'ADMIN']).optional(),
  actif: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        actif: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            demandesTraitees: true,
            attestationsSignees: true,
            auditLogs: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer l'activité récente
    const recentActivity = await auditService.getUserActivity(id, 10);

    return NextResponse.json({
      user,
      recentActivity,
    });
  } catch (error) {
    console.error('Erreur GET user:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { id } = await params;

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Empêcher un admin de se supprimer lui-même le rôle admin
    if (
      id === session.user.id &&
      existingUser.role === 'ADMIN'
    ) {
      const body = await request.json();
      if (body.role && body.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Vous ne pouvez pas retirer votre propre rôle admin' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé' },
          { status: 409 }
        );
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        actif: true,
        updatedAt: true,
      },
    });

    // Log d'audit
    await auditService.logUserUpdated(
      session.user.id!,
      id,
      data,
      request.headers.get('x-forwarded-for') || undefined
    );

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Erreur PATCH user:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { id } = await params;

    // Empêcher un admin de se supprimer lui-même
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 403 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer l'utilisateur (soft delete en désactivant)
    // Ou hard delete si préféré
    await prisma.user.update({
      where: { id: id },
      data: { actif: false },
    });

    // Ou pour un hard delete :
    // await prisma.user.delete({ where: { id: params.id } });

    // Log d'audit
    await auditService.logUserDeleted(
      session.user.id!,
      id,
      user.email,
      request.headers.get('x-forwarded-for') || undefined
    );

    return NextResponse.json({
      success: true,
      message: 'Utilisateur désactivé avec succès',
    });
  } catch (error) {
    console.error('Erreur DELETE user:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
