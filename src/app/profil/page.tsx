'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { LoadingState } from '@/components/shared/LoadingState';
import { User, Mail, Phone, Building, Calendar, Shield, Save, Pencil } from 'lucide-react';

interface UserProfile {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    role: string;
    telephone?: string;
    service?: string;
    createdAt: string;
}

export default function ProfilPage() {
    const { data: session, status } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        telephone: '',
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await fetch('/api/profil');
            if (response.ok) {
                const data = await response.json();
                setProfile(data);
                setFormData({
                    nom: data.nom,
                    prenom: data.prenom,
                    telephone: data.telephone || '',
                });
            }
        } catch (err) {
            setError('Erreur lors du chargement du profil');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/profil', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erreur lors de la mise à jour');
            }

            const updatedProfile = await response.json();
            setProfile(updatedProfile);
            setEditing(false);
            setSuccess('Profil mis à jour avec succès');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
        } finally {
            setSaving(false);
        }
    };

    const getRoleBadge = (role: string) => {
        const roleConfig: Record<string, { label: string; className: string }> = {
            ADMIN: { label: 'Administrateur', className: 'bg-purple-100 text-purple-800' },
            DIRECTEUR: { label: 'Directeur', className: 'bg-blue-100 text-blue-800' },
            AGENT: { label: 'Agent', className: 'bg-green-100 text-green-800' },
            SAISIE: { label: 'Saisie', className: 'bg-gray-100 text-gray-800' },
        };

        const config = roleConfig[role] || { label: role, className: 'bg-gray-100 text-gray-800' };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
                {config.label}
            </span>
        );
    };

    if (status === 'loading' || loading) {
        return (
            <div className="container mx-auto p-6">
                <LoadingState type="form" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertDescription>Vous devez être connecté pour accéder à cette page.</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <Breadcrumbs items={[{ label: 'Mon profil' }]} />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Mon profil</h1>
                    <p className="text-gray-500">Gérez vos informations personnelles</p>
                </div>
                {!editing && (
                    <Button onClick={() => setEditing(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Modifier
                    </Button>
                )}
            </div>

            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-3">
                {/* Carte de profil */}
                <Card className="md:col-span-1">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center">
                            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-500 to-orange-600 flex items-center justify-center text-white text-3xl font-bold mb-4">
                                {profile?.prenom?.[0]}{profile?.nom?.[0]}
                            </div>
                            <h2 className="text-xl font-semibold">
                                {profile?.prenom} {profile?.nom}
                            </h2>
                            <p className="text-gray-500 text-sm">{profile?.email}</p>
                            <div className="mt-3">
                                {profile && getRoleBadge(profile.role)}
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t">
                            <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                                <Calendar className="h-4 w-4" />
                                <span>Membre depuis {profile && new Date(profile.createdAt).toLocaleDateString('fr-FR', {
                                    year: 'numeric',
                                    month: 'long',
                                })}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Informations détaillées */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Informations personnelles</CardTitle>
                        <CardDescription>
                            {editing ? 'Modifiez vos informations ci-dessous' : 'Vos informations de compte'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {editing ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="nom">Nom</Label>
                                        <Input
                                            id="nom"
                                            value={formData.nom}
                                            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="prenom">Prénom</Label>
                                        <Input
                                            id="prenom"
                                            value={formData.prenom}
                                            onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="telephone">Téléphone</Label>
                                    <Input
                                        id="telephone"
                                        type="tel"
                                        value={formData.telephone}
                                        onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                                        placeholder="Optionnel"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={profile?.email}
                                        disabled
                                        className="bg-gray-50"
                                    />
                                    <p className="text-xs text-gray-500">L'email ne peut pas être modifié</p>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button type="submit" disabled={saving}>
                                        <Save className="h-4 w-4 mr-2" />
                                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setEditing(false);
                                            setFormData({
                                                nom: profile?.nom || '',
                                                prenom: profile?.prenom || '',
                                                telephone: profile?.telephone || '',
                                            });
                                        }}
                                    >
                                        Annuler
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <User className="h-5 w-5 text-gray-500" />
                                    <div>
                                        <p className="text-sm text-gray-500">Nom complet</p>
                                        <p className="font-medium">{profile?.prenom} {profile?.nom}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Mail className="h-5 w-5 text-gray-500" />
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium">{profile?.email}</p>
                                    </div>
                                </div>

                                {profile?.telephone && (
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <Phone className="h-5 w-5 text-gray-500" />
                                        <div>
                                            <p className="text-sm text-gray-500">Téléphone</p>
                                            <p className="font-medium">{profile.telephone}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Shield className="h-5 w-5 text-gray-500" />
                                    <div>
                                        <p className="text-sm text-gray-500">Rôle</p>
                                        <p className="font-medium">{profile?.role}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
