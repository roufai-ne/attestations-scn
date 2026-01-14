'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SignatureConfigPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [texteSignature, setTexteSignature] = useState('Le Directeur du Service Civique National');
    const [pin, setPin] = useState('');
    const [pinConfirm, setPinConfirm] = useState('');

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

        if (!imageFile) {
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
            formData.append('signatureImage', imageFile);
            formData.append('texteSignature', texteSignature);
            formData.append('pin', pin);

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

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Configuration de la signature</h1>
                <p className="text-gray-600">Configurez votre signature électronique et votre PIN</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Image de signature</CardTitle>
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

                <Card>
                    <CardHeader>
                        <CardTitle>PIN de sécurité</CardTitle>
                        <CardDescription>
                            Définissez un PIN de 4 à 6 chiffres pour signer les attestations
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
