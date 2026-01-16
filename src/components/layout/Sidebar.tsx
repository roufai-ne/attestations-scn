'use client';

import { useState } from 'react';
import Link from 'next/link';
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
        title: 'Configuration',
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
        title: 'Config Attestation',
        href: '/admin/configuration/attestation',
        icon: FileSignature,
        roles: ['ADMIN'],
    },
    {
        title: 'Templates',
        href: '/admin/templates',
        icon: FileText,
        roles: ['ADMIN'],
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    if (!session) return null;

    const userRole = session.user.role;
    const filteredNavItems = navItems.filter(
        (item) => !item.roles || item.roles.includes(userRole)
    );

    const handleSignOut = () => {
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
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
                    'fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out',
                    collapsed ? 'w-20' : 'w-72',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2.5 bg-gradient-to-br from-green-600 to-orange-600 rounded-xl flex-shrink-0 shadow-lg">
                                    <Shield className="h-6 w-6 text-white" />
                                </div>
                                {!collapsed && (
                                    <div className="min-w-0">
                                        <h1 className="font-bold text-lg text-gray-900 truncate">SCN</h1>
                                        <p className="text-xs text-gray-500 truncate">Service Civique</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* User info card */}
                    {!collapsed && (
                        <div className="p-4 m-4 bg-gradient-to-br from-green-50 via-white to-orange-50 rounded-xl border border-green-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <User className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {session.user.nom} {session.user.prenom}
                                    </p>
                                    <p className="text-xs text-gray-600 truncate">{session.user.email}</p>
                                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-green-600 text-white rounded-full">
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
                                            ? 'bg-gradient-to-r from-green-600 to-orange-600 text-white shadow-lg shadow-green-500/30'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
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
                    <div className="p-4 border-t border-gray-200 space-y-2">
                        {/* Logout button */}
                        <button
                            onClick={handleSignOut}
                            className={cn(
                                'group flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 w-full',
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
                            className="hidden lg:flex items-center justify-center w-full px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors"
                            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            <ChevronLeft className={cn(
                                'h-5 w-5 text-gray-600 transition-transform duration-300',
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

