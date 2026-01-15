'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
    Save,
    Eye,
    Upload,
    FileText,
    Image,
    Type,
    Layout,
    Loader2,
    RefreshCw,
} from 'lucide-react';

interface AttestationConfig {
    // En-tête
    titreDocument: string;
    sousTitre: string;
    logoPath: string;
    showLogo: boolean;

    // Corps du document
    introText: string;
    conclusionText: string;
    mentionLegale: string;

    // Mise en page
    margeHaut: number;
    margeBas: number;
    margeGauche: number;
    margeDroite: number;

    // QR Code
    showQRCode: boolean;
    qrCodePosition: 'bottom-left' | 'bottom-right' | 'top-right';
    qrCodeSize: number;

    // Signature
    signaturePosition: 'left' | 'center' | 'right';
    showDateSignature: boolean;
    lieuSignature: string;
}

const defaultConfig: AttestationConfig = {
    titreDocument: "ATTESTATION DE SERVICE CIVIQUE NATIONAL",
    sousTitre: "République du Niger - Ministère de la Jeunesse",
    logoPath: "/images/logo-niger.png",
    showLogo: true,
    introText: "Le Directeur du Service Civique National atteste que :",
    conclusionText: "En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.",
    mentionLegale: "Cette attestation est vérifiable en ligne via le QR code ci-dessous.",
    margeHaut: 20,
    margeBas: 20,
    margeGauche: 25,
    margeDroite: 25,
    showQRCode: true,
    qrCodePosition: 'bottom-right',
    qrCodeSize: 80,
    signaturePosition: 'right',
    showDateSignature: true,
    lieuSignature: 'Niamey',
};

export default function AttestationConfigPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<AttestationConfig>(defaultConfig);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/config/attestation');
            if (response.ok) {
                const data = await response.json();
                if (data.config) {
                    setConfig({ ...defaultConfig, ...data.config });
                }
            }
        } catch (error) {
            console.error('Erreur chargement config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/admin/config/attestation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config }),
            });

            if (response.ok) {
                toast({
                    title: 'Configuration sauvegardée',
                    description: 'Le modèle d\'attestation a été mis à jour.',
                });
            } else {
                throw new Error('Erreur lors de la sauvegarde');
            }
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Impossible de sauvegarder la configuration.',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (confirm('Remettre la configuration par défaut ?')) {
            setConfig(defaultConfig);
            toast({
                title: 'Configuration réinitialisée',
                description: 'Les valeurs par défaut ont été restaurées.',
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Configuration du Modèle d'Attestation</h1>
                    <p className="text-gray-600 mt-1">
                        Personnalisez l'apparence et le contenu des attestations générées
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleReset}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Réinitialiser
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Enregistrer
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="header" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="header" className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        En-tête
                    </TabsTrigger>
                    <TabsTrigger value="content" className="flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        Contenu
                    </TabsTrigger>
                    <TabsTrigger value="layout" className="flex items-center gap-2">
                        <Layout className="h-4 w-4" />
                        Mise en page
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Aperçu
                    </TabsTrigger>
                </TabsList>

                {/* En-tête */}
                <TabsContent value="header">
                    <Card>
                        <CardHeader>
                            <CardTitle>En-tête du document</CardTitle>
                            <CardDescription>
                                Configurez le titre, le logo et les informations d'en-tête
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="titreDocument">Titre du document</Label>
                                    <Input
                                        id="titreDocument"
                                        value={config.titreDocument}
                                        onChange={(e) => setConfig({ ...config, titreDocument: e.target.value })}
                                        placeholder="ATTESTATION DE SERVICE CIVIQUE NATIONAL"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sousTitre">Sous-titre</Label>
                                    <Input
                                        id="sousTitre"
                                        value={config.sousTitre}
                                        onChange={(e) => setConfig({ ...config, sousTitre: e.target.value })}
                                        placeholder="République du Niger..."
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="space-y-1">
                                    <Label>Afficher le logo</Label>
                                    <p className="text-sm text-gray-500">
                                        Affiche le logo officiel dans l'en-tête
                                    </p>
                                </div>
                                <Switch
                                    checked={config.showLogo}
                                    onCheckedChange={(checked) => setConfig({ ...config, showLogo: checked })}
                                />
                            </div>

                            {config.showLogo && (
                                <div className="space-y-2">
                                    <Label htmlFor="logoPath">Chemin du logo</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="logoPath"
                                            value={config.logoPath}
                                            onChange={(e) => setConfig({ ...config, logoPath: e.target.value })}
                                            placeholder="/images/logo.png"
                                        />
                                        <Button variant="outline">
                                            <Upload className="h-4 w-4 mr-2" />
                                            Parcourir
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Contenu */}
                <TabsContent value="content">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contenu textuel</CardTitle>
                            <CardDescription>
                                Personnalisez les textes standards de l'attestation
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="introText">Texte d'introduction</Label>
                                <Textarea
                                    id="introText"
                                    value={config.introText}
                                    onChange={(e) => setConfig({ ...config, introText: e.target.value })}
                                    rows={3}
                                    placeholder="Le Directeur du Service Civique National atteste que..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="conclusionText">Texte de conclusion</Label>
                                <Textarea
                                    id="conclusionText"
                                    value={config.conclusionText}
                                    onChange={(e) => setConfig({ ...config, conclusionText: e.target.value })}
                                    rows={3}
                                    placeholder="En foi de quoi..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mentionLegale">Mention légale</Label>
                                <Textarea
                                    id="mentionLegale"
                                    value={config.mentionLegale}
                                    onChange={(e) => setConfig({ ...config, mentionLegale: e.target.value })}
                                    rows={2}
                                    placeholder="Cette attestation est vérifiable..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="lieuSignature">Lieu de signature</Label>
                                    <Input
                                        id="lieuSignature"
                                        value={config.lieuSignature}
                                        onChange={(e) => setConfig({ ...config, lieuSignature: e.target.value })}
                                        placeholder="Niamey"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="space-y-1">
                                        <Label>Afficher la date de signature</Label>
                                        <p className="text-sm text-gray-500">
                                            Inclut la date automatiquement
                                        </p>
                                    </div>
                                    <Switch
                                        checked={config.showDateSignature}
                                        onCheckedChange={(checked) => setConfig({ ...config, showDateSignature: checked })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Mise en page */}
                <TabsContent value="layout">
                    <div className="grid grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Marges (mm)</CardTitle>
                                <CardDescription>
                                    Définissez les marges du document PDF
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="margeHaut">Haut</Label>
                                        <Input
                                            id="margeHaut"
                                            type="number"
                                            value={config.margeHaut}
                                            onChange={(e) => setConfig({ ...config, margeHaut: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="margeBas">Bas</Label>
                                        <Input
                                            id="margeBas"
                                            type="number"
                                            value={config.margeBas}
                                            onChange={(e) => setConfig({ ...config, margeBas: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="margeGauche">Gauche</Label>
                                        <Input
                                            id="margeGauche"
                                            type="number"
                                            value={config.margeGauche}
                                            onChange={(e) => setConfig({ ...config, margeGauche: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="margeDroite">Droite</Label>
                                        <Input
                                            id="margeDroite"
                                            type="number"
                                            value={config.margeDroite}
                                            onChange={(e) => setConfig({ ...config, margeDroite: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>QR Code de vérification</CardTitle>
                                <CardDescription>
                                    Configuration du QR code pour la vérification en ligne
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="space-y-1">
                                        <Label>Afficher le QR Code</Label>
                                        <p className="text-sm text-gray-500">
                                            Permet la vérification en ligne
                                        </p>
                                    </div>
                                    <Switch
                                        checked={config.showQRCode}
                                        onCheckedChange={(checked) => setConfig({ ...config, showQRCode: checked })}
                                    />
                                </div>

                                {config.showQRCode && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="qrCodePosition">Position</Label>
                                            <select
                                                id="qrCodePosition"
                                                value={config.qrCodePosition}
                                                onChange={(e) => setConfig({ ...config, qrCodePosition: e.target.value as any })}
                                                className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white"
                                            >
                                                <option value="bottom-left">Bas gauche</option>
                                                <option value="bottom-right">Bas droite</option>
                                                <option value="top-right">Haut droite</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="qrCodeSize">Taille (px)</Label>
                                            <Input
                                                id="qrCodeSize"
                                                type="number"
                                                value={config.qrCodeSize}
                                                onChange={(e) => setConfig({ ...config, qrCodeSize: parseInt(e.target.value) || 80 })}
                                                min={40}
                                                max={150}
                                            />
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="col-span-2">
                            <CardHeader>
                                <CardTitle>Position de la signature</CardTitle>
                                <CardDescription>
                                    Définissez où apparaît le bloc de signature
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4">
                                    {(['left', 'center', 'right'] as const).map((position) => (
                                        <button
                                            key={position}
                                            onClick={() => setConfig({ ...config, signaturePosition: position })}
                                            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                                                config.signaturePosition === position
                                                    ? 'border-blue-600 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className={`h-2 w-16 bg-gray-300 rounded mx-auto mb-2 ${
                                                position === 'left' ? 'ml-0' : position === 'right' ? 'mr-0' : ''
                                            }`} />
                                            <span className="text-sm font-medium capitalize">
                                                {position === 'left' ? 'Gauche' : position === 'right' ? 'Droite' : 'Centre'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Aperçu */}
                <TabsContent value="preview">
                    <Card>
                        <CardHeader>
                            <CardTitle>Aperçu du modèle</CardTitle>
                            <CardDescription>
                                Visualisez l'apparence de l'attestation avec les paramètres actuels
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                className="bg-white border-2 border-gray-200 rounded-lg p-8 mx-auto max-w-2xl shadow-sm"
                                style={{
                                    paddingTop: `${config.margeHaut}px`,
                                    paddingBottom: `${config.margeBas}px`,
                                    paddingLeft: `${config.margeGauche}px`,
                                    paddingRight: `${config.margeDroite}px`,
                                }}
                            >
                                {/* En-tête */}
                                <div className="text-center mb-8">
                                    {config.showLogo && (
                                        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                                            <FileText className="h-8 w-8 text-gray-400" />
                                        </div>
                                    )}
                                    <h2 className="text-xl font-bold text-gray-900">{config.titreDocument}</h2>
                                    <p className="text-sm text-gray-600 mt-1">{config.sousTitre}</p>
                                </div>

                                {/* Corps */}
                                <div className="space-y-4 text-gray-700">
                                    <p>{config.introText}</p>

                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                        <p><strong>Nom :</strong> <span className="text-gray-400">EXEMPLE NOM</span></p>
                                        <p><strong>Prénom :</strong> <span className="text-gray-400">Exemple Prénom</span></p>
                                        <p><strong>Né(e) le :</strong> <span className="text-gray-400">01/01/1990</span></p>
                                        <p><strong>Promotion :</strong> <span className="text-gray-400">2023</span></p>
                                    </div>

                                    <p>{config.conclusionText}</p>
                                </div>

                                {/* Signature */}
                                <div className={`mt-8 ${
                                    config.signaturePosition === 'left' ? 'text-left' :
                                    config.signaturePosition === 'right' ? 'text-right' : 'text-center'
                                }`}>
                                    {config.showDateSignature && (
                                        <p className="text-sm text-gray-600 mb-2">
                                            Fait à {config.lieuSignature}, le {new Date().toLocaleDateString('fr-FR')}
                                        </p>
                                    )}
                                    <div className="inline-block">
                                        <div className="w-32 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs">
                                            Signature
                                        </div>
                                        <p className="text-sm font-medium mt-2">Le Directeur</p>
                                    </div>
                                </div>

                                {/* QR Code */}
                                {config.showQRCode && (
                                    <div className={`mt-6 ${
                                        config.qrCodePosition === 'bottom-left' ? 'text-left' :
                                        config.qrCodePosition === 'bottom-right' ? 'text-right' : 'text-right'
                                    }`}>
                                        <div
                                            className="inline-block bg-gray-100 rounded p-2"
                                            style={{ width: config.qrCodeSize, height: config.qrCodeSize }}
                                        >
                                            <div className="w-full h-full bg-gray-300 rounded flex items-center justify-center">
                                                <span className="text-xs text-gray-500">QR</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{config.mentionLegale}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
