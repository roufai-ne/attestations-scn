'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Upload, Trash2, Image as ImageIcon, CheckCircle, AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/components/shared/ConfirmProvider';

interface AssetsConfig {
    logoUrl?: string;
    heroImageUrl?: string;
    updatedAt?: string;
}

export default function AssetsConfigPage() {
    const { data: session, status } = useSession();
    const { toast } = useToast();
    const [assets, setAssets] = useState<AssetsConfig>({});
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<{ logo: boolean; hero: boolean }>({
        logo: false,
        hero: false,
    });

    const logoInputRef = useRef<HTMLInputElement>(null);
    const heroInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            redirect('/login');
        }
    }, [status]);

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            const response = await fetch('/api/admin/assets');
            if (response.ok) {
                const data = await response.json();
                setAssets(data);
            }
        } catch (error) {
            console.error('Error fetching assets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (type: 'logo' | 'hero', file: File) => {
        setUploading((prev) => ({ ...prev, [type]: true }));

        try {
            const formData = new FormData();
            formData.append('type', type);
            formData.append('file', file);

            const response = await fetch('/api/admin/assets', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: 'Succès',
                    description: data.message,
                    variant: 'default',
                });
                fetchAssets();
            } else {
                toast({
                    title: 'Erreur',
                    description: data.error || 'Erreur lors de l\'upload',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Erreur lors de l\'upload',
                variant: 'destructive',
            });
        } finally {
            setUploading((prev) => ({ ...prev, [type]: false }));
        }
    };

    const confirmDialog = useConfirm();

    const handleDelete = async (type: 'logo' | 'hero') => {
        const confirmed = await confirmDialog({
            title: type === 'logo' ? 'Supprimer le logo' : 'Supprimer l\'image hero',
            description: `Êtes-vous sûr de vouloir supprimer ${type === 'logo' ? 'le logo' : 'l\'image hero'} ?`,
            confirmText: 'Supprimer',
            cancelText: 'Annuler',
            variant: 'destructive',
        });

        if (!confirmed) return;

        try {
            const response = await fetch(`/api/admin/assets?type=${type}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: 'Succès',
                    description: data.message,
                    variant: 'default',
                });
                fetchAssets();
            } else {
                toast({
                    title: 'Erreur',
                    description: data.error,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Erreur lors de la suppression',
                variant: 'destructive',
            });
        }
    };

    const handleFileChange = (type: 'logo' | 'hero') => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleUpload(type, file);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-orange)]"></div>
            </div>
        );
    }

    if (session?.user.role !== 'ADMIN') {
        redirect('/login');
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--navy)]">
                    Configuration des Assets du Site
                </h1>
                <p className="text-[var(--text-muted)] mt-2">
                    Gérez le logo et l&apos;image de fond de la page d&apos;accueil
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Logo Configuration */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-[var(--navy)] mb-4 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Logo du Site
                    </h2>

                    <div className="mb-4">
                        {assets.logoUrl ? (
                            <div className="relative w-32 h-32 border-2 border-dashed border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                <Image
                                    src={assets.logoUrl}
                                    alt="Logo actuel"
                                    fill
                                    className="object-contain p-2"
                                />
                            </div>
                        ) : (
                            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                <span className="text-gray-400 text-sm text-center px-2">
                                    Aucun logo
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange('logo')}
                        />
                        <Button
                            onClick={() => logoInputRef.current?.click()}
                            disabled={uploading.logo}
                            className="bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-dark)]"
                        >
                            {uploading.logo ? (
                                <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4 mr-2" />
                            )}
                            {assets.logoUrl ? 'Changer' : 'Uploader'}
                        </Button>

                        {assets.logoUrl && (
                            <Button
                                variant="outline"
                                onClick={() => handleDelete('logo')}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                            </Button>
                        )}
                    </div>

                    <p className="text-xs text-[var(--text-muted)] mt-3">
                        Formats acceptés: JPG, PNG, WebP, SVG. Max 5 Mo.
                    </p>
                </Card>

                {/* Hero Image Configuration */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-[var(--navy)] mb-4 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Image de Fond (Hero)
                    </h2>

                    <div className="mb-4">
                        {assets.heroImageUrl ? (
                            <div className="relative w-full h-40 border-2 border-dashed border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                <Image
                                    src={assets.heroImageUrl}
                                    alt="Image hero actuelle"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                <span className="text-gray-400 text-sm text-center px-2">
                                    Aucune image de fond
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <input
                            ref={heroInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange('hero')}
                        />
                        <Button
                            onClick={() => heroInputRef.current?.click()}
                            disabled={uploading.hero}
                            className="bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-dark)]"
                        >
                            {uploading.hero ? (
                                <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4 mr-2" />
                            )}
                            {assets.heroImageUrl ? 'Changer' : 'Uploader'}
                        </Button>

                        {assets.heroImageUrl && (
                            <Button
                                variant="outline"
                                onClick={() => handleDelete('hero')}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                            </Button>
                        )}
                    </div>

                    <p className="text-xs text-[var(--text-muted)] mt-3">
                        Recommandé: 1920x1080px. Formats: JPG, PNG, WebP. Max 5 Mo.
                    </p>
                </Card>
            </div>

            {/* Preview Section */}
            <Card className="mt-8 p-6">
                <h2 className="text-lg font-semibold text-[var(--navy)] mb-4">
                    Aperçu de la Page d&apos;Accueil
                </h2>
                <div className="bg-gray-100 rounded-lg p-4">
                    <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[var(--accent-orange)] hover:underline"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Voir la page d&apos;accueil avec les nouveaux assets
                    </a>
                </div>

                {assets.updatedAt && (
                    <p className="text-xs text-[var(--text-muted)] mt-4">
                        Dernière mise à jour: {new Date(assets.updatedAt).toLocaleString('fr-FR')}
                    </p>
                )}
            </Card>

            {/* Tips */}
            <Card className="mt-6 p-4 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Conseils pour les images:</p>
                        <ul className="list-disc pl-4 space-y-1 text-blue-700">
                            <li>Le logo doit être de préférence carré (ex: 200x200px)</li>
                            <li>L&apos;image hero doit être en haute résolution (min 1920x1080px)</li>
                            <li>Utilisez des images représentatives du Service Civique National</li>
                            <li>Les modifications sont appliquées immédiatement</li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
}
