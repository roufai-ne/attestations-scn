import { hash, compare } from "bcryptjs"
import { randomInt } from "crypto"

const SALT_ROUNDS = 10

/**
 * Hash un mot de passe avec bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return hash(password, SALT_ROUNDS)
}

/**
 * Vérifie un mot de passe contre son hash
 */
export async function verifyPassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return compare(password, hashedPassword)
}

/**
 * Génère un mot de passe temporaire aléatoire (cryptographiquement sécurisé)
 */
export function generateTemporaryPassword(length: number = 12): string {
    const charset =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < length; i++) {
        password += charset.charAt(randomInt(0, charset.length))
    }
    return password
}
