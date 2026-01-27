/**
 * Instrumentation Next.js
 * Ce fichier s'exécute au démarrage du serveur (avant les requêtes)
 * Utilisé pour vérifier les variables d'environnement critiques
 */

export async function register() {
    // Uniquement côté serveur (pas edge)
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { checkEnvironmentVariables, checkProductionSecurity } = await import(
            '@/lib/config/env-check'
        );

        try {
            // Vérifier les variables d'environnement requises
            checkEnvironmentVariables();

            // En production, vérifier la sécurité
            if (process.env.NODE_ENV === 'production') {
                const isSecure = checkProductionSecurity();
                if (!isSecure) {
                    console.error(
                        '\n🚨 ATTENTION: Configuration de sécurité non valide pour la production!\n'
                    );
                }
            }

            console.log('✅ Instrumentation terminée avec succès');
        } catch (error) {
            console.error('\n🚨 ERREUR LORS DE L\'INITIALISATION:\n');
            console.error(error instanceof Error ? error.message : error);
            console.error('\n');

            // En production, empêcher le démarrage
            if (process.env.NODE_ENV === 'production') {
                process.exit(1);
            }
        }
    }
}
