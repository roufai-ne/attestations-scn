import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { StatutDemande } from "@prisma/client"
import StatsCards from "@/components/agent/StatsCards"
import RecentDemandes from "@/components/agent/RecentDemandes"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function AgentDashboard() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    // Récupérer les statistiques
    const [
        demandesEnAttente,
        demandesEnCours,
        demandesValideesAujourdhui,
        demandesRejeteesAujourdhui,
        demandesRecentes,
    ] = await Promise.all([
        // Demandes en attente (ENREGISTREE)
        prisma.demande.count({
            where: { statut: StatutDemande.ENREGISTREE },
        }),
        // Demandes en cours de traitement par cet agent
        prisma.demande.count({
            where: {
                agentId: session.user.id,
                statut: {
                    in: [StatutDemande.EN_TRAITEMENT, StatutDemande.PIECES_NON_CONFORMES],
                },
            },
        }),
        // Demandes validées aujourd'hui
        prisma.demande.count({
            where: {
                statut: StatutDemande.VALIDEE,
                dateValidation: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
            },
        }),
        // Demandes rejetées aujourd'hui
        prisma.demande.count({
            where: {
                statut: StatutDemande.REJETEE,
                updatedAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
            },
        }),
        // 5 dernières demandes
        prisma.demande.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                appele: true,
                agent: {
                    select: {
                        nom: true,
                        prenom: true,
                    },
                },
            },
        }),
    ])

    const stats = {
        enAttente: demandesEnAttente,
        enCours: demandesEnCours,
        valideesAujourdhui: demandesValideesAujourdhui,
        rejeteesAujourdhui: demandesRejeteesAujourdhui,
    }

    return (
        <div className="space-y-8">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Tableau de bord Agent
                    </h1>
                    <p className="text-muted-foreground">
                        Bienvenue, {session.user.prenom} {session.user.nom}
                    </p>
                </div>
                <Link
                    href="/agent/demandes/nouvelle"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                >
                    <Plus className="h-4 w-4" />
                    Nouvelle demande
                </Link>
            </div>

            {/* Cartes de statistiques */}
            <StatsCards stats={stats} />

            {/* Demandes récentes */}
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Demandes récentes</h2>
                    <Link
                        href="/agent/demandes"
                        className="text-sm text-primary hover:underline"
                    >
                        Voir tout →
                    </Link>
                </div>
                <RecentDemandes demandes={demandesRecentes} />
            </div>
        </div>
    )
}
