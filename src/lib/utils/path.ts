import path from 'path';

/**
 * Obtient la racine du projet, qu'on soit en mode dev ou standalone
 * En mode standalone, process.cwd() pointe vers .next/standalone
 * donc on remonte de 2 niveaux pour atteindre la vraie racine
 */
export function getProjectRoot(): string {
    const cwd = process.cwd();
    
    // Détecter si on est en mode standalone
    if (cwd.includes('.next/standalone') || cwd.includes('.next\\standalone')) {
        return path.resolve(cwd, '..', '..');
    }
    
    return cwd;
}

/**
 * Construit un chemin vers le dossier public en tenant compte du mode standalone
 */
export function getPublicPath(...segments: string[]): string {
    return path.join(getProjectRoot(), 'public', ...segments);
}

/**
 * Construit un chemin vers le dossier uploads en tenant compte du mode standalone
 */
export function getUploadsPath(...segments: string[]): string {
    return getPublicPath('uploads', ...segments);
}

/**
 * Obtient l'URL de base de l'application depuis les variables d'environnement
 * Priorise NEXTAUTH_URL, puis NEXT_PUBLIC_APP_URL, sinon localhost par défaut
 */
export function getBaseUrl(): string {
    // En production, utiliser NEXTAUTH_URL ou NEXT_PUBLIC_APP_URL
    const url = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
    
    if (url) {
        // Nettoyer l'URL (supprimer les / finaux)
        return url.replace(/\/$/, '');
    }
    
    // Fallback pour développement
    return 'http://localhost:3000';
}
