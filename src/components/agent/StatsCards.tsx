"use client"

import { FileText, Clock, CheckCircle, XCircle } from "lucide-react"

interface StatsCardsProps {
    stats: {
        enAttente: number
        enCours: number
        valideesAujourdhui: number
        rejeteesAujourdhui: number
    }
}

export default function StatsCards({ stats }: StatsCardsProps) {
    const cards = [
        {
            title: "En attente",
            value: stats.enAttente,
            icon: FileText,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
            description: "Demandes à traiter",
        },
        {
            title: "En cours",
            value: stats.enCours,
            icon: Clock,
            color: "text-green-600",
            bgColor: "bg-blue-50",
            description: "Mes demandes en cours",
        },
        {
            title: "Validées aujourd'hui",
            value: stats.valideesAujourdhui,
            icon: CheckCircle,
            color: "text-green-600",
            bgColor: "bg-green-50",
            description: "Demandes validées",
        },
        {
            title: "Rejetées aujourd'hui",
            value: stats.rejeteesAujourdhui,
            icon: XCircle,
            color: "text-red-600",
            bgColor: "bg-red-50",
            description: "Demandes rejetées",
        },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => {
                const Icon = card.icon
                return (
                    <div
                        key={card.title}
                        className="rounded-lg border bg-card p-6 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    {card.title}
                                </p>
                                <p className="text-3xl font-bold">{card.value}</p>
                                <p className="text-xs text-muted-foreground">
                                    {card.description}
                                </p>
                            </div>
                            <div className={`rounded-full p-3 ${card.bgColor}`}>
                                <Icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

