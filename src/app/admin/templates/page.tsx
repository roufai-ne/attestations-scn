'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { LoadingState } from '@/components/shared/LoadingState';
import {
    FileText,
    Plus,
    CheckCircle,
    Edit,
    Trash2,
    Eye,
    Play,
    MoreVertical,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Template {
    id: string;
    nom: string;
    fichierPath: string;
    actif: boolean;
    createdAt: string;
    updatedAt: string;
    config: {
        fields: any[];
    } | null;
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newFile, setNewFile] = useState<File | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await fetch('/api/admin/templates');
            if (response.ok) {
                const data = await response.json();
                setTemplates(data);
            } else {
                setError('Erreur lors du chargement');
            }
        } catch (err) {
            setError('Erreur de connexion');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newName || !newFile) return;

        setCreating(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('nom', newName);
            formData.append('background', newFile);

            const response = await fetch('/api/admin/templates', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setDialogOpen(false);
                setNewName('');
                setNewFile(null);
                fetchTemplates();
            } else {
                const data = await response.json();
                setError(data.error || 'Erreur lors de la création');
            }
        } catch (err) {
            setError('Erreur de connexion');
        } finally {
            setCreating(false);
        }
    };

    const handleActivate = async (id: string) => {
        try {
            const response = await fetch(`/api/admin/templates/${id}/activate`, {
                method: 'POST',
            });

            if (response.ok) {
                fetchTemplates();
            } else {
                const data = await response.json();
                setError(data.error || 'Erreur lors de l\'activation');
            }
        } catch (err) {
            setError('Erreur de connexion');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return;

        try {
            const response = await fetch(`/api/admin/templates/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchTemplates();
            } else {
                const data = await response.json();
                setError(data.error || 'Erreur lors de la suppression');
            }
        } catch (err) {
            setError('Erreur de connexion');
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <LoadingState type="card" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <Breadcrumbs
                items={[
                    { label: 'Administration', href: '/admin' },
                    { label: 'Templates d\'attestation' },
                ]}
            />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Templates d'attestation</h1>
                    <p className="text-gray-500">
                        Gérez les modèles de vos attestations
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Nouveau template
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Créer un nouveau template</DialogTitle>
                            <DialogDescription>
                                Uploadez l'image de fond et donnez un nom à votre template
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="nom">Nom du template</Label>
                                <Input
                                    id="nom"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Ex: Modèle officiel 2026"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="background">Image de fond</Label>
                                <Input
                                    id="background"
                                    type="file"
                                    accept="image/png,image/jpeg"
                                    onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                                />
                                <p className="text-xs text-gray-500">
                                    Format PNG ou JPG recommandé. Taille A4 paysage (842x595 points).
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Annuler
                            </Button>
                            <Button
                                onClick={handleCreate}
                                disabled={!newName || !newFile || creating}
                            >
                                {creating ? 'Création...' : 'Créer'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {templates.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Aucun template</h3>
                        <p className="text-gray-500 mb-4">
                            Créez votre premier template pour générer des attestations personnalisées
                        </p>
                        <Button onClick={() => setDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Créer un template
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                        <Card
                            key={template.id}
                            className={template.actif ? 'ring-2 ring-green-500' : ''}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{template.nom}</CardTitle>
                                        <CardDescription>
                                            {template.config?.fields.length || 0} champs configurés
                                        </CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/admin/templates/${template.id}/edit`}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Modifier
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/admin/templates/${template.id}`}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Voir
                                                </Link>
                                            </DropdownMenuItem>
                                            {!template.actif && (
                                                <>
                                                    <DropdownMenuItem onClick={() => handleActivate(template.id)}>
                                                        <Play className="h-4 w-4 mr-2" />
                                                        Activer
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(template.id)}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Supprimer
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Prévisualisation de l'image de fond */}
                                <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden mb-4">
                                    {template.fichierPath && (
                                        <img
                                            src={template.fichierPath}
                                            alt={template.nom}
                                            className="w-full h-full object-contain"
                                        />
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    {template.actif ? (
                                        <Badge className="bg-green-100 text-green-800">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Actif
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline">Inactif</Badge>
                                    )}
                                    <span className="text-xs text-gray-500">
                                        Modifié le {new Date(template.updatedAt).toLocaleDateString('fr-FR')}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
