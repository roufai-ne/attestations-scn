import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

// Helper pour créer un utilisateur de test
async function createTestUser(role: 'AGENT' | 'DIRECTEUR' | 'ADMIN' = 'AGENT') {
  const password = await hash('testpassword123', 10);
  
  return prisma.user.create({
    data: {
      email: `test-${role.toLowerCase()}-${Date.now()}@example.com`,
      password,
      nom: 'Test',
      prenom: role,
      role,
      actif: true,
    },
  });
}

// Helper pour nettoyer les données de test
async function cleanupTestData() {
  await prisma.pieceDossier.deleteMany({
    where: { demande: { numeroEnregistrement: { startsWith: 'TEST-' } } },
  });
  await prisma.appele.deleteMany({
    where: { demande: { numeroEnregistrement: { startsWith: 'TEST-' } } },
  });
  await prisma.demande.deleteMany({
    where: { numeroEnregistrement: { startsWith: 'TEST-' } },
  });
}

// TODO: Tests intégration nécessitent base de données test configurée
describe.skip('API Demandes - Integration Tests', () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    testUser = await createTestUser('AGENT');
    // Note: Dans un vrai test, vous auriez besoin de générer un vrai token JWT
    // Pour ce test, on simule l'authentification
  });

  afterAll(async () => {
    await cleanupTestData();
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } });
    }
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('POST /api/demandes - Créer une demande', () => {
    it('devrait créer une demande complète avec succès', async () => {
      const demandeData = {
        numeroEnregistrement: `TEST-${Date.now()}`,
        dateEnregistrement: new Date().toISOString(),
        observations: 'Test demande',
        appele: {
          nom: 'ABDOU',
          prenom: 'Ibrahim',
          dateNaissance: new Date('1995-03-15').toISOString(),
          lieuNaissance: 'Niamey',
          diplome: 'Licence en Informatique',
          promotion: '2023-2024',
          numeroArrete: '2023/045',
          dateDebutService: new Date('2023-09-01').toISOString(),
          dateFinService: new Date('2024-08-31').toISOString(),
        },
        pieces: [
          { type: 'DEMANDE_MANUSCRITE', present: true, conforme: true },
          { type: 'CERTIFICAT_ASSIDUITE', present: true, conforme: true },
          { type: 'CERTIFICAT_CESSATION', present: true, conforme: false, observation: 'Signature manquante' },
          { type: 'CERTIFICAT_PRISE_SERVICE', present: true, conforme: true },
          { type: 'COPIE_ARRETE', present: false, conforme: false },
        ],
      };

      const demande = await prisma.demande.create({
        data: {
          numeroEnregistrement: demandeData.numeroEnregistrement,
          dateEnregistrement: new Date(demandeData.dateEnregistrement),
          statut: 'ENREGISTREE',
          observations: demandeData.observations,
          agentId: testUser.id,
          appele: {
            create: {
              nom: demandeData.appele.nom,
              prenom: demandeData.appele.prenom,
              dateNaissance: new Date(demandeData.appele.dateNaissance),
              lieuNaissance: demandeData.appele.lieuNaissance,
              diplome: demandeData.appele.diplome,
              promotion: demandeData.appele.promotion,
              numeroArrete: demandeData.appele.numeroArrete,
              dateDebutService: new Date(demandeData.appele.dateDebutService),
              dateFinService: new Date(demandeData.appele.dateFinService),
            },
          },
          pieces: {
            create: demandeData.pieces.map(piece => ({
              type: piece.type as any,
              present: piece.present,
              conforme: piece.conforme,
              observation: piece.observation,
            })),
          },
        },
        include: {
          appele: true,
          pieces: true,
        },
      });

      expect(demande).toBeDefined();
      expect(demande.numeroEnregistrement).toBe(demandeData.numeroEnregistrement);
      expect(demande.statut).toBe('ENREGISTREE');
      expect(demande.appele).toBeDefined();
      expect(demande.appele?.nom).toBe('ABDOU');
      expect(demande.pieces).toHaveLength(5);
    });

    it('devrait rejeter une demande avec données invalides', async () => {
      const invalidData = {
        numeroEnregistrement: '', // Vide
        dateEnregistrement: new Date().toISOString(),
        appele: {
          nom: '',
          prenom: 'Ibrahim',
        },
      };

      await expect(
        prisma.demande.create({
          data: {
            numeroEnregistrement: invalidData.numeroEnregistrement,
            dateEnregistrement: new Date(),
            statut: 'ENREGISTREE',
          },
        })
      ).rejects.toThrow();
    });

    it('devrait rejeter un numéro d\'enregistrement dupliqué', async () => {
      const numero = `TEST-${Date.now()}`;

      await prisma.demande.create({
        data: {
          numeroEnregistrement: numero,
          dateEnregistrement: new Date(),
          statut: 'ENREGISTREE',
          agentId: testUser.id,
        },
      });

      await expect(
        prisma.demande.create({
          data: {
            numeroEnregistrement: numero,
            dateEnregistrement: new Date(),
            statut: 'ENREGISTREE',
            agentId: testUser.id,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('GET /api/demandes - Lister les demandes', () => {
    beforeEach(async () => {
      // Créer des demandes de test
      const demandes = [
        {
          numero: `TEST-001-${Date.now()}`,
          statut: 'ENREGISTREE' as const,
        },
        {
          numero: `TEST-002-${Date.now()}`,
          statut: 'EN_TRAITEMENT' as const,
        },
        {
          numero: `TEST-003-${Date.now()}`,
          statut: 'VALIDEE' as const,
        },
      ];

      for (const d of demandes) {
        await prisma.demande.create({
          data: {
            numeroEnregistrement: d.numero,
            dateEnregistrement: new Date(),
            statut: d.statut,
            agentId: testUser.id,
          },
        });
      }
    });

    it('devrait lister toutes les demandes', async () => {
      const demandes = await prisma.demande.findMany({
        where: {
          numeroEnregistrement: { startsWith: 'TEST-' },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(demandes.length).toBeGreaterThanOrEqual(3);
    });

    it('devrait filtrer les demandes par statut', async () => {
      const demandesValidees = await prisma.demande.findMany({
        where: {
          numeroEnregistrement: { startsWith: 'TEST-' },
          statut: 'VALIDEE',
        },
      });

      expect(demandesValidees.length).toBeGreaterThanOrEqual(1);
      expect(demandesValidees.every(d => d.statut === 'VALIDEE')).toBe(true);
    });

    it('devrait paginer les résultats', async () => {
      const page1 = await prisma.demande.findMany({
        where: { numeroEnregistrement: { startsWith: 'TEST-' } },
        take: 2,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      });

      const page2 = await prisma.demande.findMany({
        where: { numeroEnregistrement: { startsWith: 'TEST-' } },
        take: 2,
        skip: 2,
        orderBy: { createdAt: 'desc' },
      });

      expect(page1).toHaveLength(2);
      expect(page1[0].id).not.toBe(page2[0]?.id);
    });

    it('devrait rechercher par nom d\'appelé', async () => {
      // Créer une demande avec appelé
      const numero = `TEST-SEARCH-${Date.now()}`;
      await prisma.demande.create({
        data: {
          numeroEnregistrement: numero,
          dateEnregistrement: new Date(),
          statut: 'ENREGISTREE',
          agentId: testUser.id,
          appele: {
            create: {
              nom: 'MOUSSA',
              prenom: 'Aïcha',
              dateNaissance: new Date('1996-07-22'),
              lieuNaissance: 'Zinder',
              diplome: 'Master',
              promotion: '2023-2024',
              dateDebutService: new Date('2023-09-01'),
              dateFinService: new Date('2024-08-31'),
            },
          },
        },
        include: { appele: true },
      });

      const results = await prisma.demande.findMany({
        where: {
          numeroEnregistrement: { startsWith: 'TEST-' },
          appele: {
            nom: { contains: 'MOUSSA', mode: 'insensitive' },
          },
        },
        include: { appele: true },
      });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(d => d.appele?.nom === 'MOUSSA')).toBe(true);
    });
  });

  describe('GET /api/demandes/[id] - Récupérer une demande', () => {
    let testDemande: any;

    beforeEach(async () => {
      testDemande = await prisma.demande.create({
        data: {
          numeroEnregistrement: `TEST-DETAIL-${Date.now()}`,
          dateEnregistrement: new Date(),
          statut: 'ENREGISTREE',
          agentId: testUser.id,
          appele: {
            create: {
              nom: 'TEST',
              prenom: 'User',
              dateNaissance: new Date('1995-01-01'),
              lieuNaissance: 'Niamey',
              diplome: 'Test',
              promotion: '2023',
              dateDebutService: new Date('2023-09-01'),
              dateFinService: new Date('2024-08-31'),
            },
          },
        },
        include: { appele: true, pieces: true },
      });
    });

    it('devrait récupérer une demande par ID', async () => {
      const demande = await prisma.demande.findUnique({
        where: { id: testDemande.id },
        include: {
          appele: true,
          pieces: true,
          agent: { select: { nom: true, prenom: true, email: true } },
        },
      });

      expect(demande).toBeDefined();
      expect(demande?.id).toBe(testDemande.id);
      expect(demande?.appele).toBeDefined();
      expect(demande?.agent).toBeDefined();
    });

    it('devrait retourner null pour ID inexistant', async () => {
      const demande = await prisma.demande.findUnique({
        where: { id: 'id-inexistant' },
      });

      expect(demande).toBeNull();
    });
  });

  describe('PUT /api/demandes/[id] - Mettre à jour une demande', () => {
    let testDemande: any;

    beforeEach(async () => {
      testDemande = await prisma.demande.create({
        data: {
          numeroEnregistrement: `TEST-UPDATE-${Date.now()}`,
          dateEnregistrement: new Date(),
          statut: 'ENREGISTREE',
          agentId: testUser.id,
        },
      });
    });

    it('devrait mettre à jour le statut d\'une demande', async () => {
      const updated = await prisma.demande.update({
        where: { id: testDemande.id },
        data: { statut: 'EN_TRAITEMENT' },
      });

      expect(updated.statut).toBe('EN_TRAITEMENT');
    });

    it('devrait mettre à jour les observations', async () => {
      const updated = await prisma.demande.update({
        where: { id: testDemande.id },
        data: { observations: 'Nouvelles observations' },
      });

      expect(updated.observations).toBe('Nouvelles observations');
    });

    it('devrait mettre à jour la date de validation', async () => {
      const dateValidation = new Date();
      
      const updated = await prisma.demande.update({
        where: { id: testDemande.id },
        data: {
          statut: 'VALIDEE',
          dateValidation,
        },
      });

      expect(updated.statut).toBe('VALIDEE');
      expect(updated.dateValidation).toBeDefined();
    });
  });

  describe('DELETE /api/demandes/[id] - Supprimer une demande', () => {
    it('devrait supprimer une demande et ses relations', async () => {
      const demande = await prisma.demande.create({
        data: {
          numeroEnregistrement: `TEST-DELETE-${Date.now()}`,
          dateEnregistrement: new Date(),
          statut: 'ENREGISTREE',
          agentId: testUser.id,
          appele: {
            create: {
              nom: 'TO_DELETE',
              prenom: 'User',
              dateNaissance: new Date('1995-01-01'),
              lieuNaissance: 'Niamey',
              diplome: 'Test',
              promotion: '2023',
              dateDebutService: new Date('2023-09-01'),
              dateFinService: new Date('2024-08-31'),
            },
          },
          pieces: {
            create: [
              { type: 'DEMANDE_MANUSCRITE', present: true, conforme: true },
            ],
          },
        },
      });

      await prisma.demande.delete({
        where: { id: demande.id },
      });

      const deleted = await prisma.demande.findUnique({
        where: { id: demande.id },
      });

      expect(deleted).toBeNull();

      // Vérifier que l'appelé est aussi supprimé (cascade)
      const appele = await prisma.appele.findUnique({
        where: { demandeId: demande.id },
      });
      expect(appele).toBeNull();
    });

    it('ne devrait pas supprimer une demande avec attestation', async () => {
      // Créer demande avec attestation
      const demande = await prisma.demande.create({
        data: {
          numeroEnregistrement: `TEST-WITH-ATT-${Date.now()}`,
          dateEnregistrement: new Date(),
          statut: 'SIGNEE',
          agentId: testUser.id,
          attestation: {
            create: {
              numero: `ATT-TEST-${Date.now()}`,
              fichierPath: '/test/path.pdf',
              qrCodeData: '{}',
              statut: 'GENEREE',
            },
          },
        },
      });

      // La suppression devrait échouer ou nécessiter une suppression de l'attestation d'abord
      // selon la stratégie de cascade définie
      await expect(
        prisma.demande.delete({
          where: { id: demande.id },
        })
      ).rejects.toThrow();
    });
  });

  describe('Workflow complet - Cycle de vie d\'une demande', () => {
    it('devrait suivre le workflow complet d\'une demande', async () => {
      // 1. Créer la demande
      const demande = await prisma.demande.create({
        data: {
          numeroEnregistrement: `TEST-WORKFLOW-${Date.now()}`,
          dateEnregistrement: new Date(),
          statut: 'ENREGISTREE',
          agentId: testUser.id,
          appele: {
            create: {
              nom: 'WORKFLOW',
              prenom: 'Test',
              dateNaissance: new Date('1995-01-01'),
              lieuNaissance: 'Niamey',
              diplome: 'Licence',
              promotion: '2023-2024',
              dateDebutService: new Date('2023-09-01'),
              dateFinService: new Date('2024-08-31'),
            },
          },
        },
      });

      expect(demande.statut).toBe('ENREGISTREE');

      // 2. Passer en traitement
      const enTraitement = await prisma.demande.update({
        where: { id: demande.id },
        data: { statut: 'EN_TRAITEMENT' },
      });

      expect(enTraitement.statut).toBe('EN_TRAITEMENT');

      // 3. Valider
      const validee = await prisma.demande.update({
        where: { id: demande.id },
        data: {
          statut: 'VALIDEE',
          dateValidation: new Date(),
        },
      });

      expect(validee.statut).toBe('VALIDEE');
      expect(validee.dateValidation).toBeDefined();

      // 4. Générer attestation
      const avecAttestation = await prisma.demande.update({
        where: { id: demande.id },
        data: {
          statut: 'EN_ATTENTE_SIGNATURE',
          attestation: {
            create: {
              numero: `ATT-WORKFLOW-${Date.now()}`,
              fichierPath: '/test/attestation.pdf',
              qrCodeData: JSON.stringify({ test: true }),
              statut: 'GENEREE',
            },
          },
        },
        include: { attestation: true },
      });

      expect(avecAttestation.attestation).toBeDefined();

      // 5. Signer
      const signee = await prisma.demande.update({
        where: { id: demande.id },
        data: {
          statut: 'SIGNEE',
          dateSignature: new Date(),
        },
      });

      expect(signee.statut).toBe('SIGNEE');
      expect(signee.dateSignature).toBeDefined();

      // 6. Délivrer
      const delivree = await prisma.demande.update({
        where: { id: demande.id },
        data: { statut: 'DELIVREE' },
      });

      expect(delivree.statut).toBe('DELIVREE');
    });
  });
});
