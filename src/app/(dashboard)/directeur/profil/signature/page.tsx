'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Loader2, CheckCircle, QrCode, PenTool } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SignatureConfigPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [texteSignature, setTexteSignature] = useState('Le Directeur du Service Civique National');
    const [pin, setPin] = useState('');
    const [pinConfirm, setPinConfirm] = useState('');

    // Positions de la signature
    const [positionX, setPositionX] = useState(500);
    const [positionY, setPositionY] = useState(100);
    const [signatureWidth, setSignatureWidth] = useState(150);
    const [signatureHeight, setSignatureHeight] = useState(60);

    // Positions du QR Code
    const [qrCodePositionX, setQrCodePositionX] = useState(50);
    const [qrCodePositionY, setQrCodePositionY] = useState(500);
    const [qrCodeSize, setQrCodeSize] = useState(80);

    // Charger la configuration existante
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch('/api/directeur/signature/config');
                const data = await response.json();

                if (data.configured && data.config) {
                    setTexteSignature(data.config.texteSignature || texteSignature);
                    setPositionX(data.config.positionX || 500);
                    setPositionY(data.config.positionY || 100);
                    setSignatureWidth(data.config.signatureWidth || 150);
                    setSignatureHeight(data.config.signatureHeight || 60);
                    setQrCodePositionX(data.config.qrCodePositionX || 50);
                    setQrCodePositionY(data.config.qrCodePositionY || 500);
                    setQrCodeSize(data.config.qrCodeSize || 80);

                    if (data.config.signatureImage) {
                        setImagePreview(data.config.signatureImage);
                    }
                }
            } catch (error) {
                console.error('Erreur chargement config:', error);
            } finally {
                setLoadingConfig(false);
            }
        };

        fetchConfig();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!imageFile && !imagePreview) {
            toast({
                title: 'Erreur',
                description: 'Veuillez sélectionner une image de signature',
                variant: 'destructive',
            });
            return;
        }

        if (!/^\d{4,6}$/.test(pin)) {
            toast({
                title: 'Erreur',
                description: 'Le PIN doit contenir 4 à 6 chiffres',
                variant: 'destructive',
            });
            return;
        }

        if (pin !== pinConfirm) {
            toast({
                title: 'Erreur',
                description: 'Les PIN ne correspondent pas',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            if (imageFile) {
                formData.append('signatureImage', imageFile);
            }
            formData.append('texteSignature', texteSignature);
            formData.append('pin', pin);
            formData.append('positionX', positionX.toString());
            formData.append('positionY', positionY.toString());
            formData.append('signatureWidth', signatureWidth.toString());
            formData.append('signatureHeight', signatureHeight.toString());
            formData.append('qrCodePositionX', qrCodePositionX.toString());
            formData.append('qrCodePositionY', qrCodePositionY.toString());
            formData.append('qrCodeSize', qrCodeSize.toString());

            const response = await fetch('/api/directeur/signature/config', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erreur lors de la configuration');
            }

            toast({
                title: 'Configuration enregistrée',
                description: 'Votre signature électronique est maintenant active',
            });

            router.push('/directeur/dashboard');
        } catch (error) {
            toast({
                title: 'Erreur',
                description: error instanceof Error ? error.message : 'Erreur inconnue',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    if (loadingConfig) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Configuration de la signature</h1>
                <p className="text-gray-600">Configurez votre signature électronique, le QR code et votre PIN</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image de signature */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PenTool className="h-5 w-5" />
                            Image de signature
                        </CardTitle>
                        <CardDescription>
                            Uploadez une image de votre signature (PNG recommandé, fond transparent)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                            {imagePreview ? (
                                <div className="space-y-4">
                                    <img
                                        src={imagePreview}
                                        alt="Prévisualisation"
                                        className="max-h-32 mx-auto"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setImageFile(null);
                                            setImagePreview(null);
                                        }}
                                    >
                                        Changer l'image
                                    </Button>
                                </div>
                            ) : (
                                <label className="cursor-pointer">
                                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-600">
                                        Cliquez pour sélectionner une image
                                    </p>
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="texte">Texte de signature</Label>
                            <Input
                                id="texte"
                                value={texteSignature}
                                onChange={(e) => setTexteSignature(e.target.value)}
                                placeholder="Le Directeur..."
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Positions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Position de la signature sur l'attestation</CardTitle>
                        <CardDescription>
                            Définissez où sera placée votre signature sur le document (en points, A4 paysage = 842×595)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <Label htmlFor="posX">Position X</Label>
                                <Input
                                    id="posX"
                                    type="number"
                                    value={positionX}
                                    onChange={(e) => setPositionX(parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="posY">Position Y</Label>
                                <Input
                                    id="posY"
                                    type="number"
                                    value={positionY}
                                    onChange={(e) => setPositionY(parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="sigW">Largeur</Label>
                                <Input
                                    id="sigW"
                                    type="number"
                                    value={signatureWidth}
                                    onChange={(e) => setSignatureWidth(parseInt(e.target.value) || 150)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="sigH">Hauteur</Label>
                                <Input
                                    id="sigH"
                                    type="number"
                                    value={signatureHeight}
                                    onChange={(e) => setSignatureHeight(parseInt(e.target.value) || 60)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Position QR Code */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <QrCode className="h-5 w-5" />
                            Position du QR Code
                        </CardTitle>
                        <CardDescription>
                            Définissez où sera placé le QR code de vérification
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="qrX">Position X</Label>
                                <Input
                                    id="qrX"
                                    type="number"
                                    value={qrCodePositionX}
                                    onChange={(e) => setQrCodePositionX(parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="qrY">Position Y</Label>
                                <Input
                                    id="qrY"
                                    type="number"
                                    value={qrCodePositionY}
                                    onChange={(e) => setQrCodePositionY(parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="qrSize">Taille</Label>
                                <Input
                                    id="qrSize"
                                    type="number"
                                    value={qrCodeSize}
                                    onChange={(e) => setQrCodeSize(parseInt(e.target.value) || 80)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* PIN */}
                <Card>
                    <CardHeader>
                        <CardTitle>PIN de sécurité</CardTitle>
                        <CardDescription>
                            Définissez un PIN de 4 à 6 chiffres pour signer les attestations
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="pin">PIN</Label>
                                <Input
                                    id="pin"
                                    type="password"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    maxLength={6}
                                    placeholder="••••"
                                />
                            </div>
                            <div>
                                <Label htmlFor="pinConfirm">Confirmer le PIN</Label>
                                <Input
                                    id="pinConfirm"
                                    type="password"
                                    value={pinConfirm}
                                    onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                                    maxLength={6}
                                    placeholder="••••"
                                />
                            </div>
                        </div>

                        <Alert>
                            <AlertDescription>
                                Ce PIN sera requis à chaque signature. Ne le partagez avec personne.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                <div className="flex gap-4">
                    <Button type="submit" disabled={loading} className="flex-1">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enregistrement...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Enregistrer la configuration
                            </>
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                    >
                        Annuler
                    </Button>
                </div>
            </form>
        </div>
    );
}

