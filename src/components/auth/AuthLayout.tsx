'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    showBackToHome?: boolean;
}

export function AuthLayout({
    children,
    title,
    subtitle,
    showBackToHome = true,
}: AuthLayoutProps) {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        // Fetch logo from assets config
        const fetchLogo = async () => {
            try {
                const response = await fetch('/api/admin/assets');
                if (response.ok) {
                    const data = await response.json();
                    if (data.logoUrl) {
                        setLogoUrl(data.logoUrl);
                    }
                }
            } catch (error) {
                console.log('Using default logo');
            }
        };
        fetchLogo();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[var(--navy)] via-[var(--navy-light)] to-[var(--navy)] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--accent-orange)]/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--accent-green)]/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
                <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-md">
                {/* Logo and Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block group">
                        {logoUrl ? (
                            <div className="relative h-16 w-16 mx-auto mb-4 overflow-hidden rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm transition-transform group-hover:scale-105">
                                <Image
                                    src={logoUrl}
                                    alt="Logo SCN"
                                    fill
                                    className="object-contain p-1"
                                />
                            </div>
                        ) : (
                            <div className="h-16 w-16 mx-auto mb-4 flex items-center justify-center border-2 border-white/20 bg-white/10 backdrop-blur-sm rounded-xl font-bold text-white text-2xl transition-transform group-hover:scale-105">
                                SCN
                            </div>
                        )}
                    </Link>

                    {title && (
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                            {title}
                        </h1>
                    )}
                    {subtitle && (
                        <p className="text-white/70 text-sm">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
                    {children}
                </div>

                {/* Back to Home */}
                {showBackToHome && (
                    <div className="text-center mt-6">
                        <Link
                            href="/"
                            className="text-white/70 hover:text-white text-sm transition-colors inline-flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Retour à l&apos;accueil
                        </Link>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-white/40 text-xs">
                    © 2026 Service Civique National - République du Niger
                </p>
            </div>
        </div>
    );
}

export default AuthLayout;
