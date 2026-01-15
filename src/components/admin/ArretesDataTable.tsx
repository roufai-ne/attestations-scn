'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
    MoreVertical,
    Download,
    RefreshCw,
    Trash2,
    Eye,
    Loader2,
    Search,
    Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArreteViewDialog } from './ArreteViewDialog';
import { ArreteEditDialog } from './ArreteEditDialog';
import { ArreteDeleteDialog } from './ArreteDeleteDialog';

interface Arrete {
    id: string;
    numero: string;
    dateArrete: string;
    promotion: string;
    annee: string;
    fichierPath: string;
    statutIndexation: 'EN_ATTENTE' | 'EN_COURS' | 'INDEXE' | 'ERREUR';
    messageErreur?: string;
    createdAt: string;
    dateIndexation?: string;
}

interface ArretesDataTableProps {
    initialData?: Arrete[];
}

const statutColors = {
    EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
    EN_COURS: 'bg-blue-100 text-blue-800',
    INDEXE: 'bg-green-100 text-green-800',
    ERREUR: 'bg-red-100 text-red-800',
};

const statutLabels = {
    EN_ATTENTE: 'En attente',
    EN_COURS: 'En cours',
    INDEXE: 'Indexé',
    ERREUR: 'Erreur',
};

export function ArretesDataTable({ initialData = [] }: ArretesDataTableProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [arretes, setArretes] = useState<Arrete[]>(initialData);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        statut: '',
        promotion: '',
        annee: '',
        search: '',
    });

    // Dialogs state
    const [viewDialog, setViewDialog] = useState<{ open: boolean; arreteId: string | null }>({
        open: false,
        arreteId: null,
    });
    const [editDialog, setEditDialog] = useState<{ open: boolean; arrete: any | null }>({
        open: false,
        arrete: null,
    });
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; arrete: any | null }>({
        open: false,
        arrete: null,
    });

    useEffect(() => {
        loadArretes();
    }, [filters]);

    const loadArretes = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.statut) params.append('statut', filters.statut);
            if (filters.promotion) params.append('promotion', filters.promotion);
            if (filters.annee) params.append('annee', filters.annee);
            if (filters.search) params.append('search', filters.search);

            const response = await fetch(`/api/admin/arretes?${params}`);
            const result = await response.json();

            if (response.ok) {
                setArretes(result.data || []);
            }
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReindex = async (id: string, numero: string) => {
        try {
            const response = await fetch(`/api/admin/arretes/${id}/reindex`, {
                method: 'POST',
            });

            const result = await response.json();

            if (response.ok) {
                toast({
                    title: 'Réindexation lancée',
                    description: `L'arrêté ${numero} est en cours de réindexation`,
                });
                loadArretes();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                title: 'Erreur',
                description: error instanceof Error ? error.message : 'Erreur lors de la réindexation',
                variant: 'destructive',
            });
        }
    };

    const openViewDialog = (arreteId: string) => {
        setViewDialog({ open: true, arreteId });
    };

    const openEditDialog = (arrete: Arrete) => {
        setEditDialog({ open: true, arrete });
    };

    const openDeleteDialog = (arrete: Arrete) => {
        setDeleteDialog({ open: true, arrete: { id: arrete.id, numero: arrete.numero } });
    };

    const handleDownload = (fichierPath: string, numero: string) => {
        // Extraire le nom du fichier du chemin
        const filename = fichierPath.split(/[/\\]/).pop() || 'arrete.pdf';
        const publicPath = `/uploads/arretes/${filename}`;

        const link = document.createElement('a');
        link.href = publicPath;
        link.download = `arrete_${numero}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            {/* Filtres */}
            <div className="flex gap-4 items-center">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Rechercher par numéro, promotion ou contenu OCR..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="pl-10"
                        />
                    </div>
                </div>

                <Select
                    value={filters.statut || "all"}
                    onValueChange={(value) => setFilters({ ...filters, statut: value === "all" ? "" : value })}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                        <SelectItem value="EN_COURS">En cours</SelectItem>
                        <SelectItem value="INDEXE">Indexé</SelectItem>
                        <SelectItem value="ERREUR">Erreur</SelectItem>
                    </SelectContent>
                </Select>

                <Button variant="outline" onClick={loadArretes} disabled={loading}>
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Tableau */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Numéro</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Promotion</TableHead>
                            <TableHead>Année</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Indexé le</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {arretes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                                    Aucun arrêté trouvé
                                </TableCell>
                            </TableRow>
                        ) : (
                            arretes.map((arrete) => (
                                <TableRow key={arrete.id}>
                                    <TableCell className="font-medium">{arrete.numero}</TableCell>
                                    <TableCell>
                                        {format(new Date(arrete.dateArrete), 'dd MMM yyyy', { locale: fr })}
                                    </TableCell>
                                    <TableCell>{arrete.promotion}</TableCell>
                                    <TableCell>{arrete.annee}</TableCell>
                                    <TableCell>
                                        <Badge className={statutColors[arrete.statutIndexation]} variant="secondary">
                                            {statutLabels[arrete.statutIndexation]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {arrete.dateIndexation
                                            ? format(new Date(arrete.dateIndexation), 'dd MMM yyyy HH:mm', {
                                                locale: fr,
                                            })
                                            : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openViewDialog(arrete.id)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Voir détails
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openEditDialog(arrete)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Modifier
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDownload(arrete.fichierPath, arrete.numero)}
                                                >
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Télécharger
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleReindex(arrete.id, arrete.numero)}>
                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                    Réindexer
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => openDeleteDialog(arrete)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Supprimer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Dialogs */}
            <ArreteViewDialog
                open={viewDialog.open}
                onOpenChange={(open) => setViewDialog({ open, arreteId: null })}
                arreteId={viewDialog.arreteId}
            />

            <ArreteEditDialog
                open={editDialog.open}
                onOpenChange={(open) => setEditDialog({ open, arrete: null })}
                arrete={editDialog.arrete}
                onSuccess={loadArretes}
            />

            <ArreteDeleteDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, arrete: null })}
                arrete={deleteDialog.arrete}
                onSuccess={loadArretes}
            />
        </div>
    );
}
