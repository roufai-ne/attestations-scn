'use client';

import Image from 'next/image';
import { FileCheck, Shield, Clock, QrCode, Users, Award } from 'lucide-react';
import { ServiceCard } from './ServiceCard';

const services = [
    {
        title: 'Génération d\'attestations',
        description:
            'Création automatique d\'attestations de fin de service civique avec numérotation séquentielle et QR code intégré pour vérification.',
        icon: FileCheck,
        accentColor: 'orange' as const,
        href: '/login',
    },
    {
        title: 'Signature électronique',
        description:
            'Signature numérique sécurisée par le directeur avec authentification à deux facteurs (PIN) pour garantir l\'authenticité.',
        icon: Shield,
        accentColor: 'navy' as const,
        href: '/login',
    },
    {
        title: 'Vérification QR Code',
        description:
            'Validation instantanée des attestations par scan du QR code. Vérifiez l\'authenticité de tout document en quelques secondes.',
        icon: QrCode,
        accentColor: 'green' as const,
        href: '/verifier',
    },
];

interface ServicesSectionProps {
    backgroundImageUrl?: string;
}

export function ServicesSection({ backgroundImageUrl }: ServicesSectionProps) {
    return (
        <section id="services" className="relative py-16">
            {/* Top decorative navy band with cityscape */}
            <div className="absolute top-0 left-0 right-0 h-48 bg-[var(--navy)] overflow-hidden">
                {backgroundImageUrl && (
                    <Image
                        src={backgroundImageUrl}
                        alt="Background"
                        fill
                        className="object-cover opacity-30"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--navy)]/80 to-[var(--navy)]" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-12 pt-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Nos services
                    </h2>
                    <p className="text-white/80 max-w-2xl mx-auto text-sm">
                        Découvrez les fonctionnalités de notre plateforme de gestion des attestations.
                        Un système moderne, sécurisé et efficace au service des citoyens.
                    </p>
                </div>

                {/* Service Cards */}
                <div className="grid md:grid-cols-3 gap-6 pt-8">
                    {services.map((service) => (
                        <ServiceCard
                            key={service.title}
                            title={service.title}
                            description={service.description}
                            icon={service.icon}
                            accentColor={service.accentColor}
                            href={service.href}
                        />
                    ))}
                </div>

                {/* Additional Features */}
                <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
                    <div className="flex flex-col items-center group">
                        <div className="w-16 h-16 bg-[var(--accent-green)]/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-[var(--accent-green)]/20 transition-colors">
                            <Clock className="w-8 h-8 text-[var(--accent-green)]" />
                        </div>
                        <h3 className="font-bold text-[var(--navy)] mb-2">Traitement rapide</h3>
                        <p className="text-sm text-[var(--text-muted)]">
                            Délai moyen de 24h pour le traitement des demandes
                        </p>
                    </div>

                    <div className="flex flex-col items-center group">
                        <div className="w-16 h-16 bg-[var(--accent-orange)]/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-[var(--accent-orange)]/20 transition-colors">
                            <Users className="w-8 h-8 text-[var(--accent-orange)]" />
                        </div>
                        <h3 className="font-bold text-[var(--navy)] mb-2">+5000 Attestations</h3>
                        <p className="text-sm text-[var(--text-muted)]">
                            Attestations délivrées à ce jour
                        </p>
                    </div>

                    <div className="flex flex-col items-center group">
                        <div className="w-16 h-16 bg-[var(--navy)]/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-[var(--navy)]/20 transition-colors">
                            <Award className="w-8 h-8 text-[var(--navy)]" />
                        </div>
                        <h3 className="font-bold text-[var(--navy)] mb-2">98% Satisfaction</h3>
                        <p className="text-sm text-[var(--text-muted)]">
                            Taux de satisfaction des utilisateurs
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default ServicesSection;
