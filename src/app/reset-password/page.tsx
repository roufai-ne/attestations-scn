'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setVerifying(false);
            return;
        }
        verifyToken();
    }, [token]);

    const verifyToken = async () => {
        try {
            const response = await fetch('/api/auth/reset-password/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            setTokenValid(response.ok);
        } catch (err) {
            setTokenValid(false);
        } finally {
            setVerifying(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères');
            return;
        }

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la réinitialisation');
            }

            setSuccess(true);
            setTimeout(() => router.push('/login'), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <AuthLayout showBackToHome={false}>
                <div className="text-center py-8">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-[var(--accent-orange)]" />
                    <p className="mt-4 text-[var(--text-muted)]">Vérification du lien...</p>
                </div>
            </AuthLayout>
        );
    }

    if (!token || !tokenValid) {
        return (
            <AuthLayout showBackToHome={false}>
                <div className="text-center py-4">
                    <div className="inline-flex p-4 bg-red-100 rounded-full mb-4">
                        <XCircle className="h-10 w-10 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-[var(--navy)] mb-3">
                        Lien invalide ou expiré
                    </h2>
                    <p className="text-[var(--text-muted)] mb-6">
                        Ce lien de réinitialisation n&apos;est plus valide.
                        Les liens expirent après 1 heure.
                    </p>
                    <Link
                        href="/forgot-password"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-dark)] text-white font-medium rounded-xl transition-colors"
                    >
                        Demander un nouveau lien
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    if (success) {
        return (
            <AuthLayout showBackToHome={false}>
                <div className="text-center py-4">
                    <div className="inline-flex p-4 bg-[var(--accent-green)]/10 rounded-full mb-4">
                        <CheckCircle className="h-10 w-10 text-[var(--accent-green)]" />
                    </div>
                    <h2 className="text-xl font-bold text-[var(--navy)] mb-3">
                        Mot de passe modifié !
                    </h2>
                    <p className="text-[var(--text-muted)] mb-2">
                        Votre mot de passe a été réinitialisé avec succès.
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">
                        Redirection vers la page de connexion...
                    </p>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Nouveau mot de passe"
            subtitle="Choisissez un nouveau mot de passe sécurisé"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <Alert variant="destructive" className="rounded-xl">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    <label
                        htmlFor="password"
                        className="block text-sm font-semibold text-[var(--text-dark)]"
                    >
                        Nouveau mot de passe
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-[var(--text-dark)] placeholder-[var(--text-muted)] transition-all focus:border-[var(--accent-orange)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-orange)]/20"
                        />
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                        Minimum 8 caractères
                    </p>
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-semibold text-[var(--text-dark)]"
                    >
                        Confirmer le mot de passe
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-[var(--text-dark)] placeholder-[var(--text-muted)] transition-all focus:border-[var(--accent-orange)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-orange)]/20"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-dark)] py-3.5 font-semibold text-white shadow-lg transition-all hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-orange)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Modification...
                        </span>
                    ) : (
                        'Réinitialiser le mot de passe'
                    )}
                </button>

                <div className="text-center">
                    <Link
                        href="/login"
                        className="text-sm text-[var(--accent-orange)] hover:text-[var(--accent-orange-dark)] hover:underline font-medium inline-flex items-center gap-1"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        Retour à la connexion
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <AuthLayout showBackToHome={false}>
                <div className="text-center py-8">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-[var(--accent-orange)]" />
                </div>
            </AuthLayout>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
