'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SignatureDialog } from '@/components/directeur/SignatureDialog';
import { RetourAgentDialog } from '@/components/directeur/RetourAgentDialog';
import { FileSignature, ArrowLeft, Loader2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DirecteurAttestationsPage() {
    const router = useRouter();
    const [attestations, setAttestations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statutFilter, setStatutFilter] = useState<string>('GENEREE');
    const [selectedAttestations, setSelectedAttestations] = useState<string[]>([]);
    const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
    const [retourDialogOpen, setRetourDialogOpen] = useState(false);
    const [selectedForRetour, setSelectedForRetour] = useState<string | null>(null);

    useEffect(() => {
        loadAttestations();
    }, [statutFilter]);

    const loadAttestations = async () => {
        setLoading(true);
        try {
            const url = statutFilter && statutFilter !== 'TOUS'
                ? `/api/directeur/attestations?statut=${statutFilter}`
                : '/api/directeur/attestations';
            
            const response = await fetch(url);
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

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedAttestations(attestations.map(a => a.id));
        } else {
            setSelectedAttestations([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedAttestations([...selectedAttestations, id]);
        } else {
            setSelectedAttestations(selectedAttestations.filter(aid => aid !== id));
        }
    };

    const handleSignSelected = () => {
        if (selectedAttestations.length > 0) {
            setSignatureDialogOpen(true);
        }
    };

    const handleRetourAgent = (attestationId: string) => {
        setSelectedForRetour(attestationId);
        setRetourDialogOpen(true);
    };

    const getStatutBadge = (statut: string) => {
        const variants: Record<string, { label: string; className: string }> = {
            GENEREE: { label: 'À signer', className: 'bg-blue-100 text-blue-800' },
            SIGNEE: { label: 'Signée', className: 'bg-green-100 text-green-800' },
            DELIVREE: { label: 'Délivrée', className: 'bg-gray-100 text-gray-800' },
        };
        const variant = variants[statut] || { label: statut, className: 'bg-gray-100' };
        return <Badge className={variant.className}>{variant.label}</Badge>;
    };

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
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Attestations</h1>
                        <p className="text-gray-600">Gestion et signature des attestations</p>
                    </div>
                </div>
            </div>

            {/* Barre d'actions */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Select value={statutFilter} onValueChange={setStatutFilter}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Filtrer par statut" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GENEREE">À signer</SelectItem>
                                    <SelectItem value="SIGNEE">Signées</SelectItem>
                                    <SelectItem value="DELIVREE">Délivrées</SelectItem>
                                    <SelectItem value="TOUS">Tous les statuts</SelectItem>
                                </SelectContent>
                            </Select>
                            
                            {attestations.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="select-all"
                                        checked={selectedAttestations.length === attestations.length}
                                        onCheckedChange={handleSelectAll}
                                    />
                                    <label htmlFor="select-all" className="text-sm cursor-pointer">
                                        Tout sélectionner ({attestations.length})
                                    </label>
                                </div>
                            )}
                        </div>

                        {selectedAttestations.length > 0 && statutFilter === 'GENEREE' && (
                            <Button onClick={handleSignSelected}>
                                <FileSignature className="h-4 w-4 mr-2" />
                                Signer la sélection ({selectedAttestations.length})
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Liste des attestations */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        {attestations.length} attestation(s)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {attestations.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Aucune attestation trouvée
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {attestations.map((attestation) => (
                                <div
                                    key={attestation.id}
                                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
                                >
                                    {statutFilter === 'GENEREE' && (
                                        <Checkbox
                                            checked={selectedAttestations.includes(attestation.id)}
                                            onCheckedChange={(checked) => 
                                                handleSelectOne(attestation.id, checked as boolean)
                                            }
                                        />
                                    )}
                                    
                                    <div className="flex-1 grid grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-sm font-medium">N° {attestation.numero}</p>
                                            <p className="text-xs text-gray-500">
                                                {attestation.demande?.numeroEnregistrement}
                                            </p>
                                        </div>
                                        
                                        <div>
                                            <p className="text-sm font-medium">
                                                {attestation.demande?.appele?.nom} {attestation.demande?.appele?.prenom}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Promotion {attestation.demande?.appele?.promotion}
                                            </p>
                                        </div>
                                        
                                        <div>
                                            <p className="text-sm">
                                                Générée le {format(new Date(attestation.dateGeneration), 'dd/MM/yyyy', { locale: fr })}
                                            </p>
                                            {attestation.dateSignature && (
                                                <p className="text-xs text-gray-500">
                                                    Signée le {format(new Date(attestation.dateSignature), 'dd/MM/yyyy', { locale: fr })}
                                                </p>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {getStatutBadge(attestation.statut)}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(`/directeur/attestations/${attestation.id}`)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        
                                        {attestation.statut === 'GENEREE' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedAttestations([attestation.id]);
                                                        setSignatureDialogOpen(true);
                                                    }}
                                                >
                                                    <FileSignature className="h-4 w-4 mr-2" />
                                                    Signer
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleRetourAgent(attestation.demande.id)}
                                                >
                                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                                    Retourner
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <SignatureDialog
                open={signatureDialogOpen}
                onOpenChange={setSignatureDialogOpen}
                attestationIds={selectedAttestations}
                onSuccess={() => {
                    loadAttestations();
                    setSelectedAttestations([]);
                }}
            />

            {selectedForRetour && (
                <RetourAgentDialog
                    open={retourDialogOpen}
                    onOpenChange={setRetourDialogOpen}
                    demandeId={selectedForRetour}
                    onSuccess={() => {
                        loadAttestations();
                        setSelectedForRetour(null);
                    }}
                />
            )}
        </div>
    );
}
