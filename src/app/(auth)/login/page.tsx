import LoginForm from "@/components/auth/LoginForm"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function LoginPage() {
    const session = await auth()

    // Si déjà connecté, rediriger selon le rôle
    if (session?.user) {
        switch (session.user.role) {
            case "SAISIE":
                redirect("/saisie/dashboard")
            case "AGENT":
                redirect("/agent/dashboard")
            case "DIRECTEUR":
                redirect("/directeur/dashboard")
            case "ADMIN":
                redirect("/admin/dashboard")
            default:
                redirect("/")
        }
    }

    return (
        <AuthLayout
            title="Bienvenue"
            subtitle="Connectez-vous à votre espace sécurisé"
        >
            <LoginForm />
        </AuthLayout>
    )
}
