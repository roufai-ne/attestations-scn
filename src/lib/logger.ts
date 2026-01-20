/**
 * Logger conditionnel pour l'application
 * En production, seules les erreurs sont affichées
 * En développement, tous les logs sont affichés
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Couleurs pour les logs en console (désactivées en production)
const colors = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m',  // Green
    warn: '\x1b[33m',  // Yellow
    error: '\x1b[31m', // Red
    reset: '\x1b[0m',
};

// Préfixes pour chaque niveau
const prefixes = {
    debug: '🔍',
    info: '✅',
    warn: '⚠️',
    error: '❌',
};

/**
 * Logger principal de l'application
 */
export const logger = {
    /**
     * Logs de debug (désactivés en production et en test)
     */
    debug: (message: string, ...args: any[]) => {
        if (!isProduction && !isTest) {
            console.log(`${colors.debug}${prefixes.debug} [DEBUG]${colors.reset}`, message, ...args);
        }
    },

    /**
     * Logs d'information (désactivés en production)
     */
    info: (message: string, ...args: any[]) => {
        if (!isProduction) {
            console.log(`${colors.info}${prefixes.info} [INFO]${colors.reset}`, message, ...args);
        }
    },

    /**
     * Logs d'avertissement (toujours affichés)
     */
    warn: (message: string, ...args: any[]) => {
        console.warn(`${colors.warn}${prefixes.warn} [WARN]${colors.reset}`, message, ...args);
    },

    /**
     * Logs d'erreur (toujours affichés)
     */
    error: (message: string, ...args: any[]) => {
        console.error(`${colors.error}${prefixes.error} [ERROR]${colors.reset}`, message, ...args);
    },

    /**
     * Log avec niveau personnalisé
     */
    log: (level: LogLevel, message: string, ...args: any[]) => {
        switch (level) {
            case 'debug':
                logger.debug(message, ...args);
                break;
            case 'info':
                logger.info(message, ...args);
                break;
            case 'warn':
                logger.warn(message, ...args);
                break;
            case 'error':
                logger.error(message, ...args);
                break;
        }
    },

    /**
     * Log pour les services métier (info mais avec contexte)
     */
    service: (serviceName: string, message: string, ...args: any[]) => {
        if (!isProduction) {
            console.log(`${colors.info}📦 [${serviceName}]${colors.reset}`, message, ...args);
        }
    },

    /**
     * Log pour les opérations réseau (API, DB)
     */
    network: (operation: string, message: string, ...args: any[]) => {
        if (!isProduction) {
            console.log(`${colors.debug}📡 [${operation}]${colors.reset}`, message, ...args);
        }
    },
};

export default logger;
