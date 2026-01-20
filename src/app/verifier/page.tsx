'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, FileText, Loader2, ArrowLeft, QrCode } from 'lucide-react';

export default function VerifierPage() {
    const router = useRouter();
    const [numero, setNumero] = useState('');
    const [loading, setLoading] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        // Fetch logo
        const fetchLogo = async () => {
            try {
                const response = await fetch('/api/admin/assets');
                if (response.ok) {
                    const data = await response.json();
                    if (data.logoUrl) setLogoUrl(data.logoUrl);
                }
            } catch (error) {
                console.log('Using default logo');
            }
        };
        fetchLogo();
    }, []);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!numero.trim()) {
            return;
        }

        setLoading(true);

        try {
            router.push(`/verifier/${numero}`);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[var(--navy)] via-[var(--navy-light)] to-[var(--navy)] flex flex-col relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--accent-green)]/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--accent-orange)]/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
            </div>

            {/* Header */}
            <header className="relative z-10 p-6">
                <Link href="/" className="inline-flex items-center gap-3 text-white/80 hover:text-white transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                    <span className="text-sm font-medium">Retour à l&apos;accueil</span>
                </Link>
            </header>

            {/* Main content */}
            <main className="flex-1 flex items-center justify-center p-4 relative z-10">
                <div className="w-full max-w-lg">
                    {/* Logo and Header */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-block group">
                            {logoUrl ? (
                                <div className="relative h-20 w-20 mx-auto mb-4 overflow-hidden rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm transition-transform group-hover:scale-105">
                                    <Image
                                        src={logoUrl}
                                        alt="Logo SCN"
                                        fill
                                        className="object-contain p-1"
                                    />
                                </div>
                            ) : (
                                <div className="h-20 w-20 mx-auto mb-4 flex items-center justify-center border-2 border-white/20 bg-white/10 backdrop-blur-sm rounded-xl font-bold text-white text-2xl transition-transform group-hover:scale-105">
                                    SCN
                                </div>
                            )}
                        </Link>

                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            Vérification d&apos;Attestation
                        </h1>
                        <p className="text-white/70">
                            Service Civique National du Niger
                        </p>
                    </div>

                    {/* Card */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-[var(--accent-green)]/10 rounded-xl">
                                <QrCode className="h-6 w-6 text-[var(--accent-green)]" />
                            </div>
                            <div>
                                <h2 className="font-bold text-[var(--navy)]">
                                    Vérifier l&apos;authenticité
                                </h2>
                                <p className="text-sm text-[var(--text-muted)]">
                                    Saisissez le numéro ou scannez le QR Code
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleVerify} className="space-y-5">
                            <div className="space-y-2">
                                <label
                                    htmlFor="numero"
                                    className="block text-sm font-semibold text-[var(--text-dark)]"
                                >
                                    Numéro d&apos;attestation
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
                                    <input
                                        id="numero"
                                        type="text"
                                        value={numero}
                                        onChange={(e) => setNumero(e.target.value)}
                                        placeholder="Ex: ATT-2026-00001"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-[var(--text-dark)] placeholder-[var(--text-muted)] transition-all focus:border-[var(--accent-green)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)]/20"
                                    />
                                </div>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Le numéro se trouve en haut à droite de l&apos;attestation
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !numero.trim()}
                                className="w-full rounded-xl bg-[var(--accent-green)] hover:bg-[var(--accent-green-light)] py-3.5 font-semibold text-white shadow-lg transition-all hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Vérification...
                                    </>
                                ) : (
                                    <>
                                        <Search className="h-5 w-5" />
                                        Vérifier l&apos;attestation
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Instructions */}
                        <div className="mt-6 p-4 bg-[var(--navy)]/5 rounded-xl">
                            <p className="text-sm font-medium text-[var(--navy)] mb-2">
                                Comment vérifier ?
                            </p>
                            <ul className="text-sm text-[var(--text-muted)] space-y-1">
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-[var(--accent-orange)] rounded-full mt-1.5 flex-shrink-0" />
                                    Saisissez le numéro d&apos;attestation ci-dessus
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-[var(--accent-orange)] rounded-full mt-1.5 flex-shrink-0" />
                                    Ou scannez le QR Code avec votre smartphone
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-[var(--accent-green)] rounded-full mt-1.5 flex-shrink-0" />
                                    Les informations s&apos;afficheront si valide
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Footer text */}
                    <div className="mt-6 text-center text-sm text-white/50">
                        <p>
                            Cette page permet de vérifier l&apos;authenticité des attestations
                            délivrées par le Service Civique National.
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 p-6 text-center">
                <p className="text-white/40 text-xs">
                    © 2026 Service Civique National - République du Niger
                </p>
            </footer>
        </div>
    );
}
