import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * GET /api/export/demandes
 * Exporte les demandes en CSV
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || !['AGENT', 'ADMIN', 'DIRECTEUR'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const searchParams = request.nextUrl.searchParams;
        const statut = searchParams.get('statut');
        const dateDebut = searchParams.get('dateDebut');
        const dateFin = searchParams.get('dateFin');

        // Construire les filtres
        const where: any = {};

        if (statut && statut !== 'TOUS') {
            where.statut = statut;
        }

        if (dateDebut) {
            where.dateEnregistrement = {
                ...where.dateEnregistrement,
                gte: new Date(dateDebut),
            };
        }

        if (dateFin) {
            const fin = new Date(dateFin);
            fin.setHours(23, 59, 59);
            where.dateEnregistrement = {
                ...where.dateEnregistrement,
                lte: fin,
            };
        }

        // Récupérer les demandes avec relations
        const demandes = await prisma.demande.findMany({
            where,
            orderBy: { dateEnregistrement: 'desc' },
            include: {
                appele: true,
                agent: {
                    select: { nom: true, prenom: true },
                },
                attestation: {
                    select: { numero: true, statut: true },
                },
            },
        });

        // Générer le CSV
        const headers = [
            'N° Enregistrement',
            'Nom',
            'Prénom',
            'Date de naissance',
            'Lieu de naissance',
            'Promotion',
            'Diplôme',
            'Statut',
            'Date d\'enregistrement',
            'Agent traitant',
            'N° Attestation',
            'Statut Attestation',
        ];

        const rows = demandes.map((d) => [
            d.numeroEnregistrement,
            d.appele?.nom || '',
            d.appele?.prenom || '',
            d.appele?.dateNaissance ? format(d.appele.dateNaissance, 'dd/MM/yyyy') : '',
            d.appele?.lieuNaissance || '',
            d.appele?.promotion || '',
            d.appele?.diplome || '',
            d.statut,
            format(d.dateEnregistrement, 'dd/MM/yyyy HH:mm', { locale: fr }),
            d.agent ? `${d.agent.prenom} ${d.agent.nom}` : '',
            d.attestation?.numero || '',
            d.attestation?.statut || '',
        ]);

        // Escape CSV values
        const escapeCSV = (value: string) => {
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        };

        const csv = [
            headers.map(escapeCSV).join(','),
            ...rows.map((row) => row.map(escapeCSV).join(',')),
        ].join('\n');

        // Retourner le fichier CSV
        const filename = `demandes-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Erreur export CSV:', error);
        return NextResponse.json(
            { error: 'Erreur lors de l\'export' },
            { status: 500 }
        );
    }
}
