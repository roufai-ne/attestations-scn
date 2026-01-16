import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests simplifiés pour le module de validation
 * Ces tests ne nécessitent pas de mocking complexe
 */

// Import des schémas de validation
import {
    createDemandeSchema,
    validerDemandeSchema,
    rejeterDemandeSchema,
    signerAttestationSchema,
    changerPinSchema,
    createUserSchema,
} from '../../validation/schemas';

describe('Validation Schemas', () => {
    describe('createDemandeSchema', () => {
        it('devrait valider une demande correcte', () => {
            const validData = {
                nom: 'AMADOU',
                prenom: 'Ibrahim',
                dateNaissance: '1995-05-15',
                lieuNaissance: 'Niamey',
                sexe: 'M',
                email: 'test@example.com',
                telephone: '90123456',
                diplome: 'Licence Informatique',
                promotion: '2024',
                dateDebutService: '2024-01-01',
                dateFinService: '2024-12-31',
            };

            const result = createDemandeSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('devrait rejeter si le nom est manquant', () => {
            const invalidData = {
                prenom: 'Ibrahim',
                dateNaissance: '1995-05-15',
                lieuNaissance: 'Niamey',
                sexe: 'M',
                diplome: 'Licence',
                promotion: '2024',
                dateDebutService: '2024-01-01',
                dateFinService: '2024-12-31',
            };

            const result = createDemandeSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('devrait rejeter un sexe invalide', () => {
            const invalidData = {
                nom: 'AMADOU',
                prenom: 'Ibrahim',
                dateNaissance: '1995-05-15',
                lieuNaissance: 'Niamey',
                sexe: 'X', // Invalide
                diplome: 'Licence',
                promotion: '2024',
                dateDebutService: '2024-01-01',
                dateFinService: '2024-12-31',
            };

            const result = createDemandeSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('devrait rejeter une date invalide', () => {
            const invalidData = {
                nom: 'AMADOU',
                prenom: 'Ibrahim',
                dateNaissance: 'pas-une-date',
                lieuNaissance: 'Niamey',
                sexe: 'M',
                diplome: 'Licence',
                promotion: '2024',
                dateDebutService: '2024-01-01',
                dateFinService: '2024-12-31',
            };

            const result = createDemandeSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('validerDemandeSchema', () => {
        it('devrait valider avec observations optionnelles', () => {
            const validData = {
                observations: 'Dossier complet',
                envoyerNotification: true,
            };

            const result = validerDemandeSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('devrait valider sans observations', () => {
            const validData = {};

            const result = validerDemandeSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });
    });

    describe('rejeterDemandeSchema', () => {
        it('devrait valider avec un motif', () => {
            const validData = {
                motif: 'Pièces manquantes',
                envoyerNotification: true,
            };

            const result = rejeterDemandeSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('devrait rejeter sans motif', () => {
            const invalidData = {
                envoyerNotification: true,
            };

            const result = rejeterDemandeSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('devrait rejeter avec un motif vide', () => {
            const invalidData = {
                motif: '',
            };

            const result = rejeterDemandeSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('signerAttestationSchema', () => {
        it('devrait valider un PIN de 4 chiffres', () => {
            const validData = { pin: '1234' };
            const result = signerAttestationSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('devrait valider un PIN de 6 chiffres', () => {
            const validData = { pin: '123456' };
            const result = signerAttestationSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('devrait rejeter un PIN trop court', () => {
            const invalidData = { pin: '123' };
            const result = signerAttestationSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('devrait rejeter un PIN trop long', () => {
            const invalidData = { pin: '1234567' };
            const result = signerAttestationSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('changerPinSchema', () => {
        it('devrait valider un changement de PIN correct', () => {
            const validData = {
                ancienPin: '1234',
                nouveauPin: '5678',
                confirmerPin: '5678',
            };

            const result = changerPinSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('devrait rejeter si les PINs ne correspondent pas', () => {
            const invalidData = {
                ancienPin: '1234',
                nouveauPin: '5678',
                confirmerPin: '9999',
            };

            const result = changerPinSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('correspondent');
            }
        });
    });

    describe('createUserSchema', () => {
        it('devrait valider un utilisateur correct', () => {
            const validData = {
                nom: 'DUPONT',
                prenom: 'Jean',
                email: 'jean.dupont@example.com',
                password: 'MotDePasse123!',
                role: 'AGENT',
            };

            const result = createUserSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('devrait rejeter un email invalide', () => {
            const invalidData = {
                nom: 'DUPONT',
                prenom: 'Jean',
                email: 'pas-un-email',
                password: 'MotDePasse123!',
                role: 'AGENT',
            };

            const result = createUserSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('devrait rejeter un mot de passe trop court', () => {
            const invalidData = {
                nom: 'DUPONT',
                prenom: 'Jean',
                email: 'jean@example.com',
                password: '1234567', // 7 caractères
                role: 'AGENT',
            };

            const result = createUserSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('devrait rejeter un rôle invalide', () => {
            const invalidData = {
                nom: 'DUPONT',
                prenom: 'Jean',
                email: 'jean@example.com',
                password: 'MotDePasse123!',
                role: 'SUPER_ADMIN', // Invalide
            };

            const result = createUserSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });
});
