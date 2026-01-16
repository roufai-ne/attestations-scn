"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { demandeSchema, type DemandeFormData } from "@/lib/validations/demande"
import { TypePiece } from "@prisma/client"
import { Save, Send, AlertCircle, Loader2 } from "lucide-react"
import PiecesVerification from "./PiecesVerification"
import { ArreteSearchInput } from "./ArreteSearchInput"

const piecesInitiales = [
    { type: TypePiece.DEMANDE_MANUSCRITE, present: false, conforme: null, observation: "" },
    { type: TypePiece.CERTIFICAT_ASSIDUITE, present: false, conforme: null, observation: "" },
    { type: TypePiece.CERTIFICAT_CESSATION, present: false, conforme: null, observation: "" },
    { type: TypePiece.CERTIFICAT_PRISE_SERVICE, present: false, conforme: null, observation: "" },
    { type: TypePiece.COPIE_ARRETE, present: false, conforme: null, observation: "" },
]

export default function DemandeForm() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<DemandeFormData>({
        resolver: zodResolver(demandeSchema),
        defaultValues: {
            pieces: piecesInitiales,
            whatsappIdentique: false,
        },
    })

    const whatsappIdentique = watch("whatsappIdentique")
    const telephone = watch("telephone")
    const numeroArrete = watch("numeroArrete")

    // Synchroniser WhatsApp avec téléphone si checkbox cochée
    if (whatsappIdentique && telephone) {
        setValue("whatsapp", telephone)
    }

    const onSubmit = async (data: DemandeFormData) => {
        setIsSubmitting(true)
        setError(null)

        try {
            const response = await fetch("/api/demandes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Erreur lors de la création")
            }

            const result = await response.json()
            router.push(`/agent/demandes/${result.id}`)
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {error && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 p-4 text-sm text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            )}

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
                    {/* Recherche dans les arrêtés */}
                    <div className="col-span-2">
                        <ArreteSearchInput
                            value={numeroArrete}
                            onChange={(numero) => setValue("numeroArrete", numero)}
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
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

            {/* Section 4: Vérification des pièces */}
            <PiecesVerification register={register} errors={errors} />

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
                            <Send className="h-4 w-4" />
                            Valider la demande
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

