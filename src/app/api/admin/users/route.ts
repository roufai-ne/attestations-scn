/**
 * API Route - Gestion des utilisateurs (Admin)
 * GET /api/admin/users - Liste des utilisateurs
 * POST /api/admin/users - Créer un utilisateur
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { auditService, AuditAction } from '@/lib/audit';
import { z } from 'zod';
import { withRateLimit, errorResponse, isAdmin, getPaginationParams, paginatedResponse } from '@/lib/api-utils';

// Schéma de validation pour création d'utilisateur
const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  nom: z.string().min(1, 'Nom requis'),
  prenom: z.string().min(1, 'Prénom requis'),
  role: z.enum(['SAISIE', 'AGENT', 'DIRECTEUR', 'ADMIN']),
  password: z.string().min(8, 'Mot de passe minimum 8 caractères'),
  actif: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  return withRateLimit(request, 'admin', async () => {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
      return errorResponse('Non autorisé', 403);
    }

    // Paramètres de filtrage et pagination
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const actif = searchParams.get('actif');
    const search = searchParams.get('search');
    const { page, limit, skip } = getPaginationParams(searchParams);

    // Construction de la requête
    const where: any = {};

    if (role) where.role = role;
    if (actif !== null && actif !== undefined) {
      where.actif = actif === 'true';
    }
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Récupérer les utilisateurs
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  });
}

export async function POST(request: NextRequest) {
  return withRateLimit(request, 'admin', async () => {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
      return errorResponse('Non autorisé', 403);
    }

    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse('Données invalides', 400, validation.error.issues);
    }

    const data = validation.data;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return errorResponse('Cet email est déjà utilisé', 409);
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(data.password);

    // Créer l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        nom: data.nom,
        prenom: data.prenom,
        role: data.role,
        actif: data.actif,
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        actif: true,
        createdAt: true,
      },
    });

    // Log d'audit
    await auditService.logUserCreated(
      session.user.id!,
      newUser.id,
      { email: newUser.email, role: newUser.role },
      request.headers.get('x-forwarded-for') || undefined
    );

    return NextResponse.json({
      success: true,
      user: newUser,
    });
  });
}
