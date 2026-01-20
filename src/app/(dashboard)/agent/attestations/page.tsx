'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Eye,
    Printer,
    Search,
    Download,
    Filter,
    X,
    Loader2,
    FileText,
    Calendar,
    Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { useConfirm } from '@/components/shared/ConfirmProvider';

interface Attestation {
    id: string;
    numero: string;
    statut: string;
    dateGeneration: string;
    dateSignature?: string;
    fichierPath?: string;
    demande: {
        id: string;
        numeroEnregistrement: string;
        appele: {
            nom: string;
            prenom: string;
            promotion: string;
        };
    };
}

export default function AgentAttestationsPage() {
    const router = useRouter();
    const [attestations, setAttestations] = useState<Attestation[]>([]);
    const [filteredAttestations, setFilteredAttestations] = useState<Attestation[]>([]);
    const [loading, setLoading] = useState(true);

    // Filtres
    const [searchTerm, setSearchTerm] = useState('');
    const [statutFilter, setStatutFilter] = useState<string>('TOUS');
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Sélection
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Prévisualisation
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        loadAttestations();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [attestations, searchTerm, statutFilter, dateDebut, dateFin]);

    const loadAttestations = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/agent/attestations');
            if (response.ok) {
                const data = await response.json();
                setAttestations(data.attestations || []);
            }
        } catch (error) {
            console.error('Erreur chargement attestations:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...attestations];

        // Filtre par recherche (numéro, nom, prénom)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(a =>
                a.numero.toLowerCase().includes(term) ||
                a.demande?.appele?.nom?.toLowerCase().includes(term) ||
                a.demande?.appele?.prenom?.toLowerCase().includes(term) ||
                a.demande?.numeroEnregistrement?.toLowerCase().includes(term)
            );
        }

        // Filtre par statut
        if (statutFilter && statutFilter !== 'TOUS') {
            result = result.filter(a => a.statut === statutFilter);
        }

        // Filtre par date début
        if (dateDebut) {
            const debut = new Date(dateDebut);
            result = result.filter(a => new Date(a.dateGeneration) >= debut);
        }

        // Filtre par date fin
        if (dateFin) {
            const fin = new Date(dateFin);
            fin.setHours(23, 59, 59);
            result = result.filter(a => new Date(a.dateGeneration) <= fin);
        }

        setFilteredAttestations(result);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatutFilter('TOUS');
        setDateDebut('');
        setDateFin('');
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredAttestations.map(a => a.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        }
    };

    const confirm = useConfirm();

    const handlePreview = (attestation: Attestation) => {
        if (attestation.fichierPath) {
            window.open(attestation.fichierPath, '_blank');
        }
    };

    const handleDelete = async (attestation: Attestation) => {
        const confirmed = await confirm({
            title: 'Supprimer l\'attestation',
            description: `Êtes-vous sûr de vouloir supprimer l'attestation ${attestation.numero} ?\n\nCette action remettra la demande en statut "Validée" pour permettre une nouvelle génération.`,
            confirmText: 'Supprimer',
            cancelText: 'Annuler',
            variant: 'destructive',
        });

        if (!confirmed) return;

        try {
            const response = await fetch(`/api/attestations/${attestation.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                loadAttestations();
                toast.success('Attestation supprimée avec succès');
            } else {
                const data = await response.json();
                toast.error(data.error || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur suppression:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    const handlePrintSelected = () => {
        const selected = filteredAttestations.filter(a => selectedIds.includes(a.id));
        if (selected.length === 1 && selected[0].fichierPath) {
            const printWindow = window.open(selected[0].fichierPath, '_blank');
            printWindow?.print();
        } else if (selected.length > 1) {
            toast.info(`${selected.length} attestations sélectionnées. Veuillez les télécharger individuellement pour l'impression.`);
        }
    };

    const handleDownloadSelected = async () => {
        const selected = filteredAttestations.filter(a => selectedIds.includes(a.id));

        for (const attestation of selected) {
            if (attestation.fichierPath) {
                const link = document.createElement('a');
                link.href = attestation.fichierPath;
                link.download = `attestation-${attestation.numero}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    };

    const getStatutBadge = (statut: string) => {
        const variants: Record<string, { label: string; className: string }> = {
            GENEREE: { label: 'Générée', className: 'bg-blue-100 text-blue-800' },
            SIGNEE: { label: 'Signée', className: 'bg-green-100 text-green-800' },
            DELIVREE: { label: 'Délivrée', className: 'bg-gray-100 text-gray-800' },
        };
        const variant = variants[statut] || { label: statut, className: 'bg-gray-100' };
        return <Badge className={variant.className}>{variant.label}</Badge>;
    };

    const hasActiveFilters = searchTerm || statutFilter !== 'TOUS' || dateDebut || dateFin;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-8">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Attestations</h1>
                    <p className="text-gray-600">Consultation et impression des attestations générées</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className={hasActiveFilters ? 'border-blue-500 text-blue-600' : ''}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Filtres
                        {hasActiveFilters && <span className="ml-2 px-1.5 py-0.5 bg-blue-100 rounded-full text-xs">!</span>}
                    </Button>
                </div>
            </div>

            {/* Barre de recherche et filtres */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        {/* Recherche */}
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Rechercher par numéro, nom ou prénom..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={statutFilter} onValueChange={setStatutFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Statut" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TOUS">Tous les statuts</SelectItem>
                                    <SelectItem value="GENEREE">Générées</SelectItem>
                                    <SelectItem value="SIGNEE">Signées</SelectItem>
                                    <SelectItem value="DELIVREE">Délivrées</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Filtres avancés */}
                        {showFilters && (
                            <div className="flex items-end gap-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <Label className="text-xs">Date début</Label>
                                    <Input
                                        type="date"
                                        value={dateDebut}
                                        onChange={(e) => setDateDebut(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Date fin</Label>
                                    <Input
                                        type="date"
                                        value={dateFin}
                                        onChange={(e) => setDateFin(e.target.value)}
                                    />
                                </div>
                                {hasActiveFilters && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                                        <X className="h-4 w-4 mr-1" />
                                        Effacer
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Actions sélection */}
                        <div className="flex items-center justify-between border-t pt-4">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="select-all"
                                        checked={selectedIds.length === filteredAttestations.length && filteredAttestations.length > 0}
                                        onCheckedChange={handleSelectAll}
                                    />
                                    <label htmlFor="select-all" className="text-sm cursor-pointer">
                                        Tout sélectionner
                                    </label>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {selectedIds.length} / {filteredAttestations.length} sélectionnées
                                </span>
                            </div>

                            {selectedIds.length > 0 && (
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={handleDownloadSelected}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Télécharger ({selectedIds.length})
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handlePrintSelected}>
                                        <Printer className="h-4 w-4 mr-2" />
                                        Imprimer
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Liste des attestations */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {filteredAttestations.length} attestation(s)
                        {hasActiveFilters && (
                            <span className="text-sm font-normal text-gray-500">
                                (filtrées sur {attestations.length} total)
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredAttestations.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p>{hasActiveFilters ? 'Aucune attestation ne correspond aux filtres' : 'Aucune attestation trouvée'}</p>
                            {hasActiveFilters && (
                                <Button variant="link" onClick={clearFilters}>
                                    Effacer les filtres
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="w-10 px-4 py-3">
                                            <span className="sr-only">Sélection</span>
                                        </th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">N° Attestation</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Appelé</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Promotion</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Date génération</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Statut</th>
                                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredAttestations.map((attestation) => (
                                        <tr
                                            key={attestation.id}
                                            className={`hover:bg-gray-50 ${selectedIds.includes(attestation.id) ? 'bg-blue-50' : ''}`}
                                        >
                                            <td className="px-4 py-3">
                                                <Checkbox
                                                    checked={selectedIds.includes(attestation.id)}
                                                    onCheckedChange={(checked) =>
                                                        handleSelectOne(attestation.id, checked as boolean)
                                                    }
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-sm">{attestation.numero}</p>
                                                <p className="text-xs text-gray-500">
                                                    {attestation.demande?.numeroEnregistrement}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm">
                                                    {attestation.demande?.appele?.prenom} {attestation.demande?.appele?.nom}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm text-gray-600">
                                                    {attestation.demande?.appele?.promotion || '-'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(attestation.dateGeneration), 'dd/MM/yyyy', { locale: fr })}
                                                </div>
                                                {attestation.dateSignature && (
                                                    <p className="text-xs text-green-600">
                                                        Signée le {format(new Date(attestation.dateSignature), 'dd/MM/yyyy', { locale: fr })}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {getStatutBadge(attestation.statut)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handlePreview(attestation)}
                                                        disabled={!attestation.fichierPath}
                                                        title="Aperçu"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => router.push(`/agent/demandes/${attestation.demande.id}`)}
                                                        title="Voir la demande"
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(attestation)}
                                                        title="Supprimer l'attestation"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
