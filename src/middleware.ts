import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default auth((req) => {
    const { nextUrl } = req
    const isLoggedIn = !!req.auth

    const isPublicPath =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/verifier") ||
        nextUrl.pathname.startsWith("/api/verify") ||
        nextUrl.pathname.startsWith("/api/auth")

    // Permettre les routes publiques
    if (isPublicPath) {
        return NextResponse.next()
    }

    // Rediriger vers login si pas connecté
    if (!isLoggedIn && !isPublicPath) {
        const loginUrl = new URL("/login", nextUrl.origin)
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Vérifier les permissions par rôle
    if (isLoggedIn && req.auth?.user) {
        const { pathname } = nextUrl
        const userRole = req.auth.user.role

        // Routes agent
        if (pathname.startsWith("/agent")) {
            if (userRole !== "AGENT" && userRole !== "ADMIN") {
                return NextResponse.redirect(new URL("/", nextUrl.origin))
            }
        }

        // Routes directeur
        if (pathname.startsWith("/directeur")) {
            if (userRole !== "DIRECTEUR" && userRole !== "ADMIN") {
                return NextResponse.redirect(new URL("/", nextUrl.origin))
            }
        }

        // Routes admin
        if (pathname.startsWith("/admin")) {
            if (userRole !== "ADMIN") {
                return NextResponse.redirect(new URL("/", nextUrl.origin))
            }
        }
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}
