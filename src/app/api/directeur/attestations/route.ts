/**
 * API Route - Liste des attestations pour le directeur
 * Récupération des attestations à signer
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || (session.user.role !== 'DIRECTEUR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Récupérer les paramètres de filtrage
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    // Construire les filtres
    const where: any = {};

    if (statut && statut !== 'TOUS') {
      where.statut = statut;
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Récupérer les attestations
    const [attestations, total] = await Promise.all([
      prisma.attestation.findMany({
        where,
        include: {
          demande: {
            include: {
              appele: true,
              agent: {
                select: {
                  nom: true,
                  prenom: true,
                  email: true,
                },
              },
            },
          },
          signataire: {
            select: {
              nom: true,
              prenom: true,
              email: true,
            },
          },
        },
        orderBy: {
          dateGeneration: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.attestation.count({ where }),
    ]);

    return NextResponse.json({
      attestations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erreur récupération attestations:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des attestations' },
      { status: 500 }
    );
  }
}
