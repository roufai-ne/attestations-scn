import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { StatutDemande } from "@prisma/client"

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

// PATCH /api/demandes/[id] - Modifier le statut d'une demande
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()

        if (!session?.user || !['AGENT', 'ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
        }

        const { id } = await params
        const body = await request.json()
        const { statut: statutInput, commentaire } = body

        // Mapping des statuts frontend vers Prisma
        const statutMapping: Record<string, StatutDemande> = {
            'SOUMISE': StatutDemande.ENREGISTREE,
            'EN_COURS': StatutDemande.EN_TRAITEMENT,
            'VALIDEE': StatutDemande.VALIDEE,
            'REJETEE': StatutDemande.REJETEE,
            'EN_ATTENTE_SIGNATURE': StatutDemande.EN_ATTENTE_SIGNATURE,
            'SIGNEE': StatutDemande.SIGNEE,
            // Valeurs directes de l'enum Prisma
            'ENREGISTREE': StatutDemande.ENREGISTREE,
            'EN_TRAITEMENT': StatutDemande.EN_TRAITEMENT,
            'PIECES_NON_CONFORMES': StatutDemande.PIECES_NON_CONFORMES,
            'DELIVREE': StatutDemande.DELIVREE,
        }

        const statut = statutMapping[statutInput]
        if (!statut) {
            return NextResponse.json(
                { error: "Statut invalide" },
                { status: 400 }
            )
        }

        // Récupérer la demande
        const demande = await prisma.demande.findUnique({
            where: { id },
            include: { attestation: true },
        })

        if (!demande) {
            return NextResponse.json(
                { error: "Demande non trouvée" },
                { status: 404 }
            )
        }

        // Si on passe à un statut avant attestation et qu'une attestation existe, la supprimer
        const statutsAvantAttestation = new Set<StatutDemande>([
            StatutDemande.ENREGISTREE,
            StatutDemande.EN_TRAITEMENT,
            StatutDemande.VALIDEE,
            StatutDemande.REJETEE
        ]);
        if (statutsAvantAttestation.has(statut) && demande.attestation) {
            // Supprimer l'attestation
            await prisma.attestation.delete({
                where: { id: demande.attestation.id },
            })
        }

        // Mettre à jour le statut
        const updated = await prisma.demande.update({
            where: { id },
            data: {
                statut: statut,
                ...(statut === StatutDemande.REJETEE ? { motifRejet: commentaire } : {}),
            },
        })

        // Logger le changement de statut
        await prisma.historiqueStatut.create({
            data: {
                demandeId: id,
                statut: statut,
                commentaire: commentaire || `Statut modifié en ${statut}`,
                modifiePar: session.user.id,
            },
        })

        return NextResponse.json({
            success: true,
            message: `Statut modifié en ${statut}`,
            demande: updated,
        })
    } catch (error) {
        console.error("Erreur modification statut:", error)
        return NextResponse.json(
            { error: "Erreur lors de la modification du statut" },
            { status: 500 }
        )
    }
}
