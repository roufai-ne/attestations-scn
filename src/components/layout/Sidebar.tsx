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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
    title: string;
    href: string;
    icon: any;
    roles?: string[];
}

const navItems: NavItem[] = [
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
        title: 'Dashboard Directeur',
        href: '/directeur/dashboard',
        icon: BarChart3,
        roles: ['DIRECTEUR'],
    },
    {
        title: 'Signature',
        href: '/directeur/profil/signature',
        icon: FileSignature,
        roles: ['DIRECTEUR'],
    },
    {
        title: 'Gestion Arrêtés',
        href: '/admin/arretes',
        icon: FolderOpen,
        roles: ['ADMIN'],
    },
    {
        title: 'Utilisateurs',
        href: '/admin/users',
        icon: Users,
        roles: ['ADMIN'],
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [collapsed, setCollapsed] = useState(false);

    if (!session) return null;

    const userRole = session.user.role;
    const filteredNavItems = navItems.filter(
        (item) => !item.roles || item.roles.includes(userRole)
    );

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
            >
                {collapsed ? <Menu className="h-6 w-6" /> : <X className="h-6 w-6" />}
            </button>

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-0 z-40 h-screen bg-white border-r transition-transform duration-300',
                    collapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'w-64',
                    'lg:translate-x-0'
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-lg">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            {!collapsed && (
                                <div>
                                    <h1 className="font-bold text-lg">SCN</h1>
                                    <p className="text-xs text-gray-500">Service Civique</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {filteredNavItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname.startsWith(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                                        isActive
                                            ? 'bg-blue-50 text-blue-600 font-medium'
                                            : 'text-gray-700 hover:bg-gray-100',
                                        collapsed && 'justify-center'
                                    )}
                                    title={collapsed ? item.title : undefined}
                                >
                                    <Icon className="h-5 w-5 flex-shrink-0" />
                                    {!collapsed && <span>{item.title}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t">
                        <div className={cn('space-y-2', collapsed && 'flex flex-col items-center')}>
                            {!collapsed && (
                                <div className="px-4 py-2">
                                    <p className="text-sm font-medium">{session.user.name}</p>
                                    <p className="text-xs text-gray-500">{session.user.email}</p>
                                    <p className="text-xs text-blue-600 mt-1">{userRole}</p>
                                </div>
                            )}

                            <button
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full',
                                    collapsed && 'justify-center'
                                )}
                                title={collapsed ? 'Déconnexion' : undefined}
                            >
                                <LogOut className="h-5 w-5" />
                                {!collapsed && <span>Déconnexion</span>}
                            </button>
                        </div>
                    </div>

                    {/* Collapse toggle (desktop) */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden lg:flex items-center justify-center p-4 border-t hover:bg-gray-50"
                    >
                        {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
                    </button>
                </div>
            </aside>

            {/* Mobile overlay */}
            {!collapsed && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setCollapsed(true)}
                />
            )}
        </>
    );
}
