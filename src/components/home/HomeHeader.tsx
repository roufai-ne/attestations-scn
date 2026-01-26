'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { User, LayoutDashboard, LogOut } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavItem {
    label: string;
    href: string;
}

const navItems: NavItem[] = [
    { label: 'Accueil', href: '/' },
    { label: 'Nos Services', href: '#services' },
    { label: 'À propos', href: '#about' },
    { label: 'Vérification', href: '/verifier' },
    { label: 'Contact', href: '#contact' },
];

interface HomeHeaderProps {
    logoUrl?: string;
}

// Mapping des rôles vers les dashboards
const ROLE_DASHBOARDS: Record<string, string> = {
    ADMIN: '/admin/dashboard',
    DIRECTEUR: '/directeur/dashboard',
    AGENT: '/agent/dashboard',
    SAISIE: '/saisie/dashboard',
};

// Labels des rôles en français
const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Administrateur',
    DIRECTEUR: 'Directeur',
    AGENT: 'Agent',
    SAISIE: 'Agent de saisie',
};

export function HomeHeader({ logoUrl }: HomeHeaderProps) {
    const { data: session, status } = useSession();
    const [scrolled, setScrolled] = useState(false);
    const [activeItem, setActiveItem] = useState('/');

    const isLoggedIn = status === 'authenticated' && session?.user;
    const userRole = session?.user?.role || 'AGENT';
    const dashboardUrl = ROLE_DASHBOARDS[userRole] || '/agent/dashboard';

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                    ? 'bg-white shadow-md py-2'
                    : 'bg-white/95 backdrop-blur-sm py-4'
                }`}
        >
            <div className="container mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    {logoUrl ? (
                        <div className="relative h-16 w-16 overflow-hidden rounded-lg transition-transform group-hover:scale-105">
                            <Image
                                src={logoUrl}
                                alt="Logo SCN"
                                fill
                                className="object-contain"
                            />
                        </div>
                    ) : (
                        <div className="h-16 w-16 flex items-center justify-center border-2 border-[var(--navy)] rounded-lg font-bold text-[var(--navy)] text-xl transition-transform group-hover:scale-105">
                            SCN
                        </div>
                    )}
                </Link>

                {/* Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setActiveItem(item.href)}
                            className={`px-4 py-2 text-sm font-medium transition-colors relative ${activeItem === item.href
                                    ? 'text-[var(--accent-orange)]'
                                    : 'text-[var(--text-dark)] hover:text-[var(--accent-orange)]'
                                }`}
                        >
                            {item.label}
                            {activeItem === item.href && (
                                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[var(--accent-orange)] rounded-full" />
                            )}
                        </Link>
                    ))}
                </nav>

                {/* User Menu / Login Button */}
                {isLoggedIn ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="hidden md:inline-flex items-center gap-3 px-5 py-2.5 bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-dark)] text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                                    {session.user.prenom?.[0]}{session.user.nom?.[0]}
                                </div>
                                <span>{session.user.prenom}</span>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <div className="px-3 py-3 border-b bg-gray-50">
                                <p className="font-medium text-[var(--navy)]">{session.user.prenom} {session.user.nom}</p>
                                <p className="text-xs text-gray-500">{session.user.email}</p>
                                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-[var(--accent-orange)]/10 text-[var(--accent-orange)] rounded">
                                    {ROLE_LABELS[userRole]}
                                </span>
                            </div>
                            <DropdownMenuItem asChild className="py-2.5">
                                <Link href={dashboardUrl} className="flex items-center gap-2 cursor-pointer">
                                    <LayoutDashboard className="h-4 w-4 text-[var(--navy)]" />
                                    Mon tableau de bord
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="py-2.5">
                                <Link href="/profil" className="flex items-center gap-2 cursor-pointer">
                                    <User className="h-4 w-4 text-[var(--navy)]" />
                                    Mon profil
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 py-2.5"
                            >
                                <LogOut className="h-4 w-4" />
                                Déconnexion
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Link
                        href="/login"
                        className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-dark)] text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        Connexion
                    </Link>
                )}

                {/* Mobile Menu Button */}
                <button className="md:hidden p-2 text-[var(--navy)]">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>
        </header>
    );
}

export default HomeHeader;
