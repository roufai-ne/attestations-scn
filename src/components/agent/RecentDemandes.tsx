"use client"

import { Demande, Appele, User } from "@prisma/client"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"
import { Eye } from "lucide-react"

type DemandeWithRelations = Demande & {
    appele: Appele | null
    agent: Pick<User, "nom" | "prenom"> | null
}

interface RecentDemandesProps {
    demandes: DemandeWithRelations[]
}

const statutColors: Record<string, string> = {
    ENREGISTREE: "bg-gray-100 text-gray-800",
    EN_TRAITEMENT: "bg-blue-100 text-blue-800",
    PIECES_NON_CONFORMES: "bg-yellow-100 text-yellow-800",
    VALIDEE: "bg-green-100 text-green-800",
    EN_ATTENTE_SIGNATURE: "bg-purple-100 text-purple-800",
    SIGNEE: "bg-indigo-100 text-indigo-800",
    REJETEE: "bg-red-100 text-red-800",
    DELIVREE: "bg-emerald-100 text-emerald-800",
}

const statutLabels: Record<string, string> = {
    ENREGISTREE: "Enregistrée",
    EN_TRAITEMENT: "En traitement",
    PIECES_NON_CONFORMES: "Pièces non conformes",
    VALIDEE: "Validée",
    EN_ATTENTE_SIGNATURE: "En attente signature",
    SIGNEE: "Signée",
    REJETEE: "Rejetée",
    DELIVREE: "Délivrée",
}

export default function RecentDemandes({ demandes }: RecentDemandesProps) {
    if (demandes.length === 0) {
        return (
            <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-muted-foreground">Aucune demande récente</p>
            </div>
        )
    }

    return (
        <div className="rounded-lg border bg-card">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="px-4 py-3 text-left text-sm font-medium">
                                N° Enregistrement
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium">
                                Appelé
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium">
                                Promotion
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium">
                                Statut
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {demandes.map((demande) => (
                            <tr key={demande.id} className="border-b last:border-0">
                                <td className="px-4 py-3 text-sm font-medium">
                                    {demande.numeroEnregistrement}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {demande.appele
                                        ? `${demande.appele.nom} ${demande.appele.prenom}`
                                        : "-"}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {demande.appele?.promotion || "-"}
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statutColors[demande.statut]
                                            }`}
                                    >
                                        {statutLabels[demande.statut]}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                    {format(new Date(demande.createdAt), "dd MMM yyyy", {
                                        locale: fr,
                                    })}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link
                                        href={`/agent/demandes/${demande.id}`}
                                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                    >
                                        <Eye className="h-4 w-4" />
                                        Voir
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
