import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { demandeSchema } from "@/lib/validations/demande"
import { StatutDemande, CanalNotification } from "@prisma/client"
import { TypeNotification } from "@/lib/notifications/templates"

// POST /api/demandes - Créer une nouvelle demande
export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
        }

        // Vérifier que l'utilisateur est AGENT ou ADMIN
        if (session.user.role !== "AGENT" && session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
        }

        const body = await request.json()

        // Valider les données
        const validatedData = demandeSchema.parse(body)

        // Vérifier que le numéro d'enregistrement n'existe pas déjà
        const existingDemande = await prisma.demande.findUnique({
            where: { numeroEnregistrement: validatedData.numeroEnregistrement },
        })

        if (existingDemande) {
            return NextResponse.json(
                { error: "Ce numéro d'enregistrement existe déjà" },
                { status: 400 }
            )
        }

        // Créer la demande avec l'appelé et les pièces
        const demande = await prisma.demande.create({
            data: {
                numeroEnregistrement: validatedData.numeroEnregistrement,
                dateEnregistrement: validatedData.dateEnregistrement,
                statut: StatutDemande.EN_TRAITEMENT,
                agentId: session.user.id,
                observations: validatedData.observations || null,
                appele: {
                    create: {
                        nom: validatedData.nom,
                        prenom: validatedData.prenom,
                        dateNaissance: validatedData.dateNaissance,
                        lieuNaissance: validatedData.lieuNaissance,
                        email: validatedData.email || null,
                        telephone: validatedData.telephone || null,
                        whatsapp: validatedData.whatsapp || null,
                        diplome: validatedData.diplome,
                        promotion: validatedData.promotion,
                        numeroArrete: validatedData.numeroArrete || null,
                        structure: validatedData.structure || null,
                        dateDebutService: validatedData.dateDebutService,
                        dateFinService: validatedData.dateFinService,
                    },
                },
                pieces: {
                    createMany: {
                        data: validatedData.pieces.map((piece) => ({
                            type: piece.type,
                            present: piece.present,
                            conforme: piece.conforme,
                            observation: piece.observation || null,
                        })),
                    },
                },
            },
            include: {
                appele: true,
                pieces: true,
            },
        })

        // Log de l'audit
        await prisma.auditLog.create({
            data: {
                action: "CREATION_DEMANDE",
                userId: session.user.id,
                demandeId: demande.id,
                details: JSON.stringify({
                    numeroEnregistrement: demande.numeroEnregistrement,
                    appele: `${validatedData.nom} ${validatedData.prenom}`,
                }),
            },
        })

        // Envoyer notification de confirmation de dépôt (DÉSACTIVÉE PAR DÉFAUT)
        const envoyerNotification = body.envoyerNotification === true; // Explicitement true requis
        if (envoyerNotification && demande.appele) {
            try {
                const { notificationService } = await import('@/lib/notifications/notification.service');
                const { shouldSendNotification } = await import('@/lib/notifications/notification.helpers');

                const notifDecision = shouldSendNotification(
                    {
                        enabled: true,
                        channels: body.canauxNotification, // Optionnel: canaux spécifiques
                    },
                    demande.appele
                );

                if (notifDecision.send && notifDecision.channels.length > 0) {
                    await notificationService.send({
                        demandeId: demande.id,
                        type: TypeNotification.CONFIRMATION_DEPOT,
                        canaux: notifDecision.channels,
                        data: {
                            numeroEnregistrement: demande.numeroEnregistrement,
                            nom: demande.appele.nom,
                            prenom: demande.appele.prenom,
                            dateEnregistrement: new Date(demande.dateEnregistrement).toLocaleDateString('fr-FR'),
                        },
                    });
                }
            } catch (notifError) {
                console.error('Erreur envoi notification confirmation dépôt:', notifError);
                // Ne pas bloquer la création si la notification échoue
            }
        }

        return NextResponse.json(demande, { status: 201 })
    } catch (error) {
        console.error("Erreur création demande:", error)

        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json(
                { error: "Données invalides", details: error },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: "Erreur lors de la création de la demande" },
            { status: 500 }
        )
    }
}

// GET /api/demandes - Liste des demandes
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const statut = searchParams.get("statut")
        const promotion = searchParams.get("promotion")
        const search = searchParams.get("search")
        const dateDebut = searchParams.get("dateDebut")
        const dateFin = searchParams.get("dateFin")
        const structure = searchParams.get("structure")
        const diplome = searchParams.get("diplome")

        const where: any = {}

        if (statut) {
            where.statut = statut
        }

        // Construire les filtres sur l'appelé
        const appeleFilters: any = {}
        if (promotion) {
            appeleFilters.promotion = promotion
        }
        if (structure) {
            appeleFilters.structure = { contains: structure, mode: "insensitive" }
        }
        if (diplome) {
            appeleFilters.diplome = diplome
        }
        if (Object.keys(appeleFilters).length > 0) {
            where.appele = appeleFilters
        }

        if (search) {
            where.OR = [
                { numeroEnregistrement: { contains: search, mode: "insensitive" } },
                { appele: { nom: { contains: search, mode: "insensitive" } } },
                { appele: { prenom: { contains: search, mode: "insensitive" } } },
                { appele: { telephone: { contains: search, mode: "insensitive" } } },
            ]
        }

        // Filtres de dates
        if (dateDebut || dateFin) {
            where.dateEnregistrement = {}
            if (dateDebut) {
                where.dateEnregistrement.gte = new Date(dateDebut)
            }
            if (dateFin) {
                where.dateEnregistrement.lte = new Date(dateFin)
            }
        }

        const demandes = await prisma.demande.findMany({
            where,
            include: {
                appele: true,
                agent: {
                    select: {
                        nom: true,
                        prenom: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(demandes)
    } catch (error) {
        console.error("Erreur récupération demandes:", error)
        return NextResponse.json(
            { error: "Erreur lors de la récupération des demandes" },
            { status: 500 }
        )
    }
}
