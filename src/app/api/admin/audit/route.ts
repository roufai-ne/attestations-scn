/**
 * API Route - Journal d'audit
 * Récupération et export des logs d'audit
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Récupérer les paramètres de filtrage et pagination
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const demandeId = searchParams.get('demandeId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const export_csv = searchParams.get('export') === 'csv';

    // Construire les filtres Prisma
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (dateDebut) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(dateDebut),
      };
    }

    if (dateFin) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(dateFin),
      };
    }

    if (demandeId) {
      where.demandeId = demandeId;
    }

    // Export CSV
    if (export_csv) {
      const logs = await prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              nom: true,
              prenom: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Générer le CSV
      const csvRows = [
        ['Date', 'Utilisateur', 'Email', 'Action', 'Demande ID', 'Détails', 'Adresse IP'].join(','),
      ];

      logs.forEach((log) => {
        const row = [
          new Date(log.createdAt).toLocaleString('fr-FR'),
          `${log.user.prenom} ${log.user.nom}`,
          log.user.email,
          log.action,
          log.demandeId || '',
          log.details ? JSON.stringify(log.details).replace(/,/g, ';') : '',
          log.ipAddress || '',
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const fileName = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    // Pagination normale
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              nom: true,
              prenom: true,
              email: true,
              role: true,
            },
          },
          demande: {
            select: {
              numeroEnregistrement: true,
              appele: {
                select: {
                  nom: true,
                  prenom: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erreur récupération logs audit:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des logs' },
      { status: 500 }
    );
  }
}
