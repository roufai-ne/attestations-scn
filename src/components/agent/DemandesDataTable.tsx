"use client"

import { useState, useEffect } from "react"
import { Demande, Appele, User } from "@prisma/client"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"
import { Eye, Search, Filter, Download, ChevronDown, ChevronUp, X, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"

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
    const [structureFilter, setStructureFilter] = useState("")
    const [diplomeFilter, setDiplomeFilter] = useState("")
    const [showFilters, setShowFilters] = useState(false)
    const [sortField, setSortField] = useState<string>("createdAt")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

    useEffect(() => {
        fetchDemandes()
    }, [search, statutFilter, promotionFilter, dateDebutFilter, dateFinFilter, structureFilter, diplomeFilter])

    const fetchDemandes = async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            if (search) params.append("search", search)
            if (statutFilter) params.append("statut", statutFilter)
            if (promotionFilter) params.append("promotion", promotionFilter)
            if (dateDebutFilter) params.append("dateDebut", dateDebutFilter)
            if (dateFinFilter) params.append("dateFin", dateFinFilter)
            if (structureFilter) params.append("structure", structureFilter)
            if (diplomeFilter) params.append("diplome", diplomeFilter)

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
        setStructureFilter("")
        setDiplomeFilter("")
    }

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortOrder("asc")
        }
    }

    const sortedDemandes = [...demandes].sort((a, b) => {
        let aVal: any, bVal: any
        switch (sortField) {
            case "numeroEnregistrement":
                aVal = a.numeroEnregistrement
                bVal = b.numeroEnregistrement
                break
            case "nom":
                aVal = a.appele?.nom || ""
                bVal = b.appele?.nom || ""
                break
            case "promotion":
                aVal = a.appele?.promotion || ""
                bVal = b.appele?.promotion || ""
                break
            case "statut":
                aVal = a.statut
                bVal = b.statut
                break
            case "createdAt":
            default:
                aVal = new Date(a.createdAt).getTime()
                bVal = new Date(b.createdAt).getTime()
                break
        }
        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1
        return 0
    })

    const activeFiltersCount = [search, statutFilter, promotionFilter, dateDebutFilter, dateFinFilter, structureFilter, diplomeFilter].filter(Boolean).length

    const handleExportCSV = () => {
        const headers = ["N° Enregistrement", "Nom", "Prénom", "Promotion", "Statut", "Date", "Structure", "Diplôme"]
        const rows = sortedDemandes.map(d => [
            d.numeroEnregistrement,
            d.appele?.nom || "",
            d.appele?.prenom || "",
            d.appele?.promotion || "",
            statutLabels[d.statut] || d.statut,
            format(new Date(d.createdAt), "dd/MM/yyyy"),
            d.appele?.structure || "",
            d.appele?.diplome || ""
        ])
        const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n")
        const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `demandes_${format(new Date(), "yyyy-MM-dd")}.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    const SortIcon = ({ field }: { field: string }) => {
        if (sortField !== field) return null
        return sortOrder === "asc" ? <ChevronUp className="h-4 w-4 inline ml-1" /> : <ChevronDown className="h-4 w-4 inline ml-1" />
    }

    return (
        <div className="space-y-4">
            {/* Filtres */}
            <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Filtres de recherche</h3>
                        {activeFiltersCount > 0 && (
                            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-xs">
                                {activeFiltersCount}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportCSV}
                            disabled={demandes.length === 0}
                        >
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Exporter CSV
                        </Button>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                            {showFilters ? (
                                <>
                                    <ChevronUp className="h-4 w-4" />
                                    Masquer filtres avancés
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="h-4 w-4" />
                                    Filtres avancés
                                </>
                            )}
                        </button>
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={resetFilters}
                                className="text-sm text-gray-600 hover:text-red-600 flex items-center gap-1"
                            >
                                <X className="h-4 w-4" />
                                Réinitialiser
                            </button>
                        )}
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
                    <div className="mt-4 pt-4 border-t space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
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
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium">Structure d'affectation</label>
                                <input
                                    type="text"
                                    value={structureFilter}
                                    onChange={(e) => setStructureFilter(e.target.value)}
                                    placeholder="Ex: Ministère de l'Éducation"
                                    className="w-full rounded-md border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Diplôme</label>
                                <select
                                    value={diplomeFilter}
                                    onChange={(e) => setDiplomeFilter(e.target.value)}
                                    className="w-full rounded-md border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Tous les diplômes</option>
                                    <option value="BAC">BAC</option>
                                    <option value="LICENCE">LICENCE</option>
                                    <option value="MASTER">MASTER</option>
                                    <option value="DOCTORAT">DOCTORAT</option>
                                    <option value="BTS">BTS</option>
                                    <option value="DUT">DUT</option>
                                    <option value="AUTRE">AUTRE</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Résumé des filtres actifs */}
                {activeFiltersCount > 0 && (
                    <div className="mt-4 pt-4 border-t flex flex-wrap gap-2 items-center">
                        <span className="text-sm text-muted-foreground">Filtres actifs:</span>
                        {search && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                                Recherche: {search}
                                <button onClick={() => setSearch("")} className="hover:text-blue-600">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {statutFilter && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                                Statut: {statutLabels[statutFilter]}
                                <button onClick={() => setStatutFilter("")} className="hover:text-blue-600">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {promotionFilter && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                                Promotion: {promotionFilter}
                                <button onClick={() => setPromotionFilter("")} className="hover:text-blue-600">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {structureFilter && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                                Structure: {structureFilter}
                                <button onClick={() => setStructureFilter("")} className="hover:text-blue-600">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {diplomeFilter && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                                Diplôme: {diplomeFilter}
                                <button onClick={() => setDiplomeFilter("")} className="hover:text-blue-600">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {(dateDebutFilter || dateFinFilter) && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                                Période: {dateDebutFilter || "..."} - {dateFinFilter || "..."}
                                <button onClick={() => { setDateDebutFilter(""); setDateFinFilter(""); }} className="hover:text-blue-600">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        <span className="ml-auto text-sm font-medium">
                            {demandes.length} résultat{demandes.length > 1 ? 's' : ''}
                        </span>
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
                                    <th
                                        className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/70"
                                        onClick={() => handleSort("numeroEnregistrement")}
                                    >
                                        N° Enregistrement
                                        <SortIcon field="numeroEnregistrement" />
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/70"
                                        onClick={() => handleSort("nom")}
                                    >
                                        Appelé
                                        <SortIcon field="nom" />
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/70"
                                        onClick={() => handleSort("promotion")}
                                    >
                                        Promotion
                                        <SortIcon field="promotion" />
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/70"
                                        onClick={() => handleSort("statut")}
                                    >
                                        Statut
                                        <SortIcon field="statut" />
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">
                                        Agent
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/70"
                                        onClick={() => handleSort("createdAt")}
                                    >
                                        Date
                                        <SortIcon field="createdAt" />
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedDemandes.map((demande) => (
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
