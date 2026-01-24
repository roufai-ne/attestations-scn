import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { StatutDemande } from "@prisma/client"
import { z } from 'zod'

// Schéma de validation pour la mise à jour des données
const updateDemandeDataSchema = z.object({
    nom: z.string().min(1).optional(),
    prenom: z.string().min(1).optional(),
    dateNaissance: z.string().optional(),
    lieuNaissance: z.string().optional(),
    telephone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    promotion: z.string().optional(),
    observations: z.string().optional(),
});

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

// PUT /api/demandes/[id] - Modifier les données d'une demande
export async function PUT(
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

        // Valider les données
        const data = updateDemandeDataSchema.parse(body)

        // Vérifier que la demande existe
        const demande = await prisma.demande.findUnique({
            where: { id },
            include: { appele: true },
        })

        if (!demande) {
            return NextResponse.json(
                { error: "Demande non trouvée" },
                { status: 404 }
            )
        }

        // Préparer les données de l'appelé à mettre à jour
        const appeleData: any = {}
        if (data.nom) appeleData.nom = data.nom.toUpperCase()
        if (data.prenom) appeleData.prenom = data.prenom
        if (data.dateNaissance) appeleData.dateNaissance = new Date(data.dateNaissance)
        if (data.lieuNaissance) appeleData.lieuNaissance = data.lieuNaissance
        if (data.telephone !== undefined) appeleData.telephone = data.telephone || null
        if (data.email !== undefined) appeleData.email = data.email || null
        if (data.promotion) appeleData.promotion = data.promotion

        // Mettre à jour la demande et l'appelé
        const updated = await prisma.demande.update({
            where: { id },
            data: {
                observations: data.observations,
                appele: {
                    update: appeleData,
                },
            },
            include: {
                appele: true,
                pieces: true,
                attestation: true,
            },
        })

        // Logger la modification
        await prisma.auditLog.create({
            data: {
                action: 'DEMANDE_MODIFIEE',
                userId: session.user.id,
                demandeId: id,
                details: JSON.stringify({
                    numeroEnregistrement: updated.numeroEnregistrement,
                    modifications: data,
                }),
            },
        })

        return NextResponse.json({
            success: true,
            message: 'Demande modifiée avec succès',
            demande: updated,
        })
    } catch (error) {
        console.error("Erreur modification demande:", error)
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Données invalides', details: error.issues },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: "Erreur lors de la modification de la demande" },
            { status: 500 }
        )
    }
}
