import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    trustHost: process.env.AUTH_TRUST_HOST === 'true',
    session: {
        strategy: "jwt",
        maxAge: 8 * 60 * 60, // 8 heures - sécurité renforcée
    },
})
