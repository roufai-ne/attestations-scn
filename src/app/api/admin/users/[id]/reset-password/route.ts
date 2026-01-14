/**
 * API Route - Réinitialisation du mot de passe utilisateur (Admin)
 * POST /api/admin/users/[id]/reset-password
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { auditService, AuditAction } from '@/lib/audit';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Mot de passe minimum 8 caractères'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { newPassword } = validation.data;

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await hashPassword(newPassword);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: params.id },
      data: { password: hashedPassword },
    });

    // Log d'audit
    await auditService.log({
      action: AuditAction.USER_PASSWORD_RESET,
      userId: session.user.id!,
      details: {
        targetUserId: params.id,
        targetUserEmail: user.email,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
    });
  } catch (error) {
    console.error('Erreur reset password:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
