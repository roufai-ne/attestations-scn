/**
 * API Route - Réinitialisation du mot de passe utilisateur (Admin)
 * POST /api/admin/users/[id]/reset-password
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { auditService, AuditAction } from '@/lib/audit';
import { z } from 'zod';
import { withRateLimit, errorResponse, isAdmin } from '@/lib/api-utils';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Mot de passe minimum 8 caractères'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit strict pour les opérations de mot de passe (type 'auth')
  return withRateLimit(request, 'auth', async () => {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
      return errorResponse('Non autorisé', 403);
    }

    const { id } = await params;

    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse('Données invalides', 400, validation.error.issues);
    }

    const { newPassword } = validation.data;

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: id },
      select: { id: true, email: true },
    });

    if (!user) {
      return errorResponse('Utilisateur non trouvé', 404);
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await hashPassword(newPassword);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: id },
      data: { password: hashedPassword },
    });

    // Log d'audit
    await auditService.log({
      action: AuditAction.USER_PASSWORD_RESET,
      userId: session.user.id!,
      details: {
        targetUserId: id,
        targetUserEmail: user.email,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
    });
  });
}
