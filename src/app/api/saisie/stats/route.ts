import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/saisie/stats
 * Récupère les statistiques pour l'agent de saisie
 */
export async function GET() {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'SAISIE') {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        const userId = session.user.id;

        // Dates pour les filtres
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        // Statistiques
        const [
            totalDemandes,
            demandesEnAttente,
            demandesValidees,
            demandesRejetees,
            demandesAujourdHui,
            demandeCetteSemaine,
        ] = await Promise.all([
            // Total des demandes créées par cet agent
            prisma.demande.count({
                where: { agentId: userId },
            }),
            // Demandes en attente (non validées, non rejetées)
            prisma.demande.count({
                where: {
                    agentId: userId,
                    statut: {
                        in: ['ENREGISTREE', 'EN_TRAITEMENT', 'PIECES_NON_CONFORMES'],
                    },
                },
            }),
            // Demandes validées
            prisma.demande.count({
                where: {
                    agentId: userId,
                    statut: {
                        in: ['VALIDEE', 'EN_ATTENTE_SIGNATURE', 'SIGNEE', 'DELIVREE'],
                    },
                },
            }),
            // Demandes rejetées
            prisma.demande.count({
                where: {
                    agentId: userId,
                    statut: 'REJETEE',
                },
            }),
            // Demandes créées aujourd'hui
            prisma.demande.count({
                where: {
                    agentId: userId,
                    createdAt: { gte: today },
                },
            }),
            // Demandes créées cette semaine
            prisma.demande.count({
                where: {
                    agentId: userId,
                    createdAt: { gte: startOfWeek },
                },
            }),
        ]);

        return NextResponse.json({
            totalDemandes,
            demandesEnAttente,
            demandesValidees,
            demandesRejetees,
            demandesAujourdHui,
            demandeCetteSemaine,
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des stats:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
