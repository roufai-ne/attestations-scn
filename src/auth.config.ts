import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { verifyHCaptchaToken } from "@/lib/security/turnstile.service"

// Nombre maximum de tentatives avant verrouillage
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 30 * 60 * 1000 // 30 minutes

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith("/saisie") ||
                nextUrl.pathname.startsWith("/agent") ||
                nextUrl.pathname.startsWith("/directeur") ||
                nextUrl.pathname.startsWith("/admin")

            if (isOnDashboard) {
                if (isLoggedIn) return true
                return false // Redirect unauthenticated users to login page
            }
            return true
        },
        async jwt({ token, user, trigger }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.nom = user.nom
                token.prenom = user.prenom
            }
            // Actualiser les infos utilisateur à chaque refresh
            if (trigger === "update" && token.id) {
                const freshUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { nom: true, prenom: true, role: true, actif: true }
                })
                if (freshUser && freshUser.actif) {
                    token.nom = freshUser.nom
                    token.prenom = freshUser.prenom
                    token.role = freshUser.role
                }
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as any
                session.user.nom = token.nom as string
                session.user.prenom = token.prenom as string
            }
            return session
        },
    },
    providers: [
        Credentials({
            async authorize(credentials, request) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                // Vérifier le token hCaptcha
                const hcaptchaToken = credentials.hcaptchaToken as string | undefined;
                if (hcaptchaToken) {
                    const hcaptchaResult = await verifyHCaptchaToken(hcaptchaToken);
                    if (!hcaptchaResult.success) {
                        console.log(`[AUTH] Vérification CAPTCHA échouée: ${hcaptchaResult.error}`);
                        return null;
                    }
                } else {
                    // En production, refuser si pas de token CAPTCHA
                    if (process.env.NODE_ENV === 'production') {
                        console.log('[AUTH] Token CAPTCHA manquant en production');
                        return null;
                    }
                }

                const email = credentials.email as string

                const user = await prisma.user.findUnique({
                    where: { email },
                })

                if (!user) {
                    // Log tentative échouée (utilisateur inexistant)
                    console.log(`[AUTH] Tentative de connexion échouée - email inconnu: ${email}`)
                    return null
                }

                // Vérifier si le compte est actif
                if (!user.actif) {
                    console.log(`[AUTH] Compte désactivé: ${email}`)
                    return null
                }

                // Vérifier si le compte est verrouillé
                if (user.lockoutUntil && user.lockoutUntil > new Date()) {
                    const minutesLeft = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000)
                    console.log(`[AUTH] Compte verrouillé: ${email} - ${minutesLeft} min restantes`)
                    return null
                }

                // Vérifier le mot de passe
                const isPasswordValid = await compare(
                    credentials.password as string,
                    user.password
                )

                if (!isPasswordValid) {
                    // Incrémenter les tentatives échouées
                    const newAttempts = (user.failedLoginAttempts || 0) + 1

                    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
                        // Verrouiller le compte
                        await prisma.user.update({
                            where: { id: user.id },
                            data: {
                                failedLoginAttempts: newAttempts,
                                lockoutUntil: new Date(Date.now() + LOCKOUT_DURATION_MS),
                            },
                        })
                        console.log(`[AUTH] Compte verrouillé après ${MAX_LOGIN_ATTEMPTS} tentatives: ${email}`)
                    } else {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { failedLoginAttempts: newAttempts },
                        })
                        console.log(`[AUTH] Tentative échouée ${newAttempts}/${MAX_LOGIN_ATTEMPTS}: ${email}`)
                    }

                    return null
                }

                // Connexion réussie - réinitialiser les tentatives et mettre à jour dernière connexion
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        failedLoginAttempts: 0,
                        lockoutUntil: null,
                        derniereConnexion: new Date(),
                    },
                })

                console.log(`[AUTH] Connexion réussie: ${email}`)

                return {
                    id: user.id,
                    email: user.email,
                    nom: user.nom,
                    prenom: user.prenom,
                    role: user.role,
                }
            },
        }),
    ],
} satisfies NextAuthConfig

