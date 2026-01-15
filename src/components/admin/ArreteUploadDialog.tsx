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
import { Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { OcrProgressTracker } from './OcrProgressTracker';
import { Progress } from '@/components/ui/progress';

interface ArreteUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ArreteUploadDialog({ open, onOpenChange }: ArreteUploadDialogProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploadedArreteId, setUploadedArreteId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        numero: '',
        dateArrete: '',
        promotion: '',
        annee: new Date().getFullYear().toString(),
    });

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
            if (droppedFile.type === 'application/pdf') {
                setFile(droppedFile);
            } else {
                toast({
                    title: 'Erreur',
                    description: 'Seuls les fichiers PDF sont acceptés',
                    variant: 'destructive',
                });
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type === 'application/pdf') {
                setFile(selectedFile);
            } else {
                toast({
                    title: 'Erreur',
                    description: 'Seuls les fichiers PDF sont acceptés',
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
                description: 'Veuillez sélectionner un fichier PDF',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        setUploadProgress(0);

        try {
            const data = new FormData();
            data.append('file', file);
            data.append('numero', formData.numero);
            data.append('dateArrete', formData.dateArrete);
            data.append('promotion', formData.promotion);
            data.append('annee', formData.annee);

            // Simuler la progression de l'upload
            const uploadInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(uploadInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            const response = await fetch('/api/admin/arretes', {
                method: 'POST',
                body: data,
            });

            clearInterval(uploadInterval);
            setUploadProgress(100);

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erreur lors de l\'upload');
            }

            // Stocker l'ID de l'arrêté pour afficher le tracker
            setUploadedArreteId(result.arrete.id);

            toast({
                title: 'Upload réussi',
                description: 'L\'indexation OCR va démarrer automatiquement',
            });

        } catch (error) {
            console.error('Erreur:', error);
            setUploadProgress(0);
            toast({
                title: 'Erreur',
                description: error instanceof Error ? error.message : 'Erreur lors de l\'upload',
                variant: 'destructive',
            });
            setLoading(false);
        }
    };

    const handleComplete = () => {
        toast({
            title: 'Indexation terminée !',
            description: 'L\'arrêté est maintenant disponible pour la recherche',
            duration: 5000,
        });

        // Attendre un peu puis fermer et rafraîchir
        setTimeout(() => {
            handleReset();
            router.refresh();
        }, 2000);
    };

    const handleError = (error: string) => {
        toast({
            title: 'Erreur d\'indexation',
            description: error,
            variant: 'destructive',
            duration: 7000,
        });
        setLoading(false);
    };

    const handleReset = () => {
        setFile(null);
        setUploadedArreteId(null);
        setUploadProgress(0);
        setLoading(false);
        setFormData({
            numero: '',
            dateArrete: '',
            promotion: '',
            annee: new Date().getFullYear().toString(),
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={uploadedArreteId ? undefined : onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {uploadedArreteId ? 'Indexation en cours' : 'Nouvel Arrêté'}
                    </DialogTitle>
                    <DialogDescription>
                        {uploadedArreteId
                            ? 'Veuillez patienter pendant l\'extraction et l\'indexation du contenu'
                            : 'Uploadez un arrêté de service civique au format PDF pour indexation OCR'}
                    </DialogDescription>
                </DialogHeader>

                {/* Si l'upload est terminé, afficher le tracker de progression OCR */}
                {uploadedArreteId ? (
                    <div className="space-y-4">
                        <OcrProgressTracker
                            arreteId={uploadedArreteId}
                            onComplete={handleComplete}
                            onError={handleError}
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={handleReset}
                                disabled={loading}
                            >
                                Fermer et ajouter un autre
                            </Button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Progression de l'upload */}
                        {loading && uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-blue-900">
                                        Upload du fichier...
                                    </span>
                                    <span className="text-sm text-blue-700">{uploadProgress}%</span>
                                </div>
                                <Progress value={uploadProgress} className="h-2" />
                            </div>
                        )}

                        {loading && uploadProgress === 100 && (
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <span className="text-sm font-medium text-green-900">
                                        Fichier uploadé avec succès ! Préparation de l'indexation...
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Zone de drag & drop */}
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                dragActive
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-300 hover:border-gray-400'
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            {file ? (
                                <div className="flex items-center justify-center gap-2">
                                    <FileText className="h-8 w-8 text-primary" />
                                    <div className="text-left">
                                        <p className="font-medium">{file.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                    <p className="text-sm text-gray-600 mb-2">
                                        Glissez-déposez un fichier PDF ici, ou cliquez pour sélectionner
                                    </p>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label htmlFor="file-upload">
                                        <Button type="button" variant="outline" size="sm" asChild>
                                            <span>Sélectionner un fichier</span>
                                        </Button>
                                    </label>
                                </>
                            )}
                        </div>

                        {/* Métadonnées */}
                        <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="numero">Numéro d'arrêté *</Label>
                            <Input
                                id="numero"
                                value={formData.numero}
                                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                                placeholder="Ex: 001/2024/MJS/SCN"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dateArrete">Date de l'arrêté *</Label>
                            <Input
                                id="dateArrete"
                                type="date"
                                value={formData.dateArrete}
                                onChange={(e) => setFormData({ ...formData, dateArrete: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="promotion">Promotion *</Label>
                            <Input
                                id="promotion"
                                value={formData.promotion}
                                onChange={(e) => setFormData({ ...formData, promotion: e.target.value })}
                                placeholder="Ex: Promotion 2024"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="annee">Année *</Label>
                            <Input
                                id="annee"
                                value={formData.annee}
                                onChange={(e) => setFormData({ ...formData, annee: e.target.value })}
                                placeholder="Ex: 2024"
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={loading || !file}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? 'Upload en cours...' : 'Créer l\'arrêté'}
                        </Button>
                    </DialogFooter>
                </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
