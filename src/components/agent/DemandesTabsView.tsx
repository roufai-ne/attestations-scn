'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Eye,
    Search,
    FileText,
    Clock,
    CheckCircle,
    AlertTriangle,
    XCircle,
    FileSignature,
    Award,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Demande {
    id: string;
    numeroEnregistrement: string;
    dateEnregistrement: string;
    statut: string;
    appele: {
        nom: string;
        prenom: string;
        promotion: string;
        structure?: string;
    } | null;
    agent?: {
        nom: string;
        prenom: string;
    } | null;
    createdAt: string;
}

interface StatusCount {
    statut: string;
    count: number;
}

const tabConfig = [
    {
        id: 'ENREGISTREE',
        label: 'Nouvelles',
        icon: FileText,
        color: 'text-gray-600',
        activeColor: 'text-[var(--accent-orange)]',
        bgColor: 'bg-gray-50',
    },
    {
        id: 'EN_TRAITEMENT',
        label: 'En cours',
        icon: Clock,
        color: 'text-blue-600',
        activeColor: 'text-blue-600',
        bgColor: 'bg-blue-50',
    },
    {
        id: 'PIECES_NON_CONFORMES',
        label: 'Non conformes',
        icon: AlertTriangle,
        color: 'text-orange-600',
        activeColor: 'text-orange-600',
        bgColor: 'bg-orange-50',
    },
    {
        id: 'VALIDEE',
        label: 'Validées',
        icon: CheckCircle,
        color: 'text-green-600',
        activeColor: 'text-green-600',
        bgColor: 'bg-green-50',
    },
    {
        id: 'EN_ATTENTE_SIGNATURE',
        label: 'À signer',
        icon: FileSignature,
        color: 'text-purple-600',
        activeColor: 'text-purple-600',
        bgColor: 'bg-purple-50',
    },
    {
        id: 'REJETEE',
        label: 'Rejetées',
        icon: XCircle,
        color: 'text-red-600',
        activeColor: 'text-red-600',
        bgColor: 'bg-red-50',
    },
    {
        id: 'ALL',
        label: 'Toutes',
        icon: Award,
        color: 'text-gray-600',
        activeColor: 'text-[var(--navy)]',
        bgColor: 'bg-gray-50',
    },
];

const statutLabels: Record<string, string> = {
    ENREGISTREE: 'Enregistrée',
    EN_TRAITEMENT: 'En traitement',
    PIECES_NON_CONFORMES: 'Pièces non conformes',
    VALIDEE: 'Validée',
    EN_ATTENTE_SIGNATURE: 'En attente signature',
    SIGNEE: 'Signée',
    REJETEE: 'Rejetée',
    DELIVREE: 'Délivrée',
};

const statutColors: Record<string, string> = {
    ENREGISTREE: 'bg-gray-100 text-gray-800',
    EN_TRAITEMENT: 'bg-blue-100 text-blue-800',
    PIECES_NON_CONFORMES: 'bg-orange-100 text-orange-800',
    VALIDEE: 'bg-green-100 text-green-800',
    EN_ATTENTE_SIGNATURE: 'bg-purple-100 text-purple-800',
    SIGNEE: 'bg-emerald-100 text-emerald-800',
    REJETEE: 'bg-red-100 text-red-800',
    DELIVREE: 'bg-teal-100 text-teal-800',
};

export default function DemandesTabsView() {
    const [demandes, setDemandes] = useState<Demande[]>([]);
    const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ENREGISTREE');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchDemandes();
        fetchStatusCounts();
    }, []);

    const fetchDemandes = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/demandes');
            if (response.ok) {
                const data = await response.json();
                setDemandes(data);
            }
        } catch (error) {
            console.error('Erreur chargement demandes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStatusCounts = async () => {
        try {
            const response = await fetch('/api/demandes/counts');
            if (response.ok) {
                const data = await response.json();
                setStatusCounts(data);
            }
        } catch (error) {
            console.error('Erreur chargement compteurs:', error);
        }
    };

    const getCountForStatus = (status: string): number => {
        if (status === 'ALL') {
            return demandes.length;
        }
        return statusCounts.find((s) => s.statut === status)?.count || 0;
    };

    const filteredDemandes = useMemo(() => {
        let result = demandes;

        // Filtrer par statut actif
        if (activeTab !== 'ALL') {
            result = result.filter((d) => d.statut === activeTab);
        }

        // Filtrer par recherche
        if (search) {
            const searchLower = search.toLowerCase();
            result = result.filter(
                (d) =>
                    d.numeroEnregistrement.toLowerCase().includes(searchLower) ||
                    d.appele?.nom.toLowerCase().includes(searchLower) ||
                    d.appele?.prenom.toLowerCase().includes(searchLower) ||
                    d.appele?.promotion.toLowerCase().includes(searchLower)
            );
        }

        return result;
    }, [demandes, activeTab, search]);

    const activeTabConfig = tabConfig.find(t => t.id === activeTab) || tabConfig[0];

    return (
        <div className="space-y-0">
            {/* Header avec titre et recherche */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Demandes d'attestation</h1>
                    <p className="text-muted-foreground">
                        Gérer et suivre toutes les demandes
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 w-64"
                        />
                        {search && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                                onClick={() => setSearch('')}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Onglets style traditionnel */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-1 overflow-x-auto" aria-label="Tabs">
                    {tabConfig.map((tab) => {
                        const Icon = tab.icon;
                        const count = getCountForStatus(tab.id);
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    group inline-flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-all
                                    ${isActive
                                        ? `border-[var(--accent-orange)] ${tab.activeColor}`
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                                `}
                            >
                                <Icon className={`h-4 w-4 ${isActive ? tab.activeColor : 'text-gray-400 group-hover:text-gray-500'}`} />
                                <span>{tab.label}</span>
                                <Badge
                                    variant="secondary"
                                    className={`
                                        ml-1 min-w-[22px] h-5 text-xs justify-center
                                        ${isActive
                                            ? 'bg-[var(--accent-orange)]/10 text-[var(--accent-orange)]'
                                            : 'bg-gray-100 text-gray-600'}
                                    `}
                                >
                                    {count}
                                </Badge>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Contenu du panneau actif */}
            <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 shadow-sm">
                {/* Header du panneau */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <activeTabConfig.icon className={`h-5 w-5 ${activeTabConfig.activeColor}`} />
                        <span className="font-semibold text-[var(--navy)]">{activeTabConfig.label}</span>
                    </div>
                    <Badge variant="outline">
                        {filteredDemandes.length} demande(s)
                    </Badge>
                </div>

                {/* Liste des demandes */}
                <div className="p-4">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-orange)]" />
                        </div>
                    ) : filteredDemandes.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <activeTabConfig.icon className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p>Aucune demande dans cette catégorie</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredDemandes.map((demande) => (
                                <Link
                                    key={demande.id}
                                    href={`/agent/demandes/${demande.id}`}
                                    className="block"
                                >
                                    <div className="flex items-center justify-between p-4 rounded-lg border bg-white hover:bg-gray-50 hover:border-[var(--accent-orange)]/30 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${activeTabConfig.bgColor}`}>
                                                <FileText className={`h-4 w-4 ${activeTabConfig.color}`} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-[var(--navy)]">
                                                        {demande.numeroEnregistrement}
                                                    </span>
                                                    {activeTab === 'ALL' && (
                                                        <Badge className={`${statutColors[demande.statut]} text-xs`}>
                                                            {statutLabels[demande.statut]}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {demande.appele
                                                        ? `${demande.appele.prenom} ${demande.appele.nom} - ${demande.appele.promotion}`
                                                        : 'Appelé non renseigné'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right text-sm">
                                                <p className="text-muted-foreground">
                                                    {format(new Date(demande.dateEnregistrement), 'dd MMM yyyy', { locale: fr })}
                                                </p>
                                                {demande.agent && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {demande.agent.prenom} {demande.agent.nom}
                                                    </p>
                                                )}
                                            </div>
                                            <Eye className="h-5 w-5 text-gray-400 group-hover:text-[var(--accent-orange)] transition-colors" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
