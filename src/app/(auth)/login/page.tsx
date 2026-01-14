import LoginForm from "@/components/auth/LoginForm"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function LoginPage() {
    const session = await auth()

    // Si déjà connecté, rediriger selon le rôle
    if (session?.user) {
        switch (session.user.role) {
            case "AGENT":
                redirect("/agent")
            case "DIRECTEUR":
                redirect("/directeur")
            case "ADMIN":
                redirect("/admin")
            default:
                redirect("/")
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Service Civique National
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Gestion des Attestations
                    </p>
                </div>
                <LoginForm />
            </div>
        </div>
    )
}
