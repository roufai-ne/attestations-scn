import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 heures
    },
})
