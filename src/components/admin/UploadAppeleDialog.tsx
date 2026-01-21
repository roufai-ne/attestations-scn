'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UploadAppeleDialogProps {
    arreteId: string;
    arreteNumero: string;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function UploadAppeleDialog({
    arreteId,
    arreteNumero,
    open,
    onClose,
    onSuccess,
}: UploadAppeleDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message?: string;
        appeles?: number;
        warnings?: string[];
        errors?: string[];
    } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Vérifier que c'est bien un fichier Excel
            const isExcel =
                selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                selectedFile.type === 'application/vnd.ms-excel' ||
                selectedFile.name.endsWith('.xlsx') ||
                selectedFile.name.endsWith('.xls');

            if (!isExcel) {
                toast.error('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
                return;
            }

            setFile(selectedFile);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('Veuillez sélectionner un fichier');
            return;
        }

        try {
            setUploading(true);
            setResult(null);

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`/api/admin/arretes/${arreteId}/upload-appeles`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                setResult({
                    success: false,
                    errors: data.errors || [data.error || 'Erreur lors de l\'upload'],
                    warnings: data.warnings || [],
                });
                toast.error('Erreur lors de l\'import');
                return;
            }

            setResult({
                success: true,
                message: data.message,
                appeles: data.appeles,
                warnings: data.warnings || [],
            });

            toast.success(`${data.appeles} appelés importés avec succès`);
            
            // Attendre 2 secondes puis fermer et rafraîchir
            setTimeout(() => {
                onSuccess();
                handleClose();
            }, 2000);

        } catch (error) {
            console.error('Erreur upload:', error);
            setResult({
                success: false,
                errors: ['Erreur réseau lors de l\'upload'],
            });
            toast.error('Erreur lors de l\'upload');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setResult(null);
        setUploading(false);
        onClose();
    };

    const handleRemoveFile = () => {
        setFile(null);
        setResult(null);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Importer les appelés (Excel)</DialogTitle>
                    <DialogDescription>
                        Arrêté N° {arreteNumero} - Uploadez un fichier Excel contenant la liste des appelés
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Instructions */}
                    <Alert>
                        <FileSpreadsheet className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-2 text-sm">
                                <p className="font-medium">Format attendu du fichier Excel :</p>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    <li>Ligne 1 : En-têtes (N°, Nom, Prénom(s), Date Naissance, Lieu Naissance, Diplôme)</li>
                                    <li>Lignes suivantes : Données des appelés</li>
                                    <li>Colonnes obligatoires : N°, Nom</li>
                                    <li>Format date : JJ/MM/AAAA ou AAAA-MM-JJ</li>
                                </ul>
                            </div>
                        </AlertDescription>
                    </Alert>

                    {/* Zone d'upload */}
                    {!file && !result ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                                onChange={handleFileChange}
                                disabled={uploading}
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <p className="text-sm font-medium text-gray-700 mb-1">
                                    Cliquez pour sélectionner un fichier Excel
                                </p>
                                <p className="text-xs text-gray-500">
                                    ou glissez-déposez votre fichier .xlsx ou .xls
                                </p>
                            </label>
                        </div>
                    ) : file && !result ? (
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
                                variant="ghost"
                                size="sm"
                                onClick={handleRemoveFile}
                                disabled={uploading}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : null}

                    {/* Résultat */}
                    {result && (
                        <div className="space-y-3">
                            {result.success ? (
                                <Alert className="border-green-200 bg-green-50">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
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
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={uploading}
                        >
                            {result?.success ? 'Fermer' : 'Annuler'}
                        </Button>
                        {!result && (
                            <Button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Import en cours...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Importer
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
