/**
 * Utilitaires de sanitisation des entrées
 * Protection contre XSS et injections
 */

/**
 * Échappe les caractères HTML spéciaux
 */
export function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

/**
 * Supprime les balises HTML d'une chaîne
 */
export function stripHtml(text: string): string {
    return text.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize une chaîne pour usage sûr
 * - Supprime les balises HTML
 * - Limite la longueur
 * - Trim les espaces
 */
export function sanitizeString(text: string, maxLength: number = 1000): string {
    if (!text) return '';
    return stripHtml(text).trim().slice(0, maxLength);
}

/**
 * Valide et sanitize un numéro de téléphone
 */
export function sanitizePhone(phone: string): string {
    // Ne garde que les chiffres et le +
    return phone.replace(/[^\d+]/g, '').slice(0, 20);
}

/**
 * Valide et sanitize un email
 */
export function sanitizeEmail(email: string): string {
    // Lowercase et trim
    const cleaned = email.toLowerCase().trim().slice(0, 254);
    // Validation basique de format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(cleaned) ? cleaned : '';
}

/**
 * Sanitize un nom/prénom
 * N'autorise que lettres, espaces, tirets et apostrophes
 */
export function sanitizeName(name: string): string {
    if (!name) return '';
    return name
        .trim()
        .slice(0, 100)
        .replace(/[^a-zA-ZÀ-ÿ\s\-']/g, '');
}

/**
 * Sanitize un ID (CUID, UUID, etc.)
 * N'autorise que les caractères alphanumériques et tirets
 */
export function sanitizeId(id: string): string {
    if (!id) return '';
    return id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
}

/**
 * Valide qu'une valeur est dans une liste autorisée
 */
export function validateEnum<T extends string>(value: string, allowedValues: T[]): T | null {
    return allowedValues.includes(value as T) ? (value as T) : null;
}

/**
 * Sanitize un objet en appliquant une fonction à toutes les chaînes
 */
export function sanitizeObject<T extends Record<string, unknown>>(
    obj: T,
    sanitizer: (value: string) => string = sanitizeString
): T {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            result[key] = sanitizer(value);
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            result[key] = sanitizeObject(value as Record<string, unknown>, sanitizer);
        } else {
            result[key] = value;
        }
    }

    return result as T;
}

/**
 * Vérifie si une chaîne contient des caractères potentiellement dangereux
 */
export function hasDangerousChars(text: string): boolean {
    const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /data:/i,
        /vbscript:/i,
    ];
    return dangerousPatterns.some(pattern => pattern.test(text));
}

/**
 * Valide un chemin de fichier (pas de traversée de répertoire)
 */
export function isValidPath(path: string): boolean {
    const normalized = path.replace(/\\/g, '/');
    return !normalized.includes('..') && !normalized.includes('//');
}

/**
 * Sanitize un nom de fichier
 */
export function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/\.{2,}/g, '.')
        .slice(0, 255);
}

export const sanitize = {
    html: escapeHtml,
    stripHtml,
    string: sanitizeString,
    phone: sanitizePhone,
    email: sanitizeEmail,
    name: sanitizeName,
    id: sanitizeId,
    object: sanitizeObject,
    filename: sanitizeFilename,
    validateEnum,
    hasDangerousChars,
    isValidPath,
};
