"use client"

import { UseFormRegister, FieldErrors } from "react-hook-form"
import { DemandeFormData } from "@/lib/validations/demande"
import { TypePiece } from "@prisma/client"

interface PiecesVerificationProps {
    register: UseFormRegister<DemandeFormData>
    errors: FieldErrors<DemandeFormData>
}

const piecesLabels: Record<TypePiece, { nom: string; obligatoire: boolean }> = {
    [TypePiece.DEMANDE_MANUSCRITE]: {
        nom: "Demande manuscrite",
        obligatoire: true,
    },
    [TypePiece.CERTIFICAT_ASSIDUITE]: {
        nom: "Certificat d'assiduité",
        obligatoire: true,
    },
    [TypePiece.CERTIFICAT_CESSATION]: {
        nom: "Certificat de cessation de service",
        obligatoire: true,
    },
    [TypePiece.CERTIFICAT_PRISE_SERVICE]: {
        nom: "Certificat de prise de service",
        obligatoire: true,
    },
    [TypePiece.COPIE_ARRETE]: {
        nom: "Copie de l'arrêté",
        obligatoire: false,
    },
}

export default function PiecesVerification({
    register,
    errors,
}: PiecesVerificationProps) {
    const pieces = Object.entries(piecesLabels)

    return (
        <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-semibold">Vérification des pièces du dossier</h2>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="px-4 py-3 text-left text-sm font-medium">
                                Pièce
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-medium">
                                Présent
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-medium">
                                Conforme
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium">
                                Observation
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {pieces.map(([type, info], index) => (
                            <tr key={type} className="border-b last:border-0">
                                <td className="px-4 py-3 text-sm">
                                    {info.nom}
                                    {info.obligatoire && (
                                        <span className="ml-1 text-red-500">*</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <input
                                        {...register(`pieces.${index}.present`)}
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <input
                                        {...register(`pieces.${index}.type`)}
                                        type="hidden"
                                        value={type}
                                    />
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <input
                                        {...register(`pieces.${index}.conforme`)}
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        {...register(`pieces.${index}.observation`)}
                                        type="text"
                                        className="w-full rounded-md border px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Observation..."
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {errors.pieces && (
                <p className="mt-2 text-sm text-red-600">
                    Veuillez vérifier les pièces du dossier
                </p>
            )}

            <p className="mt-4 text-sm text-muted-foreground">
                <span className="text-red-500">*</span> Pièces obligatoires
            </p>
        </div>
    )
}
