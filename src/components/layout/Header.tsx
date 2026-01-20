'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import { Bell, Search, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { useConfirm } from '@/components/shared/ConfirmProvider';
import Link from 'next/link';

export function Header() {
    const { data: session } = useSession();
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const confirm = useConfirm();

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

    if (!session) return null;

    const handleSignOut = async () => {
        const confirmed = await confirm({
            title: 'Déconnexion',
            description: 'Êtes-vous sûr de vouloir vous déconnecter ?',
            confirmText: 'Se déconnecter',
            cancelText: 'Annuler',
        });
        if (confirmed) {
            signOut({ callbackUrl: '/login' });
        }
    };

    // Générer les initiales de l'utilisateur
    const getInitials = () => {
        const nom = session.user.nom || '';
        const prenom = session.user.prenom || '';
        return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
    };

    // Déterminer l'URL du profil selon le rôle
    const getProfileUrl = () => {
        switch (session.user.role) {
            case 'DIRECTEUR':
                return '/directeur/profil/signature';
            case 'ADMIN':
            case 'AGENT':
            case 'SAISIE':
            default:
                return '/profil';
        }
    };

    return (
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-3">
                {/* Search - masqué sur mobile */}
                <div className="hidden md:flex flex-1 max-w-md">
                    <GlobalSearch />
                </div>

                {/* Spacer mobile */}
                <div className="md:hidden flex-1" />

                {/* Right section */}
                <div className="flex items-center gap-3">
                    {/* Mobile search button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                    >
                        <Search className="h-5 w-5" />
                    </Button>

                    {/* Notifications */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative hover:bg-gray-100"
                            >
                                <Bell className="h-5 w-5 text-[var(--text-dark)]" />
                                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-dark)]">
                                    3
                                </Badge>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="max-h-96 overflow-y-auto">
                                <DropdownMenuItem className="flex flex-col items-start p-3 cursor-pointer">
                                    <p className="text-sm font-medium">Nouvelle demande</p>
                                    <p className="text-xs text-[var(--text-muted)]">Il y a 2 heures</p>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex flex-col items-start p-3 cursor-pointer">
                                    <p className="text-sm font-medium">Attestation signée</p>
                                    <p className="text-xs text-[var(--text-muted)]">Il y a 5 heures</p>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex flex-col items-start p-3 cursor-pointer">
                                    <p className="text-sm font-medium">Demande validée</p>
                                    <p className="text-xs text-[var(--text-muted)]">Hier</p>
                                </DropdownMenuItem>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="justify-center text-[var(--accent-orange)] font-medium cursor-pointer">
                                Voir toutes les notifications
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* User menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex items-center gap-2 hover:bg-gray-100 h-auto py-2 px-3"
                            >
                                <Avatar className="h-9 w-9 ring-2 ring-[var(--accent-orange)]/20">
                                    <AvatarFallback className="bg-[var(--navy)] text-white font-semibold text-sm">
                                        {getInitials()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium leading-none text-[var(--text-dark)]">
                                        {session.user.prenom} {session.user.nom}
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                        {session.user.role}
                                    </p>
                                </div>
                                <ChevronDown className="h-4 w-4 text-[var(--text-muted)] hidden md:block" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium text-[var(--text-dark)]">
                                        {session.user.prenom} {session.user.nom}
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        {session.user.email}
                                    </p>
                                    <Badge variant="outline" className="w-fit text-xs border-[var(--accent-green)] text-[var(--accent-green)]">
                                        {session.user.role}
                                    </Badge>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={getProfileUrl()} className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    Mon profil
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/parametres" className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Paramètres
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleSignOut}
                                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Déconnexion
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
