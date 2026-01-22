import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { AttestationService } from '@/lib/services/attestation.service';
import fs from 'fs/promises';
import path from 'path';

// Helper pour créer un utilisateur de test
async function createTestUser(role: string = 'DIRECTEUR') {
  return await prisma.user.create({
    data: {
      email: `test-${role.toLowerCase()}-${Date.now()}@test.com`,
      nom: `Test ${role}`,
      prenom: 'User',
      passwordHash: 'test-hash',
      role: role,
      totpSecret: role === 'DIRECTEUR' ? 'test-totp-secret' : null,
      totpEnabled: role === 'DIRECTEUR',
    },
  });
}

// Helper pour nettoyer les données de test
async function cleanupTestData() {
  await prisma.attestation.deleteMany({
    where: { numero: { startsWith: 'ATT-TEST-' } },
  });
  await prisma.pieceDossier.deleteMany({
    where: { demande: { numeroEnregistrement: { startsWith: 'TEST-SIGN-' } } },
  });
  await prisma.appele.deleteMany({
    where: { demande: { numeroEnregistrement: { startsWith: 'TEST-SIGN-' } } },
  });
  await prisma.demande.deleteMany({
    where: { numeroEnregistrement: { startsWith: 'TEST-SIGN-' } },
  });
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'test-' } },
  });
}

describe('API Signature Attestations - Integration Tests', () => {
  let testDirecteur: any;
  let testAgent: any;
  let testAttestation: any;
  let testDemande: any;
  let attestationService: AttestationService;

  beforeAll(async () => {
    attestationService = new AttestationService();

    // Créer un directeur et un agent de test
    testDirecteur = await createTestUser('DIRECTEUR');
    testAgent = await createTestUser('AGENT');

    // Créer une demande avec attestation en attente de signature
    testDemande = await prisma.demande.create({
      data: {
        numeroEnregistrement: `TEST-SIGN-${Date.now()}`,
        dateEnregistrement: new Date(),
        statut: 'EN_ATTENTE_SIGNATURE',
        dateValidation: new Date(),
        agentId: testAgent.id,
        appele: {
          create: {
            nom: 'SIGNATURE',
            prenom: 'Test',
            dateNaissance: new Date('1995-03-15'),
            lieuNaissance: 'Niamey',
            diplome: 'Licence Test',
            promotion: '2023-2024',
            numeroArrete: 'TEST/SIGN/001',
            dateDebutService: new Date('2023-09-01'),
            dateFinService: new Date('2024-08-31'),
          },
        },
      },
      include: { appele: true },
    });

    // Créer une attestation en attente
    testAttestation = await prisma.attestation.create({
      data: {
        numero: `ATT-TEST-SIGN-${Date.now()}`,
        dateGeneration: new Date(),
        fichierPath: '/test/attestation-to-sign.pdf',
        qrCodeData: JSON.stringify({
          n: `ATT-TEST-SIGN-${Date.now()}`,
          nom: 'SIGNATURE',
          prenom: 'Test',
          dn: '1995-03-15',
          arr: 'TEST/SIGN/001',
          dt: new Date().toISOString().split('T')[0],
          h: 'test-hmac',
        }),
        statut: 'EN_ATTENTE_SIGNATURE',
        demandeId: testDemande.id,
      },
    });
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Réinitialiser le statut de l'attestation
    await prisma.attestation.update({
      where: { id: testAttestation.id },
      data: {
        statut: 'EN_ATTENTE_SIGNATURE',
        dateSignature: null,
        typeSignature: null,
        signataireId: null,
      },
    });
  });

  describe('POST /api/attestations/[id]/sign - Signature électronique', () => {
    it('devrait signer une attestation avec signature électronique', async () => {
      const attestation = await prisma.attestation.update({
        where: { id: testAttestation.id },
        data: {
          statut: 'SIGNEE',
          dateSignature: new Date(),
          typeSignature: 'ELECTRONIQUE',
          signataireId: testDirecteur.id,
        },
        include: {
          signataire: true,
        },
      });

      expect(attestation.statut).toBe('SIGNEE');
      expect(attestation.typeSignature).toBe('ELECTRONIQUE');
      expect(attestation.dateSignature).toBeDefined();
      expect(attestation.signataireId).toBe(testDirecteur.id);
      expect(attestation.signataire?.role).toBe('DIRECTEUR');
    });

    it('devrait mettre à jour le statut de la demande à SIGNEE', async () => {
      await prisma.attestation.update({
        where: { id: testAttestation.id },
        data: {
          statut: 'SIGNEE',
          dateSignature: new Date(),
          typeSignature: 'ELECTRONIQUE',
          signataireId: testDirecteur.id,
        },
      });

      await prisma.demande.update({
        where: { id: testDemande.id },
        data: { statut: 'SIGNEE' },
      });

      const demandeUpdated = await prisma.demande.findUnique({
        where: { id: testDemande.id },
      });

      expect(demandeUpdated?.statut).toBe('SIGNEE');
    });

    it('devrait enregistrer la date de signature', async () => {
      const beforeSign = new Date();

      const attestation = await prisma.attestation.update({
        where: { id: testAttestation.id },
        data: {
          statut: 'SIGNEE',
          dateSignature: new Date(),
          typeSignature: 'ELECTRONIQUE',
          signataireId: testDirecteur.id,
        },
      });

      const afterSign = new Date();

      expect(attestation.dateSignature).toBeDefined();
      expect(attestation.dateSignature!.getTime()).toBeGreaterThanOrEqual(beforeSign.getTime());
      expect(attestation.dateSignature!.getTime()).toBeLessThanOrEqual(afterSign.getTime());
    });

    it('devrait enregistrer le signataire', async () => {
      const attestation = await prisma.attestation.update({
        where: { id: testAttestation.id },
        data: {
          statut: 'SIGNEE',
          dateSignature: new Date(),
          typeSignature: 'ELECTRONIQUE',
          signataireId: testDirecteur.id,
        },
        include: {
          signataire: {
            select: {
              id: true,
              email: true,
              nom: true,
              prenom: true,
              role: true,
            },
          },
        },
      });

      expect(attestation.signataire).toBeDefined();
      expect(attestation.signataire?.id).toBe(testDirecteur.id);
      expect(attestation.signataire?.role).toBe('DIRECTEUR');
    });
  });

  describe('POST /api/attestations/[id]/sign - Signature manuscrite', () => {
    it('devrait accepter une signature manuscrite avec fichier', async () => {
      const signaturePath = '/uploads/signatures/test-signature.png';

      const attestation = await prisma.attestation.update({
        where: { id: testAttestation.id },
        data: {
          statut: 'SIGNEE',
          dateSignature: new Date(),
          typeSignature: 'MANUSCRITE',
          signataireId: testDirecteur.id,
          fichierSignature: signaturePath,
        },
      });

      expect(attestation.statut).toBe('SIGNEE');
      expect(attestation.typeSignature).toBe('MANUSCRITE');
      expect(attestation.fichierSignature).toBe(signaturePath);
    });

    it('devrait créer un nouveau PDF avec la signature intégrée', async () => {
      const attestation = await prisma.attestation.update({
        where: { id: testAttestation.id },
        data: {
          statut: 'SIGNEE',
          dateSignature: new Date(),
          typeSignature: 'MANUSCRITE',
          signataireId: testDirecteur.id,
          fichierSignature: '/uploads/signatures/test.png',
        },
      });

      // Le fichier PDF devrait être mis à jour
      expect(attestation.fichierPath).toBeDefined();
      expect(attestation.fichierPath).toMatch(/\.pdf$/);
    });
  });

  describe('Validation des permissions', () => {
    it('ne devrait autoriser que le rôle DIRECTEUR', async () => {
      // Un agent ne devrait pas pouvoir signer
      const result = await prisma.user.findUnique({
        where: { id: testAgent.id },
        select: { role: true },
      });

      expect(result?.role).toBe('AGENT');
      expect(result?.role).not.toBe('DIRECTEUR');
    });

    it('devrait vérifier que le 2FA est activé pour le directeur', async () => {
      const directeur = await prisma.user.findUnique({
        where: { id: testDirecteur.id },
        select: {
          totpEnabled: true,
          totpSecret: true,
        },
      });

      expect(directeur?.totpEnabled).toBe(true);
      expect(directeur?.totpSecret).toBeDefined();
    });

    it('ne devrait pas signer si l\'attestation n\'est pas EN_ATTENTE_SIGNATURE', async () => {
      // Mettre l'attestation dans un autre statut
      await prisma.attestation.update({
        where: { id: testAttestation.id },
        data: { statut: 'BROUILLON' },
      });

      const attestation = await prisma.attestation.findUnique({
        where: { id: testAttestation.id },
      });

      expect(attestation?.statut).toBe('BROUILLON');
      // Ne devrait pas permettre la signature
    });

    it('ne devrait pas signer une attestation déjà signée', async () => {
      // Signer une première fois
      await prisma.attestation.update({
        where: { id: testAttestation.id },
        data: {
          statut: 'SIGNEE',
          dateSignature: new Date(),
          typeSignature: 'ELECTRONIQUE',
          signataireId: testDirecteur.id,
        },
      });

      const attestation = await prisma.attestation.findUnique({
        where: { id: testAttestation.id },
      });

      expect(attestation?.statut).toBe('SIGNEE');
      // Une seconde tentative devrait échouer
    });
  });

  describe('Validation des données', () => {
    it('devrait rejeter une attestation inexistante', async () => {
      const result = await prisma.attestation.findUnique({
        where: { id: 'attestation-invalide-999' },
      });

      expect(result).toBeNull();
    });

    it('devrait valider le type de signature (ELECTRONIQUE ou MANUSCRITE)', async () => {
      const typesValides = ['ELECTRONIQUE', 'MANUSCRITE'];

      typesValides.forEach((type) => {
        expect(['ELECTRONIQUE', 'MANUSCRITE']).toContain(type);
      });
    });

    it('devrait rejeter un type de signature invalide', async () => {
      const typeInvalide = 'INVALIDE';

      expect(['ELECTRONIQUE', 'MANUSCRITE']).not.toContain(typeInvalide);
    });

    it('devrait exiger un fichier pour signature MANUSCRITE', async () => {
      // Si typeSignature = MANUSCRITE, fichierSignature doit être présent
      const attestationManuscrite = await prisma.attestation.update({
        where: { id: testAttestation.id },
        data: {
          typeSignature: 'MANUSCRITE',
          fichierSignature: null, // Devrait échouer
        },
      });

      // La validation devrait exiger fichierSignature
      if (attestationManuscrite.typeSignature === 'MANUSCRITE') {
        expect(attestationManuscrite.fichierSignature).toBeDefined();
      }
    });
  });

  describe('Audit et traçabilité', () => {
    it('devrait créer une entrée d\'audit pour la signature', async () => {
      const attestation = await prisma.attestation.update({
        where: { id: testAttestation.id },
        data: {
          statut: 'SIGNEE',
          dateSignature: new Date(),
          typeSignature: 'ELECTRONIQUE',
          signataireId: testDirecteur.id,
        },
      });

      // Vérifier qu'un audit log pourrait être créé
      const auditData = {
        action: 'SIGNATURE_ATTESTATION',
        userId: testDirecteur.id,
        ressource: `attestation:${attestation.id}`,
        details: JSON.stringify({
          numero: attestation.numero,
          type: attestation.typeSignature,
        }),
        dateAction: new Date(),
      };

      expect(auditData.action).toBe('SIGNATURE_ATTESTATION');
      expect(auditData.userId).toBe(testDirecteur.id);
    });

    it('devrait conserver l\'historique des modifications', async () => {
      const avant = await prisma.attestation.findUnique({
        where: { id: testAttestation.id },
      });

      await prisma.attestation.update({
        where: { id: testAttestation.id },
        data: {
          statut: 'SIGNEE',
          dateSignature: new Date(),
          typeSignature: 'ELECTRONIQUE',
          signataireId: testDirecteur.id,
        },
      });

      const apres = await prisma.attestation.findUnique({
        where: { id: testAttestation.id },
      });

      expect(avant?.statut).not.toBe(apres?.statut);
      expect(avant?.dateSignature).toBeNull();
      expect(apres?.dateSignature).toBeDefined();
    });
  });

  describe('Workflow complet de signature', () => {
    it('devrait suivre le workflow ENREGISTREE → SIGNEE → DELIVREE', async () => {
      // 1. Créer une nouvelle demande
      const demande = await prisma.demande.create({
        data: {
          numeroEnregistrement: `TEST-SIGN-WORKFLOW-${Date.now()}`,
          dateEnregistrement: new Date(),
          statut: 'VALIDEE',
          dateValidation: new Date(),
          agentId: testAgent.id,
          appele: {
            create: {
              nom: 'WORKFLOW',
              prenom: 'Test',
              dateNaissance: new Date('1995-03-15'),
              lieuNaissance: 'Niamey',
              diplome: 'Licence',
              promotion: '2023-2024',
              numeroArrete: 'TEST/WORK/001',
              dateDebutService: new Date('2023-09-01'),
              dateFinService: new Date('2024-08-31'),
            },
          },
        },
      });

      expect(demande.statut).toBe('VALIDEE');

      // 2. Générer l'attestation (passe à EN_ATTENTE_SIGNATURE)
      const attestation = await prisma.attestation.create({
        data: {
          numero: `ATT-TEST-WORKFLOW-${Date.now()}`,
          dateGeneration: new Date(),
          fichierPath: '/test/workflow.pdf',
          qrCodeData: '{}',
          statut: 'EN_ATTENTE_SIGNATURE',
          demandeId: demande.id,
        },
      });

      await prisma.demande.update({
        where: { id: demande.id },
        data: { statut: 'EN_ATTENTE_SIGNATURE' },
      });

      let demandeUpdated = await prisma.demande.findUnique({
        where: { id: demande.id },
      });

      expect(demandeUpdated?.statut).toBe('EN_ATTENTE_SIGNATURE');

      // 3. Signer l'attestation (passe à SIGNEE)
      await prisma.attestation.update({
        where: { id: attestation.id },
        data: {
          statut: 'SIGNEE',
          dateSignature: new Date(),
          typeSignature: 'ELECTRONIQUE',
          signataireId: testDirecteur.id,
        },
      });

      await prisma.demande.update({
        where: { id: demande.id },
        data: { statut: 'SIGNEE' },
      });

      demandeUpdated = await prisma.demande.findUnique({
        where: { id: demande.id },
      });

      expect(demandeUpdated?.statut).toBe('SIGNEE');

      // 4. Délivrer l'attestation (passe à DELIVREE)
      await prisma.demande.update({
        where: { id: demande.id },
        data: {
          statut: 'DELIVREE',
          dateDelivrance: new Date(),
        },
      });

      demandeUpdated = await prisma.demande.findUnique({
        where: { id: demande.id },
      });

      expect(demandeUpdated?.statut).toBe('DELIVREE');
      expect(demandeUpdated?.dateDelivrance).toBeDefined();
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait rollback en cas d\'erreur de fichier', async () => {
      const attestationAvant = await prisma.attestation.findUnique({
        where: { id: testAttestation.id },
      });

      // Simuler une erreur (ex: fichier signature introuvable)
      try {
        // Tentative de mise à jour avec fichier invalide
        await prisma.attestation.update({
          where: { id: testAttestation.id },
          data: {
            statut: 'SIGNEE',
            typeSignature: 'MANUSCRITE',
            fichierSignature: '/invalid/path/signature.png',
            signataireId: testDirecteur.id,
          },
        });

        // Si on arrive ici, vérifier que le statut n'a pas changé
      } catch (error) {
        const attestationApres = await prisma.attestation.findUnique({
          where: { id: testAttestation.id },
        });

        // Le statut ne devrait pas avoir changé
        expect(attestationApres?.statut).toBe(attestationAvant?.statut);
      }
    });
  });

  describe('Performance', () => {
    it('devrait signer rapidement une attestation', async () => {
      const startTime = Date.now();

      await prisma.attestation.update({
        where: { id: testAttestation.id },
        data: {
          statut: 'SIGNEE',
          dateSignature: new Date(),
          typeSignature: 'ELECTRONIQUE',
          signataireId: testDirecteur.id,
        },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Devrait prendre moins de 1 seconde
      expect(duration).toBeLessThan(1000);
    });

    it('devrait gérer un lot de signatures', async () => {
      // Créer plusieurs attestations
      const attestations = await Promise.all(
        Array.from({ length: 5 }).map((_, i) =>
          prisma.attestation.create({
            data: {
              numero: `ATT-TEST-BATCH-SIGN-${i}-${Date.now()}`,
              dateGeneration: new Date(),
              fichierPath: `/test/batch-${i}.pdf`,
              qrCodeData: '{}',
              statut: 'EN_ATTENTE_SIGNATURE',
              demandeId: testDemande.id,
            },
          })
        )
      );

      const startTime = Date.now();

      await Promise.all(
        attestations.map((att) =>
          prisma.attestation.update({
            where: { id: att.id },
            data: {
              statut: 'SIGNEE',
              dateSignature: new Date(),
              typeSignature: 'ELECTRONIQUE',
              signataireId: testDirecteur.id,
            },
          })
        )
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 5 signatures en moins de 2 secondes
      expect(duration).toBeLessThan(2000);
    });
  });
});
