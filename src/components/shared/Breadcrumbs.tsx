'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items?: BreadcrumbItem[];
    homeLabel?: string;
}

/**
 * Génère automatiquement les breadcrumbs à partir du chemin URL
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
    const segments = pathname.split('/').filter(Boolean);

    // Mapping des segments vers des labels lisibles
    const labelMap: Record<string, string> = {
        // Rôles/sections principales
        'agent': 'Agent',
        'directeur': 'Directeur',
        'admin': 'Administration',
        'saisie': 'Saisie',
        // Pages principales
        'dashboard': 'Tableau de bord',
        'demandes': 'Demandes',
        'attestations': 'Attestations',
        'arretes': 'Arrêtés',
        'utilisateurs': 'Utilisateurs',
        'rapports': 'Rapports',
        'audit': 'Journal d\'audit',
        'templates': 'Templates',
        'configuration': 'Configuration',
        'notifications': 'Notifications',
        'assets': 'Ressources',
        // Actions
        'nouvelle': 'Nouvelle demande',
        'nouvelle-demande': 'Nouvelle demande',
        'modifier': 'Modifier',
        'edit': 'Modifier',
        'signature': 'Signature',
        'changer-pin': 'Changer PIN',
        'securite-2fa': 'Sécurité 2FA',
        // Profil et paramètres
        'profil': 'Mon profil',
        'parametres': 'Paramètres',
        'stats': 'Statistiques',
    };

    // Mapping pour rediriger les sections vers leur dashboard
    const dashboardRedirect: Record<string, string> = {
        'agent': '/agent/dashboard',
        'directeur': '/directeur/dashboard',
        'admin': '/admin/dashboard',
        'saisie': '/saisie/dashboard',
    };

    const breadcrumbs: BreadcrumbItem[] = [];
    let currentPath = '';

    segments.forEach((segment, index) => {
        currentPath += `/${segment}`;

        // Ne pas inclure les IDs dynamiques comme breadcrumb cliquable
        const isId = /^[a-zA-Z0-9]{20,}$/.test(segment) || /^\d+$/.test(segment) || segment.startsWith('cm');

        if (isId) {
            // Pour les IDs, on affiche "Détails" sans lien
            breadcrumbs.push({ label: 'Détails' });
        } else {
            // Si c'est une section racine (admin, agent, etc.), rediriger vers le dashboard
            const href = index === 0 && dashboardRedirect[segment] 
                ? dashboardRedirect[segment]
                : (index < segments.length - 1 ? currentPath : undefined);

            breadcrumbs.push({
                label: labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
                href: href,
            });
        }
    });

    return breadcrumbs;
}

/**
 * Composant Breadcrumbs
 * Affiche le fil d'Ariane pour la navigation
 */
export function Breadcrumbs({ items, homeLabel = 'Accueil' }: BreadcrumbsProps) {
    const pathname = usePathname();

    // Utiliser les items fournis ou générer automatiquement
    const breadcrumbItems = items || generateBreadcrumbs(pathname);

    if (breadcrumbItems.length === 0) return null;

    return (
        <nav aria-label="Fil d'Ariane" className="mb-4">
            <ol className="flex items-center flex-wrap gap-1 text-sm text-gray-500">
                {/* Home */}
                <li>
                    <Link
                        href="/"
                        className="flex items-center hover:text-gray-700 transition-colors"
                    >
                        <Home className="h-4 w-4" />
                        <span className="sr-only">{homeLabel}</span>
                    </Link>
                </li>

                {breadcrumbItems.map((item, index) => (
                    <li key={index} className="flex items-center">
                        <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
                        {item.href ? (
                            <Link
                                href={item.href}
                                className="hover:text-gray-700 transition-colors"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className="text-gray-900 font-medium">{item.label}</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}

export default Breadcrumbs;
