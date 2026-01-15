'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Plus,
    Search,
    Eye,
    Edit,
    Loader2,
    FileText,
    RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Demande {
    id: string;
    numeroEnregistrement: string;
    dateEnregistrement: string;
    statut: string;
    appele: {
        nom: string;
        prenom: string;
        promotion: string;
    } | null;
    createdAt: string;
}

const statutColors: Record<string, string> = {
    ENREGISTREE: 'bg-gray-100 text-gray-800',
    EN_TRAITEMENT: 'bg-blue-100 text-blue-800',
    PIECES_NON_CONFORMES: 'bg-orange-100 text-orange-800',
    VALIDEE: 'bg-green-100 text-green-800',
    EN_ATTENTE_SIGNATURE: 'bg-purple-100 text-purple-800',
    SIGNEE: 'bg-indigo-100 text-indigo-800',
    REJETEE: 'bg-red-100 text-red-800',
    DELIVREE: 'bg-teal-100 text-teal-800',
};

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

export default function SaisieDemandesPage() {
    const { data: session } = useSession();
    const [demandes, setDemandes] = useState<Demande[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        statut: '',
        mesDemandes: true,
    });

    useEffect(() => {
        loadDemandes();
    }, [filters]);

    const loadDemandes = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.statut && filters.statut !== 'all') params.append('statut', filters.statut);
            if (filters.mesDemandes) params.append('mesDemandes', 'true');

            const response = await fetch(`/api/saisie/demandes?${params}`);
            if (response.ok) {
                const data = await response.json();
                setDemandes(data.demandes || []);
            }
        } catch (error) {
            console.error('Erreur chargement demandes:', error);
        } finally {
            setLoading(false);
        }
    };

    const canEdit = (statut: string) => {
        // L'agent de saisie peut modifier uniquement les demandes ENREGISTREE ou PIECES_NON_CONFORMES
        return ['ENREGISTREE', 'PIECES_NON_CONFORMES'].includes(statut);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mes demandes</h1>
                    <p className="text-gray-600 mt-1">
                        Gérez les demandes d'attestation que vous avez créées
                    </p>
                </div>
                <Link href="/saisie/demandes/nouvelle">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle demande
                    </Button>
                </Link>
            </div>

            {/* Filtres */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex-1 min-w-[250px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Rechercher par numéro, nom, prénom..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <Select
                            value={filters.statut || 'all'}
                            onValueChange={(value) => setFilters({ ...filters, statut: value === 'all' ? '' : value })}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Tous les statuts" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les statuts</SelectItem>
                                <SelectItem value="ENREGISTREE">Enregistrée</SelectItem>
                                <SelectItem value="EN_TRAITEMENT">En traitement</SelectItem>
                                <SelectItem value="PIECES_NON_CONFORMES">Pièces non conformes</SelectItem>
                                <SelectItem value="VALIDEE">Validée</SelectItem>
                                <SelectItem value="REJETEE">Rejetée</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant={filters.mesDemandes ? 'default' : 'outline'}
                            onClick={() => setFilters({ ...filters, mesDemandes: !filters.mesDemandes })}
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            {filters.mesDemandes ? 'Mes demandes' : 'Toutes'}
                        </Button>

                        <Button variant="outline" onClick={loadDemandes} disabled={loading}>
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Tableau */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>N° Enregistrement</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Appelé</TableHead>
                                <TableHead>Promotion</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                                    </TableCell>
                                </TableRow>
                            ) : demandes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        Aucune demande trouvée
                                    </TableCell>
                                </TableRow>
                            ) : (
                                demandes.map((demande) => (
                                    <TableRow key={demande.id}>
                                        <TableCell className="font-medium">
                                            {demande.numeroEnregistrement}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(demande.dateEnregistrement), 'dd MMM yyyy', { locale: fr })}
                                        </TableCell>
                                        <TableCell>
                                            {demande.appele ? (
                                                `${demande.appele.nom} ${demande.appele.prenom}`
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {demande.appele?.promotion || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statutColors[demande.statut]} variant="secondary">
                                                {statutLabels[demande.statut] || demande.statut}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/saisie/demandes/${demande.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                {canEdit(demande.statut) && (
                                                    <Link href={`/saisie/demandes/${demande.id}/modifier`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
