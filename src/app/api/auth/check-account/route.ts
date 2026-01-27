/**
 * API Route - Vérification de l'état du compte avant connexion
 * POST /api/auth/check-account
 *
 * Permet de donner des messages d'erreur plus précis à l'utilisateur
 * sans révéler d'informations sensibles aux attaquants
 *
 * NOTE: Le CAPTCHA n'est PAS vérifié ici car il sera vérifié par NextAuth
 * et un token hCaptcha ne peut être utilisé qu'une seule fois.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Validation des champs requis
        if (!email || !password) {
            return NextResponse.json({
                success: false,
                code: 'MISSING_FIELDS',
                message: 'Email et mot de passe requis',
            }, { status: 400 });
        }

        // Rechercher l'utilisateur
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: {
                id: true,
                password: true,
                actif: true,
                lockoutUntil: true,
                failedLoginAttempts: true,
            },
        });

        // Utilisateur non trouvé - message générique pour sécurité
        if (!user) {
            return NextResponse.json({
                success: false,
                code: 'INVALID_CREDENTIALS',
                message: 'Email ou mot de passe incorrect',
            }, { status: 401 });
        }

        // Compte désactivé
        if (!user.actif) {
            return NextResponse.json({
                success: false,
                code: 'ACCOUNT_DISABLED',
                message: 'Votre compte a été désactivé. Contactez l\'administrateur.',
            }, { status: 403 });
        }

        // Compte verrouillé
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
            return NextResponse.json({
                success: false,
                code: 'ACCOUNT_LOCKED',
                message: `Compte temporairement verrouillé. Réessayez dans ${minutesLeft} minute(s).`,
                minutesLeft,
            }, { status: 403 });
        }

        // Vérifier le mot de passe
        const isPasswordValid = await compare(password, user.password);

        if (!isPasswordValid) {
            // Incrémenter les tentatives échouées
            const newAttempts = (user.failedLoginAttempts || 0) + 1;
            const attemptsLeft = MAX_LOGIN_ATTEMPTS - newAttempts;

            if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
                // Verrouiller le compte
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        failedLoginAttempts: newAttempts,
                        lockoutUntil: new Date(Date.now() + LOCKOUT_DURATION_MS),
                    },
                });

                return NextResponse.json({
                    success: false,
                    code: 'ACCOUNT_LOCKED',
                    message: 'Trop de tentatives échouées. Compte verrouillé pour 30 minutes.',
                    minutesLeft: 30,
                }, { status: 403 });
            } else {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { failedLoginAttempts: newAttempts },
                });

                return NextResponse.json({
                    success: false,
                    code: 'INVALID_CREDENTIALS',
                    message: `Mot de passe incorrect. ${attemptsLeft} tentative(s) restante(s).`,
                    attemptsLeft,
                }, { status: 401 });
            }
        }

        // Mot de passe valide - ne pas réinitialiser ici, laissez NextAuth le faire
        return NextResponse.json({
            success: true,
            code: 'OK',
            message: 'Identifiants valides',
        });

    } catch (error) {
        console.error('[AUTH CHECK] Erreur:', error);
        return NextResponse.json({
            success: false,
            code: 'SERVER_ERROR',
            message: 'Erreur serveur. Veuillez réessayer.',
        }, { status: 500 });
    }
}
