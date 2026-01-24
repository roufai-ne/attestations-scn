"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { TypePiece } from "@prisma/client"
import { Save, Send, AlertCircle, Loader2, Info, Bell } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

// Schéma simplifié pour l'agent de saisie (sans validation des pièces conformes)
const demandeSchemaSimple = z.object({
    numeroEnregistrement: z
        .string()
        .min(1, "Le numéro d'enregistrement est requis")
        .max(50, "Le numéro d'enregistrement est trop long"),
    dateEnregistrement: z.date({
        required_error: "La date d'enregistrement est requise",
    }),
    nom: z
        .string()
        .min(1, "Le nom est requis")
        .max(100, "Le nom est trop long")
        .transform((val) => val.toUpperCase()),
    prenom: z
        .string()
        .min(1, "Le prénom est requis")
        .max(100, "Le prénom est trop long")
        .transform((val) => val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()),
    dateNaissance: z.date({
        required_error: "La date de naissance est requise",
    }),
    lieuNaissance: z
        .string()
        .min(1, "Le lieu de naissance est requis")
        .max(100, "Le lieu de naissance est trop long"),
    email: z
        .string()
        .email("Email invalide")
        .optional()
        .or(z.literal("")),
    telephone: z
        .string()
        .regex(/^\+227\d{8}$/, "Format: +227XXXXXXXX")
        .optional()
        .or(z.literal("")),
    whatsapp: z
        .string()
        .regex(/^\+227\d{8}$/, "Format: +227XXXXXXXX")
        .optional()
        .or(z.literal("")),
    whatsappIdentique: z.boolean(),
    diplome: z
        .string()
        .min(1, "Le diplôme est requis")
        .max(200, "Le diplôme est trop long"),
    promotion: z
        .string()
        .min(1, "La promotion est requise")
        .max(50, "La promotion est trop longue"),
    numeroArrete: z
        .string()
        .max(100, "Le numéro d'arrêté est trop long")
        .optional()
        .or(z.literal("")),
    dateArrete: z.coerce.date({
        required_error: "La date de l'arrêté est requise",
        invalid_type_error: "Date de l'arrêté invalide",
    }).optional(),
    structure: z
        .string()
        .max(200, "Le nom de la structure est trop long")
        .optional()
        .or(z.literal("")),
    dateDebutService: z.date({
        required_error: "La date de début de service est requise",
    }),
    dateFinService: z.date({
        required_error: "La date de fin de service est requise",
    }),
    // Pièces présentes seulement (pas de conformité)
    pieces: z.array(
        z.object({
            type: z.nativeEnum(TypePiece),
            present: z.boolean(),
        })
    ),
    observations: z.string().optional(),
})
    .refine((data) => data.dateFinService > data.dateDebutService, {
        message: "La date de fin doit être après la date de début",
        path: ["dateFinService"],
    })

type DemandeFormDataSimple = z.infer<typeof demandeSchemaSimple>

const piecesLabels: Record<TypePiece, string> = {
    DEMANDE_MANUSCRITE: "Demande manuscrite",
    CERTIFICAT_ASSIDUITE: "Certificat d'assiduité",
    CERTIFICAT_CESSATION: "Certificat de cessation",
    CERTIFICAT_PRISE_SERVICE: "Certificat de prise de service",
    COPIE_ARRETE: "Copie de l'arrêté",
}

const piecesInitiales = [
    { type: TypePiece.DEMANDE_MANUSCRITE, present: false },
    { type: TypePiece.CERTIFICAT_ASSIDUITE, present: false },
    { type: TypePiece.CERTIFICAT_CESSATION, present: false },
    { type: TypePiece.CERTIFICAT_PRISE_SERVICE, present: false },
    { type: TypePiece.COPIE_ARRETE, present: false },
]

interface DemandeFormSaisieProps {
    mode?: 'create' | 'edit';
    initialData?: any;
    demandeId?: string;
}

export default function DemandeFormSaisie({ mode = 'create', initialData, demandeId }: DemandeFormSaisieProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [envoyerNotification, setEnvoyerNotification] = useState(true)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<DemandeFormDataSimple>({
        resolver: zodResolver(demandeSchemaSimple),
        defaultValues: initialData || {
            pieces: piecesInitiales,
            whatsappIdentique: false,
        },
    })

    const whatsappIdentique = watch("whatsappIdentique")
    const telephone = watch("telephone")
    const numeroArrete = watch("numeroArrete")
    const pieces = watch("pieces")

    // Synchroniser WhatsApp avec téléphone si checkbox cochée
    if (whatsappIdentique && telephone) {
        setValue("whatsapp", telephone)
    }

    const onSubmit = async (data: DemandeFormDataSimple) => {
        setIsSubmitting(true)
        setError(null)

        try {
            const url = mode === 'edit' ? `/api/saisie/demandes/${demandeId}` : "/api/saisie/demandes"
            const method = mode === 'edit' ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, envoyerNotification }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Erreur lors de la création")
            }

            const result = await response.json()
            router.push(`/saisie/demandes/${result.id || demandeId}`)
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handlePieceChange = (index: number, present: boolean) => {
        const newPieces = [...pieces]
        newPieces[index] = { ...newPieces[index], present }
        setValue("pieces", newPieces)
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {error && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 p-4 text-sm text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            )}

            {/* Info box */}
            <Card className="bg-green-50 border-green-200">
                <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                            <p className="text-sm text-green-800">
                                <strong>Agent de saisie :</strong> Vous pouvez saisir les informations de la demande et cocher les pièces présentes.
                                La vérification de conformité et la validation seront effectuées par un agent traitant.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Section 1: Enregistrement courrier */}
            <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 text-xl font-semibold">Enregistrement courrier</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Numéro d'enregistrement <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register("numeroEnregistrement")}
                            type="text"
                            className="w-full rounded-md border px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="Ex: SCN-2024-001"
                        />
                        {errors.numeroEnregistrement && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.numeroEnregistrement.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Date d'enregistrement <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register("dateEnregistrement", { valueAsDate: true })}
                            type="date"
                            className="w-full rounded-md border px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                        {errors.dateEnregistrement && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.dateEnregistrement.message}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Section 2: Informations de l'appelé */}
            <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 text-xl font-semibold">Informations de l'appelé</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Nom <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register("nom")}
                            type="text"
                            className="w-full rounded-md border px-3 py-2 uppercase focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="ABDOU"
                        />
                        {errors.nom && (
                            <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Prénom <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register("prenom")}
                            type="text"
                            className="w-full rounded-md border px-3 py-2 capitalize focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="Ibrahim"
                        />
                        {errors.prenom && (
                            <p className="mt-1 text-sm text-red-600">{errors.prenom.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Date de naissance <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register("dateNaissance", { valueAsDate: true })}
                            type="date"
                            max={new Date().toISOString().split("T")[0]}
                            className="w-full rounded-md border px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                        {errors.dateNaissance && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.dateNaissance.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Lieu de naissance <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register("lieuNaissance")}
                            type="text"
                            className="w-full rounded-md border px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="Niamey"
                        />
                        {errors.lieuNaissance && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.lieuNaissance.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">Email</label>
                        <input
                            {...register("email")}
                            type="email"
                            className="w-full rounded-md border px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="exemple@email.com"
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                            Pour les notifications
                        </p>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">Téléphone</label>
                        <input
                            {...register("telephone")}
                            type="tel"
                            className="w-full rounded-md border px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="+22790123456"
                        />
                        {errors.telephone && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.telephone.message}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">Pour les SMS</p>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">WhatsApp</label>
                        <input
                            {...register("whatsapp")}
                            type="tel"
                            disabled={whatsappIdentique}
                            className="w-full rounded-md border px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-100"
                            placeholder="+22790123456"
                        />
                        {errors.whatsapp && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.whatsapp.message}
                            </p>
                        )}
                        <label className="mt-2 flex items-center gap-2 text-sm">
                            <input
                                {...register("whatsappIdentique")}
                                type="checkbox"
                                className="rounded"
                            />
                            Identique au téléphone
                        </label>
                    </div>
                </div>
            </div>


            {/* Section 3: Service civique */}
            <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 text-xl font-semibold">Service civique</h2>
                <div className="space-y-4">
                    {/* Info sur la vérification de l'arrêté */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Note :</strong> La vérification de présence dans les arrêtés sera effectuée par l'agent traitant lors de la validation du dossier.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Numéro d'arrêté (si connu)
                            </label>
                            <input
                                {...register("numeroArrete")}
                                type="text"
                                className="w-full rounded-md border px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                placeholder="Ex: N° 123/2024"
                            />
                            {errors.numeroArrete && (
                                <p className="mt-1 text-sm text-red-600">{errors.numeroArrete.message}</p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground">
                                Optionnel - Sera vérifié par l'agent
                            </p>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Date de l'arrêté (si connue)
                            </label>
                            <input
                                {...register("dateArrete", { valueAsDate: true })}
                                type="date"
                                className="w-full rounded-md border px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            {errors.dateArrete && (
                                <p className="mt-1 text-sm text-red-600">{errors.dateArrete.message as string}</p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground">
                                Optionnel - Sera vérifié par l'agent
                            </p>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Diplôme <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register("diplome")}
                                type="text"
                                className="w-full rounded-md border px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                placeholder="Licence en Informatique"
                            />
                            {errors.diplome && (
                                <p className="mt-1 text-sm text-red-600">{errors.diplome.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Promotion / Année <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register("promotion")}
                                type="text"
                                className="w-full rounded-md border px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                placeholder="2023"
                            />
                            {errors.promotion && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.promotion.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Structure d'affectation
                            </label>
                            <input
                                {...register("structure")}
                                type="text"
                                className="w-full rounded-md border px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                placeholder="Ministère de l'Éducation"
                            />
                            {errors.structure && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.structure.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Date de début de service <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register("dateDebutService", { valueAsDate: true })}
                                type="date"
                                className="w-full rounded-md border px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            {errors.dateDebutService && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.dateDebutService.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Date de fin de service <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register("dateFinService", { valueAsDate: true })}
                                type="date"
                                className="w-full rounded-md border px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            {errors.dateFinService && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.dateFinService.message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 4: Pièces du dossier (simplifié - présence uniquement) */}
            <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 text-xl font-semibold">Pièces du dossier</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Cochez les pièces présentes dans le dossier. La vérification de conformité sera effectuée par l'agent traitant.
                </p>
                <div className="space-y-3">
                    {pieces.map((piece, index) => (
                        <div
                            key={piece.type}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                            <input
                                type="checkbox"
                                checked={piece.present}
                                onChange={(e) => handlePieceChange(index, e.target.checked)}
                                className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="font-medium">{piecesLabels[piece.type]}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Section 5: Observations */}
            <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 text-xl font-semibold">Observations</h2>
                <textarea
                    {...register("observations")}
                    rows={4}
                    className="w-full rounded-md border px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Observations générales sur le dossier..."
                />
            </div>

            {/* Notification */}
            {mode === 'create' && (
                <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="envoyerNotification"
                            checked={envoyerNotification}
                            onCheckedChange={(checked) => setEnvoyerNotification(checked as boolean)}
                        />
                        <Label htmlFor="envoyerNotification" className="flex items-center gap-2 cursor-pointer">
                            <Bell className="h-4 w-4" />
                            Envoyer une notification de confirmation à l'appelé
                        </Label>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-md bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enregistrement...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            {mode === 'edit' ? 'Mettre à jour' : 'Enregistrer la demande'}
                        </>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => router.back()}
                    className="rounded-md border px-6 py-2 font-medium hover:bg-gray-50"
                >
                    Annuler
                </button>
            </div>
        </form>
    )
}

