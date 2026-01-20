/**
 * API Route - Liste des attestations pour l'agent traitant
 * GET /api/agent/attestations
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'AGENT') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const statut = searchParams.get('statut');
        const search = searchParams.get('search');

        // Construire les conditions de filtrage
        const where: any = {};

        if (statut && statut !== 'TOUS') {
            where.statut = statut;
        }

        if (search) {
            where.OR = [
                { numero: { contains: search, mode: 'insensitive' } },
                { demande: { numeroEnregistrement: { contains: search, mode: 'insensitive' } } },
                { demande: { appele: { nom: { contains: search, mode: 'insensitive' } } } },
                { demande: { appele: { prenom: { contains: search, mode: 'insensitive' } } } },
            ];
        }

        const attestations = await prisma.attestation.findMany({
            where,
            include: {
                demande: {
                    select: {
                        id: true,
                        numeroEnregistrement: true,
                        appele: {
                            select: {
                                nom: true,
                                prenom: true,
                                promotion: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                dateGeneration: 'desc',
            },
        });

        return NextResponse.json({
            attestations,
            total: attestations.length,
        });
    } catch (error) {
        console.error('Erreur chargement attestations agent:', error);
        return NextResponse.json(
            { error: 'Erreur lors du chargement' },
            { status: 500 }
        );
    }
}
