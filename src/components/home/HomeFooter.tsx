'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Shield } from 'lucide-react';

interface HomeFooterProps {
    logoUrl?: string;
}

export function HomeFooter({ logoUrl }: HomeFooterProps) {
    return (
        <footer id="contact" className="bg-[var(--navy)] text-white">
            {/* Main Footer Content */}
            <div className="container mx-auto px-6 py-12">
                <div className="grid md:grid-cols-4 gap-8">
                    {/* Logo & Description */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-3 mb-4">
                            {logoUrl ? (
                                <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-white p-1.5">
                                    <Image
                                        src={logoUrl}
                                        alt="Logo SCN"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="h-14 w-14 flex items-center justify-center bg-white text-[var(--navy)] rounded-lg font-bold text-lg">
                                    SCN
                                </div>
                            )}
                            <div>
                                <h3 className="font-bold text-lg">Service Civique</h3>
                                <p className="text-white/70 text-xs">République du Niger</p>
                            </div>
                        </div>
                        <p className="text-white/70 text-sm leading-relaxed">
                            Plateforme officielle de gestion des attestations de fin de service civique national.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold mb-4 text-[var(--accent-orange)]">Liens rapides</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/" className="text-white/70 hover:text-white text-sm transition-colors">
                                    Accueil
                                </Link>
                            </li>
                            <li>
                                <Link href="#services" className="text-white/70 hover:text-white text-sm transition-colors">
                                    Nos services
                                </Link>
                            </li>
                            <li>
                                <Link href="/verifier" className="text-white/70 hover:text-white text-sm transition-colors">
                                    Vérifier une attestation
                                </Link>
                            </li>
                            <li>
                                <Link href="/login" className="text-white/70 hover:text-white text-sm transition-colors">
                                    Connexion
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h4 className="font-bold mb-4 text-[var(--accent-orange)]">Services</h4>
                        <ul className="space-y-2">
                            <li className="text-white/70 text-sm">Génération d&apos;attestations</li>
                            <li className="text-white/70 text-sm">Signature électronique</li>
                            <li className="text-white/70 text-sm">Vérification QR Code</li>
                            <li className="text-white/70 text-sm">Suivi des demandes</li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-bold mb-4 text-[var(--accent-orange)]">Contact</h4>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-white/70 text-sm">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span>Niamey, Niger</span>
                            </li>
                            <li className="flex items-center gap-2 text-white/70 text-sm">
                                <Phone className="w-4 h-4 flex-shrink-0" />
                                <span>+227 XX XX XX XX</span>
                            </li>
                            <li className="flex items-center gap-2 text-white/70 text-sm">
                                <Mail className="w-4 h-4 flex-shrink-0" />
                                <span>contact@scn.ne</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/10">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/60">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <span>© 2026 Service Civique National - République du Niger</span>
                        </div>
                        <div className="flex gap-4">
                            <Link href="#" className="hover:text-white transition-colors">
                                Mentions légales
                            </Link>
                            <Link href="#" className="hover:text-white transition-colors">
                                Politique de confidentialité
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default HomeFooter;
