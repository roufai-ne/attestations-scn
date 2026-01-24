/**
 * Vérification des variables d'environnement critiques au démarrage
 * Empêche le démarrage si des variables essentielles sont manquantes
 */

interface EnvVariable {
    name: string;
    required: boolean;
    description: string;
    isProduction?: boolean; // true = requis seulement en production
}

const ENV_VARIABLES: EnvVariable[] = [
    {
        name: 'DATABASE_URL',
        required: true,
        description: 'URL de connexion PostgreSQL',
    },
    {
        name: 'NEXTAUTH_SECRET',
        required: true,
        description: 'Clé secrète pour chiffrement et signatures (min 32 caractères)',
    },
    {
        name: 'NEXTAUTH_URL',
        required: true,
        description: 'URL de base de l\'application',
    },
    {
        name: 'QR_SECRET_KEY',
        required: true,
        description: 'Clé secrète pour signature HMAC des QR codes',
    },
    {
        name: 'NEXT_PUBLIC_HCAPTCHA_SITE_KEY',
        required: false,
        isProduction: true,
        description: 'Clé publique hCaptcha pour CAPTCHA (recommandé en production)',
    },
    {
        name: 'HCAPTCHA_SECRET_KEY',
        required: false,
        isProduction: true,
        description: 'Clé secrète hCaptcha pour vérification serveur',
    },
    {
        name: 'EMAIL_PROVIDER',
        required: false,
        description: 'Provider email: brevo ou smtp (défaut: smtp)',
    },
    {
        name: 'BREVO_API_KEY',
        required: false,
        description: 'Clé API Brevo (si EMAIL_PROVIDER=brevo)',
    },
    {
        name: 'BREVO_SENDER_EMAIL',
        required: false,
        description: 'Email expéditeur Brevo',
    },
    {
        name: 'BREVO_SMS_ENABLED',
        required: false,
        description: 'Activer les SMS Brevo (true/false)',
    },
    {
        name: 'SMTP_HOST',
        required: false,
        description: 'Hôte du serveur SMTP pour l\'envoi d\'emails (si EMAIL_PROVIDER=smtp)',
    },
    {
        name: 'SMTP_PORT',
        required: false,
        description: 'Port du serveur SMTP',
    },
    {
        name: 'SMTP_USER',
        required: false,
        description: 'Utilisateur SMTP',
    },
    {
        name: 'SMTP_PASS',
        required: false,
        description: 'Mot de passe SMTP',
    },
    {
        name: 'SMS_PROVIDER',
        required: false,
        description: 'Provider SMS (twilio ou generic)',
    },
    {
        name: 'REDIS_URL',
        required: false,
        isProduction: true,
        description: 'URL Redis pour rate limiting en production',
    },
];

class EnvironmentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EnvironmentError';
    }
}

/**
 * Vérifie la présence et la validité des variables d'environnement
 * @throws {EnvironmentError} Si une variable requise est manquante ou invalide
 */
export function checkEnvironmentVariables(): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const errors: string[] = [];
    const warnings: string[] = [];

    console.log('\n🔍 Vérification des variables d\'environnement...\n');

    for (const envVar of ENV_VARIABLES) {
        const value = process.env[envVar.name];
        const isRequired = envVar.required || (envVar.isProduction && isProduction);

        if (!value || value.trim() === '') {
            if (isRequired) {
                errors.push(
                    `❌ ${envVar.name}: MANQUANT (requis)\n   ${envVar.description}`
                );
            } else {
                warnings.push(
                    `⚠️  ${envVar.name}: Non défini (optionnel)\n   ${envVar.description}`
                );
            }
        } else {
            // Vérifications de sécurité spécifiques
            if (envVar.name === 'NEXTAUTH_SECRET') {
                if (value.length < 32) {
                    errors.push(
                        `❌ ${envVar.name}: Trop court (minimum 32 caractères)\n   Longueur actuelle: ${value.length} caractères`
                    );
                } else if (
                    value.includes('default') ||
                    value.includes('change-me') ||
                    value.includes('secret-key')
                ) {
                    errors.push(
                        `❌ ${envVar.name}: Valeur par défaut détectée\n   Générer une clé forte avec: openssl rand -base64 32`
                    );
                } else {
                    console.log(`✅ ${envVar.name}: Défini (${value.length} caractères)`);
                }
            } else if (envVar.name === 'QR_SECRET_KEY') {
                if (value.length < 32) {
                    errors.push(
                        `❌ ${envVar.name}: Trop court (minimum 32 caractères)\n   Longueur actuelle: ${value.length} caractères`
                    );
                } else if (
                    value.includes('default') ||
                    value.includes('secret') ||
                    value.includes('dev-only')
                ) {
                    errors.push(
                        `❌ ${envVar.name}: Valeur par défaut détectée\n   Générer une clé forte avec: openssl rand -hex 32`
                    );
                } else {
                    console.log(`✅ ${envVar.name}: Défini (${value.length} caractères)`);
                }
            } else if (envVar.name === 'DATABASE_URL') {
                if (!value.startsWith('postgresql://') && !value.startsWith('postgres://')) {
                    warnings.push(
                        `⚠️  ${envVar.name}: Format non standard (devrait commencer par postgresql://)`
                    );
                } else {
                    console.log(`✅ ${envVar.name}: Défini`);
                }
            } else {
                console.log(`✅ ${envVar.name}: Défini`);
            }
        }
    }

    // Afficher les warnings
    if (warnings.length > 0) {
        console.log('\n⚠️  AVERTISSEMENTS:\n');
        warnings.forEach(warning => console.log(warning + '\n'));
    }

    // Afficher les erreurs et lever une exception si nécessaire
    if (errors.length > 0) {
        console.error('\n🚨 ERREURS CRITIQUES:\n');
        errors.forEach(error => console.error(error + '\n'));
        console.error('\n💡 Consultez le fichier .env.example pour les valeurs requises\n');
        
        throw new EnvironmentError(
            `${errors.length} variable(s) d'environnement critique(s) manquante(s) ou invalide(s)`
        );
    }

    console.log('\n✅ Toutes les variables d\'environnement requises sont valides\n');
}

/**
 * Génère des secrets aléatoires pour le développement
 */
export function generateSecrets(): void {
    import('crypto').then((crypto) => {
        console.log('\n🔐 Secrets générés pour le développement:\n');
        console.log(`NEXTAUTH_SECRET="${crypto.randomBytes(32).toString('base64')}"`);
        console.log(`QR_SECRET_KEY="${crypto.randomBytes(32).toString('hex')}"`);
        console.log('\n⚠️  Ne JAMAIS utiliser ces valeurs en production!\n');
    });
}

/**
 * Vérifie si l'environnement est sécurisé pour la production
 */
export function checkProductionSecurity(): boolean {
    if (process.env.NODE_ENV !== 'production') {
        return true;
    }

    const securityIssues: string[] = [];

    // Vérifier HTTPS
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    if (nextAuthUrl && !nextAuthUrl.startsWith('https://')) {
        securityIssues.push('❌ NEXTAUTH_URL doit utiliser HTTPS en production');
    }

    // Vérifier que les secrets ne sont pas des valeurs de dev
    const devPatterns = ['dev', 'test', 'localhost', 'example', '123456'];
    const sensitiveVars = ['NEXTAUTH_SECRET', 'QR_SECRET_KEY', 'SMTP_PASS'];
    
    for (const varName of sensitiveVars) {
        const value = process.env[varName]?.toLowerCase() || '';
        if (devPatterns.some(pattern => value.includes(pattern))) {
            securityIssues.push(`❌ ${varName} contient une valeur de développement`);
        }
    }

    if (securityIssues.length > 0) {
        console.error('\n🚨 PROBLÈMES DE SÉCURITÉ EN PRODUCTION:\n');
        securityIssues.forEach(issue => console.error(issue));
        console.error('\n');
        return false;
    }

    console.log('🔒 Configuration de sécurité valide pour la production');
    return true;
}
