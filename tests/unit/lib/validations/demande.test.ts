import { describe, it, expect } from 'vitest';
import { demandeSchema } from '@/lib/validations/demande';
import { TypePiece } from '@prisma/client';

describe('Validation Schemas - demande', () => {
  describe('demandeSchema', () => {
    const validDemandeData = {
      // Section Enregistrement
      numeroEnregistrement: 'ENR-2026-001',
      dateEnregistrement: new Date('2026-01-22'),
      
      // Section Appelé
      nom: 'DIALLO',
      prenom: 'Amadou',
      dateNaissance: new Date('1998-05-15'),
      lieuNaissance: 'Niamey',
      email: 'amadou.diallo@example.com',
      telephone: '+22798765432',
      whatsapp: '+22798765432',
      whatsappIdentique: true,
      
      // Section Service Civique
      diplome: 'Licence en Informatique',
      promotion: '15ème Promotion',
      numeroArrete: 'ARR-2024-001',
      structure: 'Ministère de l\'Éducation',
      dateDebutService: new Date('2024-01-10'),
      dateFinService: new Date('2024-12-31'),
      
      // Section Pièces
      pieces: [
        {
          type: TypePiece.DEMANDE_MANUSCRITE,
          present: true,
          conforme: true,
          observation: '',
        },
        {
          type: TypePiece.COPIE_ARRETE,
          present: true,
          conforme: true,
          observation: '',
        },
      ],
      
      // Observations
      observations: 'Dossier complet',
    };

    it('devrait valider une demande complète et valide', () => {
      const result = demandeSchema.safeParse(validDemandeData);

      if (!result.success) {
        console.log('Validation errors:', JSON.stringify(result.error.issues, null, 2));
      }

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.numeroEnregistrement).toBe('ENR-2026-001');
        expect(result.data.nom).toBe('DIALLO'); // Transformé en majuscules
        expect(result.data.prenom).toBe('Amadou'); // Capitalisé
      }
    });

    it('devrait rejeter un numéro d\'enregistrement vide', () => {
      const invalidDemande = {
        ...validDemandeData,
        numeroEnregistrement: '',
      };

      const result = demandeSchema.safeParse(invalidDemande);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('numeroEnregistrement')
        )).toBe(true);
      }
    });

    it('devrait rejeter un email invalide', () => {
      const invalidDemande = {
        ...validDemandeData,
        email: 'email-invalide',
      };

      const result = demandeSchema.safeParse(invalidDemande);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('email')
        )).toBe(true);
      }
    });

    it('devrait rejeter un téléphone avec format invalide', () => {
      const invalidDemande = {
        ...validDemandeData,
        telephone: '98765432', // Manque +227
      };

      const result = demandeSchema.safeParse(invalidDemande);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('telephone')
        )).toBe(true);
      }
    });

    it('devrait transformer le nom en majuscules', () => {
      const demandeWithLowercaseName = {
        ...validDemandeData,
        nom: 'diallo',
      };

      const result = demandeSchema.safeParse(demandeWithLowercaseName);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe('DIALLO');
      }
    });

    it('devrait capitaliser le prénom', () => {
      const demandeWithLowercasePrenom = {
        ...validDemandeData,
        prenom: 'amadou',
      };

      const result = demandeSchema.safeParse(demandeWithLowercasePrenom);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prenom).toBe('Amadou');
      }
    });

    it('devrait accepter un email vide', () => {
      const demandeWithoutEmail = {
        ...validDemandeData,
        email: '',
      };

      const result = demandeSchema.safeParse(demandeWithoutEmail);

      expect(result.success).toBe(true);
    });

    it('devrait accepter un téléphone optionnel vide', () => {
      const demandeWithoutPhone = {
        ...validDemandeData,
        telephone: '',
      };

      const result = demandeSchema.safeParse(demandeWithoutPhone);

      expect(result.success).toBe(true);
    });

    it('devrait rejeter si dateFinService < dateDebutService', () => {
      const invalidDemande = {
        ...validDemandeData,
        dateDebutService: new Date('2024-12-31'),
        dateFinService: new Date('2024-01-01'),
      };

      const result = demandeSchema.safeParse(invalidDemande);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes('après')
        )).toBe(true);
      }
    });

    it('devrait rejeter si nom est trop long', () => {
      const invalidDemande = {
        ...validDemandeData,
        nom: 'A'.repeat(101), // Plus de 100 caractères
      };

      const result = demandeSchema.safeParse(invalidDemande);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('nom') && issue.message.includes('trop long')
        )).toBe(true);
      }
    });
  });
});
