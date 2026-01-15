import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/demandes/[id] - Détail d'une demande
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
        }

        const { id } = await params
        const demande = await prisma.demande.findUnique({
            where: { id },
            include: {
                appele: true,
                pieces: true,
                agent: {
                    select: {
                        nom: true,
                        prenom: true,
                        email: true,
                    },
                },
                attestation: true,
                notifications: true,
            },
        })

        if (!demande) {
            return NextResponse.json(
                { error: "Demande non trouvée" },
                { status: 404 }
            )
        }

        return NextResponse.json(demande)
    } catch (error) {
        console.error("Erreur récupération demande:", error)
        return NextResponse.json(
            { error: "Erreur lors de la récupération de la demande" },
            { status: 500 }
        )
    }
}
