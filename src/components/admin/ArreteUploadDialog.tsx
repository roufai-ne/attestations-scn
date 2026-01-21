'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ArreteUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ArreteUploadDialog({ open, onOpenChange }: ArreteUploadDialogProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        numero: '',
        dateArrete: '',
        promotion: '',
        annee: new Date().getFullYear().toString(),
        lieuService: '',
    });
    const [result, setResult] = useState<{
        success: boolean;
        message?: string;
        appeles?: number;
        warnings?: string[];
        errors?: string[];
    } | null>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (isValidFileType(droppedFile)) {
                setFile(droppedFile);
                setResult(null);
            } else {
                toast({
                    title: 'Erreur',
                    description: 'Seuls les fichiers Excel (.xlsx, .xls) et CSV sont acceptés',
                    variant: 'destructive',
                });
            }
        }
    };

    const isValidFileType = (file: File): boolean => {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv', // .csv
        ];
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        
        return validTypes.includes(file.type) || 
               validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (isValidFileType(selectedFile)) {
                setFile(selectedFile);
                setResult(null);
            } else {
                toast({
                    title: 'Erreur',
                    description: 'Seuls les fichiers Excel (.xlsx, .xls) et CSV sont acceptés',
                    variant: 'destructive',
                });
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            toast({
                title: 'Erreur',
                description: 'Veuillez sélectionner un fichier Excel ou CSV',
                variant: 'destructive',
            });
            return;
        }

        // Validation des champs requis
        if (!formData.numero || !formData.dateArrete || !formData.promotion || !formData.annee) {
            toast({
                title: 'Erreur',
                description: 'Veuillez remplir tous les champs obligatoires',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            // Étape 1: Créer l'arrêté
            const arreteData = new FormData();
            arreteData.append('numero', formData.numero);
            arreteData.append('dateArrete', formData.dateArrete);
            arreteData.append('promotion', formData.promotion);
            arreteData.append('annee', formData.annee);
            if (formData.lieuService) {
                arreteData.append('lieuService', formData.lieuService);
            }

            const arreteResponse = await fetch('/api/admin/arretes', {
                method: 'POST',
                body: arreteData,
            });

            if (!arreteResponse.ok) {
                const error = await arreteResponse.json();
                throw new Error(error.error || 'Erreur lors de la création de l\'arrêté');
            }

            const arreteResult = await arreteResponse.json();
            const arreteId = arreteResult.arrete.id;

            // Étape 2: Upload du fichier Excel avec les appelés
            const uploadData = new FormData();
            uploadData.append('file', file);

            const uploadResponse = await fetch(`/api/admin/arretes/${arreteId}/upload-appeles`, {
                method: 'POST',
                body: uploadData,
            });

            const uploadResult = await uploadResponse.json();

            if (!uploadResponse.ok) {
                setResult({
                    success: false,
                    errors: uploadResult.errors || [uploadResult.error || 'Erreur lors de l\'import'],
                    warnings: uploadResult.warnings || [],
                });
                toast({
                    title: 'Erreur',
                    description: 'Erreur lors de l\'import des appelés',
                    variant: 'destructive',
                });
                return;
            }

            setResult({
                success: true,
                message: uploadResult.message,
                appeles: uploadResult.appeles,
                warnings: uploadResult.warnings || [],
            });

            toast({
                title: 'Succès !',
                description: `Arrêté créé avec ${uploadResult.appeles} appelés importés`,
            });

            // Attendre 2 secondes puis fermer et rafraîchir
            setTimeout(() => {
                handleReset();
                router.refresh();
            }, 2000);

        } catch (error) {
            console.error('Erreur:', error);
            setResult({
                success: false,
                errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
            });
            toast({
                title: 'Erreur',
                description: error instanceof Error ? error.message : 'Erreur lors de l\'upload',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
        setLoading(false);
        setFormData({
            numero: '',
            dateArrete: '',
            promotion: '',
            annee: new Date().getFullYear().toString(),
            lieuService: '',
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={result?.success ? undefined : onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {result ? 'Résultat de l\'import' : 'Nouvel Arrêté'}
                    </DialogTitle>
                    <DialogDescription>
                        {result
                            ? 'Voici le résultat de l\'importation'
                            : 'Créez un arrêté et importez la liste des appelés depuis un fichier Excel ou CSV'}
                    </DialogDescription>
                </DialogHeader>

                {!result ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Informations de l'arrêté */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm">Informations de l&apos;arrêté</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="numero">
                                        Numéro de l&apos;arrêté <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="numero"
                                        placeholder="Ex: 324"
                                        value={formData.numero}
                                        onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dateArrete">
                                        Date de l&apos;arrêté <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="dateArrete"
                                        type="date"
                                        value={formData.dateArrete}
                                        onChange={(e) => setFormData({ ...formData, dateArrete: e.target.value })}
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="promotion">
                                        Promotion <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="promotion"
                                        placeholder="Ex: 2024"
                                        value={formData.promotion}
                                        onChange={(e) => setFormData({ ...formData, promotion: e.target.value })}
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="annee">
                                        Année <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="annee"
                                        placeholder="Ex: 2024"
                                        value={formData.annee}
                                        onChange={(e) => setFormData({ ...formData, annee: e.target.value })}
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lieuService">Lieu de service (optionnel)</Label>
                                <Input
                                    id="lieuService"
                                    placeholder="Ex: Ministère de l'Éducation Nationale"
                                    value={formData.lieuService}
                                    onChange={(e) => setFormData({ ...formData, lieuService: e.target.value })}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Upload du fichier Excel/CSV */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm">Fichier des appelés</h3>
                            
                            <Alert>
                                <FileSpreadsheet className="h-4 w-4" />
                                <AlertDescription>
                                    <div className="space-y-2 text-sm">
                                        <p className="font-medium">Format attendu :</p>
                                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                            <li>Ligne 1 : En-têtes (N°, Nom, Prénom(s), Date Naissance, Lieu Naissance, Diplôme)</li>
                                            <li>Colonnes obligatoires : N° et Nom</li>
                                            <li>Format date : JJ/MM/AAAA ou AAAA-MM-JJ</li>
                                        </ul>
                                    </div>
                                </AlertDescription>
                            </Alert>

                            {!file ? (
                                <div
                                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                        dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        id="file-upload"
                                        className="hidden"
                                        accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                                        onChange={handleFileChange}
                                        disabled={loading}
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                        <p className="text-sm font-medium text-gray-700 mb-1">
                                            Cliquez pour sélectionner un fichier Excel ou CSV
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            ou glissez-déposez votre fichier
                                        </p>
                                    </label>
                                </div>
                            ) : (
                                <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <FileSpreadsheet className="h-8 w-8 text-green-600" />
                                        <div>
                                            <p className="text-sm font-medium">{file.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {(file.size / 1024).toFixed(2)} KB
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setFile(null)}
                                        disabled={loading}
                                    >
                                        Supprimer
                                    </Button>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleReset}
                                disabled={loading}
                            >
                                Annuler
                            </Button>
                            <Button type="submit" disabled={!file || loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Import en cours...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Créer et importer
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="space-y-4">
                        {result.success ? (
                            <Alert className="border-green-200 bg-green-50">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                    <p className="font-medium">{result.message}</p>
                                    {result.appeles && (
                                        <p className="text-sm mt-1">
                                            {result.appeles} appelé(s) importé(s) avec succès
                                        </p>
                                    )}
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <p className="font-medium mb-2">Erreurs détectées :</p>
                                    <ul className="text-sm space-y-1 list-disc list-inside">
                                        {result.errors?.map((error, i) => (
                                            <li key={i}>{error}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}

                        {result.warnings && result.warnings.length > 0 && (
                            <Alert className="border-yellow-200 bg-yellow-50">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                <AlertDescription className="text-yellow-800">
                                    <p className="font-medium mb-2">Avertissements :</p>
                                    <ul className="text-sm space-y-1 list-disc list-inside">
                                        {result.warnings.map((warning, i) => (
                                            <li key={i}>{warning}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}

                        <DialogFooter>
                            <Button onClick={handleReset}>
                                {result.success ? 'Fermer' : 'Réessayer'}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

