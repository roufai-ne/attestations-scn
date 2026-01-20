'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
    Home,
    FileText,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    FileSignature,
    BarChart3,
    FolderOpen,
    Shield,
    ChevronLeft,
    User,
    Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConfirm } from '@/components/shared/ConfirmProvider';

interface NavItem {
    title: string;
    href: string;
    icon: any;
    roles?: string[];
    badge?: number;
}

const navItems: NavItem[] = [
    // Agent de saisie
    {
        title: 'Tableau de bord',
        href: '/saisie/dashboard',
        icon: Home,
        roles: ['SAISIE'],
    },
    {
        title: 'Nouvelle demande',
        href: '/saisie/demandes/nouvelle',
        icon: FileText,
        roles: ['SAISIE'],
    },
    {
        title: 'Mes demandes',
        href: '/saisie/demandes',
        icon: FolderOpen,
        roles: ['SAISIE'],
    },
    // Agent traitant
    {
        title: 'Tableau de bord',
        href: '/agent/dashboard',
        icon: Home,
        roles: ['AGENT'],
    },
    {
        title: 'Demandes',
        href: '/agent/demandes',
        icon: FileText,
        roles: ['AGENT'],
    },
    {
        title: 'Attestations',
        href: '/agent/attestations',
        icon: FileSignature,
        roles: ['AGENT'],
    },
    {
        title: 'Dashboard',
        href: '/directeur/dashboard',
        icon: BarChart3,
        roles: ['DIRECTEUR'],
    },
    {
        title: 'Attestations',
        href: '/directeur/attestations',
        icon: FileSignature,
        roles: ['DIRECTEUR'],
    },
    {
        title: 'Ma Signature',
        href: '/directeur/profil/signature',
        icon: Settings,
        roles: ['DIRECTEUR'],
    },
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: Home,
        roles: ['ADMIN'],
    },
    {
        title: 'Gestion Arrêtés',
        href: '/admin/arretes',
        icon: FolderOpen,
        roles: ['ADMIN'],
    },
    {
        title: 'Utilisateurs',
        href: '/admin/utilisateurs',
        icon: Users,
        roles: ['ADMIN'],
    },
    {
        title: 'Rapports',
        href: '/admin/rapports',
        icon: BarChart3,
        roles: ['ADMIN'],
    },
    {
        title: 'Audit',
        href: '/admin/audit',
        icon: Shield,
        roles: ['ADMIN'],
    },
    {
        title: 'Notifications',
        href: '/admin/configuration/notifications',
        icon: Bell,
        roles: ['ADMIN'],
    },
    {
        title: 'Templates Attestation',
        href: '/admin/templates',
        icon: FileSignature,
        roles: ['ADMIN'],
    },
    {
        title: 'Assets Site',
        href: '/admin/configuration/assets',
        icon: FileText,
        roles: ['ADMIN'],
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
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

    const userRole = session.user.role;
    const filteredNavItems = navItems.filter(
        (item) => !item.roles || item.roles.includes(userRole)
    );

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

    return (
        <>
            {/* Mobile toggle button */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                aria-label="Toggle menu"
            >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-0 z-40 h-screen bg-[var(--navy)] transition-all duration-300 ease-in-out shadow-xl',
                    collapsed ? 'w-20' : 'w-72',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b border-white/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                {logoUrl ? (
                                    <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-white flex-shrink-0">
                                        <Image
                                            src={logoUrl}
                                            alt="Logo SCN"
                                            fill
                                            className="object-contain p-1"
                                        />
                                    </div>
                                ) : (
                                    <div className="p-2 bg-[var(--accent-orange)] rounded-xl flex-shrink-0 shadow-lg">
                                        <Shield className="h-6 w-6 text-white" />
                                    </div>
                                )}
                                {!collapsed && (
                                    <div className="min-w-0">
                                        <h1 className="font-bold text-lg text-white truncate">SCN</h1>
                                        <p className="text-xs text-white/60 truncate">Service Civique</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* User info card */}
                    {!collapsed && (
                        <div className="p-4 m-4 bg-white/10 rounded-xl border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[var(--accent-orange)] rounded-lg shadow-sm">
                                    <User className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">
                                        {session.user.nom} {session.user.prenom}
                                    </p>
                                    <p className="text-xs text-white/60 truncate">{session.user.email}</p>
                                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-[var(--accent-green)] text-white rounded-full">
                                        {userRole}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {filteredNavItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname.startsWith(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        'group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                                        isActive
                                            ? 'bg-[var(--accent-orange)] text-white shadow-lg'
                                            : 'text-white/70 hover:bg-white/10 hover:text-white',
                                        collapsed && 'justify-center'
                                    )}
                                    title={collapsed ? item.title : undefined}
                                >
                                    <Icon className={cn(
                                        'h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110',
                                        isActive && 'drop-shadow-sm'
                                    )} />
                                    {!collapsed && (
                                        <span className="flex-1 font-medium">{item.title}</span>
                                    )}
                                    {!collapsed && item.badge && (
                                        <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer section */}
                    <div className="p-4 border-t border-white/10 space-y-2">
                        {/* Logout button */}
                        <button
                            onClick={handleSignOut}
                            className={cn(
                                'group flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 w-full',
                                collapsed && 'justify-center'
                            )}
                            title={collapsed ? 'Déconnexion' : undefined}
                        >
                            <LogOut className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                            {!collapsed && <span className="font-medium">Déconnexion</span>}
                        </button>

                        {/* Collapse toggle (desktop only) */}
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="hidden lg:flex items-center justify-center w-full px-4 py-3 rounded-xl hover:bg-white/10 transition-colors"
                            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            <ChevronLeft className={cn(
                                'h-5 w-5 text-white/60 transition-transform duration-300',
                                collapsed && 'rotate-180'
                            )} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity"
                    onClick={() => setMobileOpen(false)}
                />
            )}
        </>
    );
}
