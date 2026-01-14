import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Role } from "@prisma/client"

export default async function AgentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    // Vérifier que l'utilisateur est connecté
    if (!session?.user) {
        redirect("/login")
    }

    // Vérifier que l'utilisateur a le rôle AGENT ou ADMIN
    if (session.user.role !== Role.AGENT && session.user.role !== Role.ADMIN) {
        redirect("/")
    }

    return <>{children}</>
}
