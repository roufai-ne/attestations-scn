'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Plus } from 'lucide-react';

interface HeroSectionProps {
    heroImageUrl?: string;
    logoUrl?: string;
}

export function HeroSection({ heroImageUrl, logoUrl }: HeroSectionProps) {
    const defaultHeroImage = '/uploads/hero-bg.jpg';

    return (
        <section className="relative min-h-[85vh] flex items-center overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={heroImageUrl || defaultHeroImage}
                    alt="Background"
                    fill
                    className="object-cover"
                    priority
                    onError={(e) => {
                        // Fallback to gradient if image fails to load
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--navy)]/40 via-transparent to-[var(--navy)]/20" />
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 relative z-10">
                <div className="flex justify-end">
                    {/* Card Overlay */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 md:p-12 max-w-lg w-full transform hover:scale-[1.02] transition-transform duration-300">
                        {/* Decorative green bar */}
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-1 h-16 bg-[var(--accent-green)] rounded-full flex-shrink-0" />
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-[var(--navy)] leading-tight">
                                    Service Civique
                                    <br />
                                    <span className="text-[var(--text-dark)]">National</span>
                                </h1>
                            </div>
                        </div>

                        {/* Separator line */}
                        <div className="w-16 h-0.5 bg-[var(--accent-green)] mb-6" />

                        {/* Description */}
                        <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8">
                            Plateforme numérique officielle pour la gestion des attestations
                            de fin de service civique. Génération automatique, signature
                            électronique sécurisée et vérification par QR Code.
                            Rejoignez notre système moderne et efficace.
                        </p>

                        {/* CTA Button */}
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-dark)] text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl group"
                        >
                            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                            <span>Accéder à la plateforme</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Bottom decorative wave */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
        </section>
    );
}

export default HeroSection;
