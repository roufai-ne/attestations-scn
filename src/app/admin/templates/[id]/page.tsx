'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { LoadingState } from '@/components/shared/LoadingState';
import {
    Edit,
    Play,
    ArrowLeft,
    CheckCircle,
    Calendar,
    Settings,
} from 'lucide-react';

interface TemplateField {
    id: string;
    label: string;
    type: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    color: string;
}

interface TemplateConfig {
    fields: TemplateField[];
    pageWidth: number;
    pageHeight: number;
    pageOrientation: string;
}

interface Template {
    id: string;
    nom: string;
    fichierPath: string;
    actif: boolean;
    createdAt: string;
    updatedAt: string;
    config: TemplateConfig | null;
}

export default function TemplateViewPage() {
    const params = useParams();
    const router = useRouter();
    const [template, setTemplate] = useState<Template | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activating, setActivating] = useState(false);

    useEffect(() => {
        fetchTemplate();
    }, [params.id]);

    const fetchTemplate = async () => {
        try {
            const response = await fetch(`/api/admin/templates/${params.id}`);
            if (response.ok) {
                const data = await response.json();
                setTemplate(data);
            } else {
                setError('Template non trouvé');
            }
        } catch (err) {
            setError('Erreur de connexion');
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async () => {
        setActivating(true);
        setError('');

        try {
            const response = await fetch(`/api/admin/templates/${params.id}/activate`, {
                method: 'POST',
            });

            if (response.ok) {
                fetchTemplate();
            } else {
                const data = await response.json();
                setError(data.error || 'Erreur lors de l\'activation');
            }
        } catch (err) {
            setError('Erreur de connexion');
        } finally {
            setActivating(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <LoadingState type="page" />
            </div>
        );
    }

    if (!template) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertDescription>{error || 'Template non trouvé'}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <Breadcrumbs
                items={[
                    { label: 'Administration', href: '/admin' },
                    { label: 'Templates', href: '/admin/templates' },
                    { label: template.nom },
                ]}
            />

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">{template.nom}</h1>
                            {template.actif ? (
                                <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Actif
                                </Badge>
                            ) : (
                                <Badge variant="outline">Inactif</Badge>
                            )}
                        </div>
                        <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4" />
                            Créé le {new Date(template.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!template.actif && (
                        <Button
                            variant="outline"
                            onClick={handleActivate}
                            disabled={activating || !template.config?.fields.length}
                        >
                            <Play className="h-4 w-4 mr-2" />
                            {activating ? 'Activation...' : 'Activer'}
                        </Button>
                    )}
                    <Link href={`/admin/templates/${template.id}/edit`}>
                        <Button>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                        </Button>
                    </Link>
                </div>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-3">
                {/* Aperçu du template */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Aperçu</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-gray-100 rounded-lg p-4 overflow-auto">
                            <div
                                className="relative bg-white shadow-md mx-auto"
                                style={{
                                    width: (template.config?.pageWidth || 842) * 0.6,
                                    height: (template.config?.pageHeight || 595) * 0.6,
                                    backgroundImage: `url(${template.fichierPath})`,
                                    backgroundSize: 'contain',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'center',
                                }}
                            >
                                {template.config?.fields.map((field) => (
                                    <div
                                        key={field.id}
                                        className="absolute bg-blue-100/50 border border-blue-300 px-1 rounded"
                                        style={{
                                            left: field.x * 0.6,
                                            top: field.y * 0.6,
                                            fontSize: field.fontSize * 0.6,
                                        }}
                                    >
                                        <span className="text-blue-800 text-xs">{field.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Informations */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">Dimensions</p>
                                <p className="font-medium">
                                    {template.config?.pageWidth || 842} × {template.config?.pageHeight || 595} pts
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Orientation</p>
                                <p className="font-medium capitalize">
                                    {template.config?.pageOrientation || 'paysage'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Champs configurés</p>
                                <p className="font-medium">{template.config?.fields.length || 0}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Liste des champs */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Champs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {template.config?.fields.length ? (
                                <ul className="space-y-2">
                                    {template.config.fields.map((field) => (
                                        <li
                                            key={field.id}
                                            className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
                                        >
                                            <span>{field.label}</span>
                                            <span className="text-gray-500 text-xs">
                                                ({field.x}, {field.y})
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    Aucun champ configuré. Cliquez sur "Modifier" pour ajouter des champs.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
