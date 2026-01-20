'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email) {
            setError('Veuillez entrer votre adresse email');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de l\'envoi');
            }

            setSent(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <AuthLayout showBackToHome={false}>
                <div className="text-center py-4">
                    <div className="inline-flex p-4 bg-[var(--accent-green)]/10 rounded-full mb-4">
                        <CheckCircle className="h-10 w-10 text-[var(--accent-green)]" />
                    </div>
                    <h2 className="text-xl font-bold text-[var(--navy)] mb-3">
                        Email envoyé !
                    </h2>
                    <p className="text-[var(--text-muted)] mb-6">
                        Si un compte existe avec l&apos;adresse <strong className="text-[var(--text-dark)]">{email}</strong>,
                        vous recevrez un email avec les instructions de réinitialisation.
                    </p>
                    <p className="text-sm text-[var(--text-muted)] mb-6">
                        N&apos;oubliez pas de vérifier vos spams.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--navy)] hover:bg-[var(--navy-dark)] text-white font-medium rounded-xl transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Retour à la connexion
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Mot de passe oublié"
            subtitle="Entrez votre email pour réinitialiser votre mot de passe"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <Alert variant="destructive" className="rounded-xl">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-[var(--text-dark)]"
                    >
                        Adresse email
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="votre.email@example.com"
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
                            Envoi en cours...
                        </span>
                    ) : (
                        'Envoyer le lien'
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
