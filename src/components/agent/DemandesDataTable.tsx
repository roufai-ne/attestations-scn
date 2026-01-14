"use client"

import { useState, useEffect } from "react"
import { Demande, Appele, User } from "@prisma/client"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"
import { Eye, Search, Filter, Download } from "lucide-react"

type DemandeWithRelations = Demande & {
    appele: Appele | null
    agent: Pick<User, "nom" | "prenom"> | null
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

export default function DemandesDataTable() {
    const [demandes, setDemandes] = useState<DemandeWithRelations[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [statutFilter, setStatutFilter] = useState("")
    const [promotionFilter, setPromotionFilter] = useState("")
    const [dateDebutFilter, setDateDebutFilter] = useState("")
    const [dateFinFilter, setDateFinFilter] = useState("")
    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {
        fetchDemandes()
    }, [search, statutFilter, promotionFilter, dateDebutFilter, dateFinFilter])

    const fetchDemandes = async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            if (search) params.append("search", search)
            if (statutFilter) params.append("statut", statutFilter)
            if (promotionFilter) params.append("promotion", promotionFilter)
            if (dateDebutFilter) params.append("dateDebut", dateDebutFilter)
            if (dateFinFilter) params.append("dateFin", dateFinFilter)

            const response = await fetch(`/api/demandes?${params}`)
            if (response.ok) {
                const data = await response.json()
                setDemandes(data)
            }
        } catch (error) {
            console.error("Erreur chargement demandes:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const resetFilters = () => {
        setSearch("")
        setStatutFilter("")
        setPromotionFilter("")
        setDateDebutFilter("")
        setDateFinFilter("")
    }

    return (
        <div className="space-y-4">
            {/* Filtres */}
            <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Filtres de recherche</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            {showFilters ? "Masquer les filtres avancés" : "Afficher les filtres avancés"}
                        </button>
                        <button
                            onClick={resetFilters}
                            className="text-sm text-gray-600 hover:underline"
                        >
                            Réinitialiser
                        </button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            <Search className="mb-1 inline h-4 w-4" /> Rechercher
                        </label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Nom, prénom, numéro..."
                            className="w-full rounded-md border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            <Filter className="mb-1 inline h-4 w-4" /> Statut
                        </label>
                        <select
                            value={statutFilter}
                            onChange={(e) => setStatutFilter(e.target.value)}
                            className="w-full rounded-md border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Tous les statuts</option>
                            {Object.entries(statutLabels).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">Promotion</label>
                        <input
                            type="text"
                            value={promotionFilter}
                            onChange={(e) => setPromotionFilter(e.target.value)}
                            placeholder="Ex: 2023-2024"
                            className="w-full rounded-md border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Filtres avancés */}
                {showFilters && (
                    <div className="grid gap-4 md:grid-cols-2 mt-4 pt-4 border-t">
                        <div>
                            <label className="mb-2 block text-sm font-medium">Date début</label>
                            <input
                                type="date"
                                value={dateDebutFilter}
                                onChange={(e) => setDateDebutFilter(e.target.value)}
                                className="w-full rounded-md border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium">Date fin</label>
                            <input
                                type="date"
                                value={dateFinFilter}
                                onChange={(e) => setDateFinFilter(e.target.value)}
                                className="w-full rounded-md border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                )}

                {/* Résumé des filtres actifs */}
                {(search || statutFilter || promotionFilter || dateDebutFilter || dateFinFilter) && (
                    <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                            {demandes.length} résultat{demandes.length > 1 ? 's' : ''} trouvé{demandes.length > 1 ? 's' : ''}
                        </p>
                    </div>
                )}
            </div>

            {/* Tableau */}
            <div className="rounded-lg border bg-card">
                {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">
                        Chargement...
                    </div>
                ) : demandes.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        Aucune demande trouvée
                    </div>
                ) : (
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
                                    <th className="px-4 py-3 text-left text-sm font-medium">
                                        Agent
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">
                                        Date
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {demandes.map((demande) => (
                                    <tr key={demande.id} className="border-b last:border-0 hover:bg-muted/50">
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
                                        <td className="px-4 py-3 text-sm">
                                            {demande.agent
                                                ? `${demande.agent.prenom} ${demande.agent.nom}`
                                                : "-"}
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
                )}

                {/* Footer avec pagination */}
                <div className="border-t px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                        {demandes.length} demande{demandes.length > 1 ? "s" : ""} trouvée
                        {demandes.length > 1 ? "s" : ""}
                    </p>
                </div>
            </div>
        </div>
    )
}
