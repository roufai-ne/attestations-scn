'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { LoadingState } from '@/components/shared/LoadingState';
import {
    Lock,
    Bell,
    Eye,
    Trash2,
    Shield,
    LogOut,
    Save,
    AlertTriangle,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

export default function ParametresPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // États pour le changement de mot de passe
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // États pour les préférences
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        smsNotifications: false,
    });

    // État pour la suppression de compte
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (passwordForm.newPassword.length < 8) {
            setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('Les mots de passe ne correspondent pas');
            return;
        }

        setPasswordLoading(true);

        try {
            const response = await fetch('/api/profil/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors du changement');
            }

            setPasswordSuccess('Mot de passe modifié avec succès');
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (err) {
            setPasswordError(err instanceof Error ? err.message : 'Erreur');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/login' });
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirm !== 'SUPPRIMER') {
            return;
        }

        setDeleteLoading(true);

        try {
            const response = await fetch('/api/profil', {
                method: 'DELETE',
            });

            if (response.ok) {
                await signOut({ callbackUrl: '/login' });
            }
        } catch (err) {
            console.error('Erreur suppression compte:', err);
        } finally {
            setDeleteLoading(false);
        }
    };

    if (status === 'loading') {
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
            <Breadcrumbs items={[{ label: 'Paramètres' }]} />

            <div className="mb-6">
                <h1 className="text-2xl font-bold">Paramètres</h1>
                <p className="text-gray-500">Gérez vos paramètres de compte et préférences</p>
            </div>

            <div className="space-y-6">
                {/* Section Sécurité */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Sécurité
                        </CardTitle>
                        <CardDescription>
                            Gérez votre mot de passe et la sécurité de votre compte
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            {passwordError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{passwordError}</AlertDescription>
                                </Alert>
                            )}
                            {passwordSuccess && (
                                <Alert className="bg-green-50 border-green-200 text-green-800">
                                    <AlertDescription>{passwordSuccess}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) =>
                                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={passwordForm.newPassword}
                                        onChange={(e) =>
                                            setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                                        }
                                        required
                                        minLength={8}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) =>
                                            setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                                        }
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>

                            <Button type="submit" disabled={passwordLoading}>
                                <Save className="h-4 w-4 mr-2" />
                                {passwordLoading ? 'Modification...' : 'Modifier le mot de passe'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Section Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notifications
                        </CardTitle>
                        <CardDescription>
                            Configurez vos préférences de notification
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Notifications par email</Label>
                                <p className="text-sm text-gray-500">
                                    Recevoir des emails pour les mises à jour importantes
                                </p>
                            </div>
                            <Switch
                                checked={preferences.emailNotifications}
                                onCheckedChange={(checked) =>
                                    setPreferences({ ...preferences, emailNotifications: checked })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Notifications par SMS</Label>
                                <p className="text-sm text-gray-500">
                                    Recevoir des SMS pour les alertes urgentes
                                </p>
                            </div>
                            <Switch
                                checked={preferences.smsNotifications}
                                onCheckedChange={(checked) =>
                                    setPreferences({ ...preferences, smsNotifications: checked })
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Section Session */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Session
                        </CardTitle>
                        <CardDescription>
                            Gérez votre session active
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium">Session actuelle</p>
                                <p className="text-sm text-gray-500">
                                    Connecté en tant que {session.user?.email}
                                </p>
                            </div>
                            <Button variant="outline" onClick={handleLogout}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Se déconnecter
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Section Zone Dangereuse */}
                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Zone dangereuse
                        </CardTitle>
                        <CardDescription>
                            Actions irréversibles sur votre compte
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-red-800">Désactiver mon compte</p>
                                    <p className="text-sm text-red-600">
                                        Cette action nécessite l'intervention d'un administrateur pour être annulée
                                    </p>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Désactiver
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Confirmer la désactivation</DialogTitle>
                                            <DialogDescription>
                                                Cette action désactivera votre compte. Vous ne pourrez plus vous connecter.
                                                Un administrateur devra réactiver votre compte manuellement.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4">
                                            <Label htmlFor="deleteConfirm">
                                                Tapez <strong>SUPPRIMER</strong> pour confirmer
                                            </Label>
                                            <Input
                                                id="deleteConfirm"
                                                value={deleteConfirm}
                                                onChange={(e) => setDeleteConfirm(e.target.value)}
                                                className="mt-2"
                                                placeholder="SUPPRIMER"
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                variant="destructive"
                                                onClick={handleDeleteAccount}
                                                disabled={deleteConfirm !== 'SUPPRIMER' || deleteLoading}
                                            >
                                                {deleteLoading ? 'Désactivation...' : 'Confirmer la désactivation'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
