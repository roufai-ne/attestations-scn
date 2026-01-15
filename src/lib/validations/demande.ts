import { z } from "zod"
import { TypePiece } from "@prisma/client"

// Schéma de validation pour la création d'une demande
export const demandeSchema = z.object({
    // Section Enregistrement courrier
    numeroEnregistrement: z
        .string()
        .min(1, "Le numéro d'enregistrement est requis")
        .max(50, "Le numéro d'enregistrement est trop long"),
    dateEnregistrement: z.coerce.date({
        required_error: "La date d'enregistrement est requise",
        invalid_type_error: "Date d'enregistrement invalide",
    }),

    // Section Informations de l'appelé
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
    dateNaissance: z.coerce.date({
        required_error: "La date de naissance est requise",
        invalid_type_error: "Date de naissance invalide",
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

    // Section Service civique
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
    structure: z
        .string()
        .max(200, "Le nom de la structure est trop long")
        .optional()
        .or(z.literal("")),
    dateDebutService: z.coerce.date({
        required_error: "La date de début de service est requise",
        invalid_type_error: "Date de début de service invalide",
    }),
    dateFinService: z.coerce.date({
        required_error: "La date de fin de service est requise",
        invalid_type_error: "Date de fin de service invalide",
    }),

    // Section Pièces du dossier
    pieces: z.array(
        z.object({
            type: z.nativeEnum(TypePiece),
            present: z.boolean(),
            conforme: z.boolean().nullable(),
            observation: z.string().optional(),
        })
    ),

    // Observations générales
    observations: z.string().optional(),
})
    .refine((data) => data.dateFinService > data.dateDebutService, {
        message: "La date de fin doit être après la date de début",
        path: ["dateFinService"],
    })
    .refine(
        (data) => {
            const age = new Date().getFullYear() - data.dateNaissance.getFullYear()
            return age >= 18 && age <= 100
        },
        {
            message: "L'appelé doit avoir au moins 18 ans",
            path: ["dateNaissance"],
        }
    )

export type DemandeFormData = z.infer<typeof demandeSchema>
