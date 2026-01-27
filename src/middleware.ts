import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes API publiques (ne nécessitent pas d'authentification)
const PUBLIC_API_ROUTES = [
    "/api/auth",
    "/api/health",
    "/api/verifier",
    "/api/admin/assets", // Configuration publique des assets (logo, hero)
    "/api/uploads", // Fichiers uploadés (templates, attestations, etc.)
]

// Mapping des routes API par rôle
const API_ROLE_ROUTES: Record<string, string[]> = {
    ADMIN: ["/api/admin"],
    DIRECTEUR: ["/api/directeur"],
    AGENT: ["/api/agent", "/api/demandes", "/api/attestations"],
    SAISIE: ["/api/saisie", "/api/demandes", "/api/arretes/search"],
}

export default auth((req) => {
    const { nextUrl } = req
    const isLoggedIn = !!req.auth
    const userRole = req.auth?.user?.role

    // ==========================================
    // Protection des routes API
    // ==========================================
    if (nextUrl.pathname.startsWith("/api")) {
        // Routes API publiques
        const isPublicApi = PUBLIC_API_ROUTES.some(route =>
            nextUrl.pathname.startsWith(route)
        )
        if (isPublicApi) {
            return NextResponse.next()
        }

        // Vérifier l'authentification pour les routes API protégées
        if (!isLoggedIn) {
            return NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 }
            )
        }

        // Vérifier les permissions par rôle pour les routes API
        const isAdminRoute = nextUrl.pathname.startsWith("/api/admin")
        const isDirecteurRoute = nextUrl.pathname.startsWith("/api/directeur")
        const isAgentRoute = nextUrl.pathname.startsWith("/api/agent")
        const isSaisieRoute = nextUrl.pathname.startsWith("/api/saisie")

        // Admin a accès à tout
        if (userRole === "ADMIN") {
            return NextResponse.next()
        }

        // Routes admin - réservées aux admins
        if (isAdminRoute) {
            return NextResponse.json(
                { error: "Accès refusé" },
                { status: 403 }
            )
        }

        // Routes directeur
        if (isDirecteurRoute && userRole !== "DIRECTEUR") {
            return NextResponse.json(
                { error: "Accès refusé" },
                { status: 403 }
            )
        }

        // Routes agent
        if (isAgentRoute && userRole !== "AGENT") {
            return NextResponse.json(
                { error: "Accès refusé" },
                { status: 403 }
            )
        }

        // Routes saisie
        if (isSaisieRoute && userRole !== "SAISIE") {
            return NextResponse.json(
                { error: "Accès refusé" },
                { status: 403 }
            )
        }

        return NextResponse.next()
    }

    // ==========================================
    // Protection des pages (routes non-API)
    // ==========================================
    const isPublicPath =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/verifier") ||
        nextUrl.pathname.startsWith("/forgot-password") ||
        nextUrl.pathname.startsWith("/reset-password") ||
        nextUrl.pathname === "/"

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

    // Vérifier les permissions par rôle pour les pages
    if (isLoggedIn && req.auth?.user) {
        const { pathname } = nextUrl

        // Routes agent de saisie
        if (pathname.startsWith("/saisie")) {
            if (userRole !== "SAISIE" && userRole !== "ADMIN") {
                return NextResponse.redirect(new URL("/", nextUrl.origin))
            }
        }

        // Routes agent traitant
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
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - /uploads (public assets folder)
         * - Static assets (images, etc.)
         */
        "/((?!_next/static|_next/image|favicon.ico|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}
