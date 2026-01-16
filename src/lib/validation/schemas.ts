/**
 * Schémas de validation Zod
 * Utilisés pour valider les entrées des API routes
 */

import { z } from 'zod';

// =============================================================================
// DEMANDES
// =============================================================================

export const createDemandeSchema = z.object({
    // Informations de l'appelé
    nom: z.string().min(1, 'Le nom est requis').max(100),
    prenom: z.string().min(1, 'Le prénom est requis').max(100),
    dateNaissance: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Date de naissance invalide',
    }),
    lieuNaissance: z.string().min(1, 'Le lieu de naissance est requis'),
    sexe: z.enum(['M', 'F'], { errorMap: () => ({ message: 'Sexe invalide (M ou F)' }) }),

    // Contact
    email: z.string().email('Email invalide').optional().nullable(),
    telephone: z.string().min(8, 'Téléphone invalide').optional().nullable(),
    whatsapp: z.string().optional().nullable(),

    // Service civique
    diplome: z.string().min(1, 'Le diplôme est requis'),
    promotion: z.string().min(1, 'La promotion est requise'),
    numeroArrete: z.string().optional().nullable(),
    dateDebutService: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Date de début invalide',
    }),
    dateFinService: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Date de fin invalide',
    }),

    // Observations
    observations: z.string().optional().nullable(),
});

export const updateDemandeSchema = createDemandeSchema.partial();

export const validerDemandeSchema = z.object({
    observations: z.string().optional().nullable(),
    envoyerNotification: z.boolean().optional().default(true),
});

export const rejeterDemandeSchema = z.object({
    motif: z.string().min(1, 'Le motif de rejet est obligatoire'),
    envoyerNotification: z.boolean().optional().default(true),
});

// =============================================================================
// SIGNATURE
// =============================================================================

export const signerAttestationSchema = z.object({
    pin: z.string().min(4, 'PIN invalide').max(6),
});

export const signerLotSchema = z.object({
    attestationIds: z.array(z.string()).min(1, 'Liste d\'attestations vide'),
    pin: z.string().min(4, 'PIN invalide').max(6),
});

export const configSignatureSchema = z.object({
    typeSignature: z.enum(['MANUELLE', 'ELECTRONIQUE'], {
        errorMap: () => ({ message: 'Type de signature invalide' }),
    }),
    signatureImage: z.string().optional(), // Base64 ou URL
    positionX: z.number().min(0).max(600).optional(),
    positionY: z.number().min(0).max(800).optional(),
    pin: z.string().min(4).max(6).optional(),
});

export const changerPinSchema = z.object({
    ancienPin: z.string().min(4, 'PIN actuel invalide').max(6),
    nouveauPin: z.string().min(4, 'Nouveau PIN invalide').max(6),
    confirmerPin: z.string().min(4).max(6),
}).refine((data) => data.nouveauPin === data.confirmerPin, {
    message: 'Les PINs ne correspondent pas',
    path: ['confirmerPin'],
});

// =============================================================================
// UTILISATEURS
// =============================================================================

export const createUserSchema = z.object({
    nom: z.string().min(1, 'Le nom est requis'),
    prenom: z.string().min(1, 'Le prénom est requis'),
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    role: z.enum(['ADMIN', 'DIRECTEUR', 'AGENT', 'SAISIE'], {
        errorMap: () => ({ message: 'Rôle invalide' }),
    }),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true });

export const changePasswordSchema = z.object({
    ancienPassword: z.string().min(1, 'Mot de passe actuel requis'),
    nouveauPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
    confirmerPassword: z.string(),
}).refine((data) => data.nouveauPassword === data.confirmerPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmerPassword'],
});

// =============================================================================
// ARRÊTÉS
// =============================================================================

export const uploadArreteSchema = z.object({
    numero: z.string().min(1, 'Le numéro d\'arrêté est requis'),
    dateArrete: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Date d\'arrêté invalide',
    }),
    description: z.string().optional(),
});

// =============================================================================
// NOTIFICATIONS
// =============================================================================

export const sendNotificationSchema = z.object({
    type: z.enum([
        'CONFIRMATION_DEPOT',
        'DEMANDE_EN_TRAITEMENT',
        'DEMANDE_REJETEE',
        'ATTESTATION_PRETE',
    ]),
    canaux: z.array(z.enum(['EMAIL', 'SMS', 'WHATSAPP'])).min(1),
    messagePersonnalise: z.string().optional(),
});

// =============================================================================
// AUDIT / RAPPORTS
// =============================================================================

export const auditFilterSchema = z.object({
    userId: z.string().optional(),
    action: z.string().optional(),
    dateDebut: z.string().optional(),
    dateFin: z.string().optional(),
    demandeId: z.string().optional(),
    page: z.coerce.number().min(1).optional().default(1),
    limit: z.coerce.number().min(1).max(100).optional().default(50),
    export: z.enum(['csv', 'pdf']).optional(),
});

export const reportFilterSchema = z.object({
    dateDebut: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Date de début invalide',
    }),
    dateFin: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Date de fin invalide',
    }),
    statut: z.string().optional(),
    agentId: z.string().optional(),
    format: z.enum(['json', 'excel', 'pdf']).optional().default('json'),
});

// =============================================================================
// HELPER TYPES
// =============================================================================

export type CreateDemandeInput = z.infer<typeof createDemandeSchema>;
export type UpdateDemandeInput = z.infer<typeof updateDemandeSchema>;
export type ValiderDemandeInput = z.infer<typeof validerDemandeSchema>;
export type RejeterDemandeInput = z.infer<typeof rejeterDemandeSchema>;
export type SignerAttestationInput = z.infer<typeof signerAttestationSchema>;
export type SignerLotInput = z.infer<typeof signerLotSchema>;
export type ConfigSignatureInput = z.infer<typeof configSignatureSchema>;
export type ChangerPinInput = z.infer<typeof changerPinSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UploadArreteInput = z.infer<typeof uploadArreteSchema>;
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
export type AuditFilterInput = z.infer<typeof auditFilterSchema>;
export type ReportFilterInput = z.infer<typeof reportFilterSchema>;
