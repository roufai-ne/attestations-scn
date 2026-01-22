import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { AttestationService } from '@/lib/services/attestation.service';

// Helper pour créer un utilisateur de test
async function createTestUser(role: string = 'AGENT') {
  return await prisma.user.create({
    data: {
      email: `test-${role.toLowerCase()}-${Date.now()}@test.com`,
      nom: `Test ${role}`,
      prenom: 'User',
      passwordHash: 'test-hash',
      role: role,
    },
  });
}

// Helper pour nettoyer les données de test
async function cleanupTestData() {
  await prisma.attestation.deleteMany({
    where: { numero: { startsWith: 'ATT-TEST-' } },
  });
  await prisma.pieceDossier.deleteMany({
    where: { demande: { numeroEnregistrement: { startsWith: 'TEST-GEN-' } } },
  });
  await prisma.appele.deleteMany({
    where: { demande: { numeroEnregistrement: { startsWith: 'TEST-GEN-' } } },
  });
  await prisma.demande.deleteMany({
    where: { numeroEnregistrement: { startsWith: 'TEST-GEN-' } },
  });
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'test-' } },
  });
  await prisma.template.deleteMany({
    where: { nom: { startsWith: 'TEST-' } },
  });
}

// TODO: Tests intégration nécessitent base de données test configurée
describe.skip('API Génération Attestations - Integration Tests', () => {
  let testAgent: any;
  let testDemande: any;
  let testTemplate: any;
  let attestationService: AttestationService;

  beforeAll(async () => {
    attestationService = new AttestationService();

    // Créer un agent de test
    testAgent = await createTestUser('AGENT');

    // Créer un template de test
    testTemplate = await prisma.template.create({
      data: {
        nom: `TEST-Template-${Date.now()}`,
        fichierPath: '/test/template.pdf',
        actif: true,
        positions: JSON.stringify({
          nom: { x: 100, y: 200, fontSize: 12 },
          prenom: { x: 100, y: 220, fontSize: 12 },
          dateNaissance: { x: 100, y: 240, fontSize: 12 },
          numeroArrete: { x: 100, y: 260, fontSize: 12 },
          dateDebut: { x: 100, y: 280, fontSize: 12 },
          dateFin: { x: 100, y: 300, fontSize: 12 },
          numero: { x: 100, y: 320, fontSize: 12 },
          qrCode: { x: 400, y: 600, size: 100 },
        }),
      },
    });

    // Créer une demande validée de test
    testDemande = await prisma.demande.create({
      data: {
        numeroEnregistrement: `TEST-GEN-${Date.now()}`,
        dateEnregistrement: new Date(),
        statut: 'VALIDEE',
        dateValidation: new Date(),
        agentId: testAgent.id,
        appele: {
          create: {
            nom: 'GENERATION',
            prenom: 'Test',
            dateNaissance: new Date('1995-03-15'),
            lieuNaissance: 'Niamey',
            diplome: 'Licence Test',
            promotion: '2023-2024',
            numeroArrete: 'TEST/001/2023',
            dateDebutService: new Date('2023-09-01'),
            dateFinService: new Date('2024-08-31'),
          },
        },
        pieces: {
          createMany: {
            data: [
              { type: 'CNI', present: true, conforme: true },
              { type: 'DIPLOME', present: true, conforme: true },
              { type: 'CERTIFICAT_SERVICE', present: true, conforme: true },
              { type: 'ARRETE_NOMINATION', present: true, conforme: true },
              { type: 'AUTRES', present: true, conforme: true, observation: 'Photo' },
            ],
          },
        },
      },
      include: {
        appele: true,
        pieces: true,
      },
    });
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Nettoyer les attestations entre les tests
    await prisma.attestation.deleteMany({
      where: { demandeId: testDemande.id },
    });
  });

  describe('POST /api/attestations/generate - Génération normale', () => {
    it('devrait générer une attestation avec toutes les données', async () => {
      const attestation = await attestationService.generateAttestation(testDemande.id);

      expect(attestation).toBeDefined();
      expect(attestation.numero).toMatch(/^ATT-\d{4}-\d{5}$/);
      expect(attestation.demandeId).toBe(testDemande.id);
      expect(attestation.statut).toBe('EN_ATTENTE_SIGNATURE');
      expect(attestation.fichierPath).toBeDefined();
      expect(attestation.qrCodeData).toBeDefined();
    });

    it('devrait incrémenter automatiquement le compteur', async () => {
      const attestation1 = await attestationService.generateAttestation(testDemande.id);
      await prisma.attestation.delete({ where: { id: attestation1.id } });

      const attestation2 = await attestationService.generateAttestation(testDemande.id);

      const numero1 = parseInt(attestation1.numero.split('-')[2]);
      const numero2 = parseInt(attestation2.numero.split('-')[2]);

      expect(numero2).toBeGreaterThan(numero1);
    });

    it('devrait inclure le QR Code avec HMAC', async () => {
      const attestation = await attestationService.generateAttestation(testDemande.id);

      const qrData = JSON.parse(attestation.qrCodeData);

      expect(qrData).toHaveProperty('n');
      expect(qrData).toHaveProperty('nom');
      expect(qrData).toHaveProperty('prenom');
      expect(qrData).toHaveProperty('dn');
      expect(qrData).toHaveProperty('arr');
      expect(qrData).toHaveProperty('dt');
      expect(qrData).toHaveProperty('h'); // HMAC
      expect(qrData.nom).toBe('GENERATION');
      expect(qrData.prenom).toBe('Test');
    });

    it('devrait mettre à jour le statut de la demande', async () => {
      await attestationService.generateAttestation(testDemande.id);

      const demandeMiseAJour = await prisma.demande.findUnique({
        where: { id: testDemande.id },
      });

      expect(demandeMiseAJour?.statut).toBe('EN_ATTENTE_SIGNATURE');
    });

    it('devrait créer le fichier PDF', async () => {
      const attestation = await attestationService.generateAttestation(testDemande.id);

      expect(attestation.fichierPath).toBeTruthy();
      expect(attestation.fichierPath).toMatch(/\.pdf$/);
    });
  });

  describe('Validation des données', () => {
    it('devrait rejeter une demande inexistante', async () => {
      await expect(
        attestationService.generateAttestation('demande-invalide-999')
      ).rejects.toThrow();
    });

    it('devrait rejeter une demande sans statut VALIDEE', async () => {
      const demandeNonValidee = await prisma.demande.create({
        data: {
          numeroEnregistrement: `TEST-GEN-NON-VALIDEE-${Date.now()}`,
          dateEnregistrement: new Date(),
          statut: 'ENREGISTREE',
          agentId: testAgent.id,
          appele: {
            create: {
              nom: 'NON',
              prenom: 'Validee',
              dateNaissance: new Date('1995-03-15'),
              lieuNaissance: 'Niamey',
              diplome: 'Licence',
              promotion: '2023-2024',
              numeroArrete: 'TEST/002',
              dateDebutService: new Date('2023-09-01'),
              dateFinService: new Date('2024-08-31'),
            },
          },
        },
      });

      await expect(
        attestationService.generateAttestation(demandeNonValidee.id)
      ).rejects.toThrow();
    });

    it('devrait rejeter si aucun template actif', async () => {
      // Désactiver tous les templates
      await prisma.template.updateMany({
        where: { actif: true },
        data: { actif: false },
      });

      await expect(
        attestationService.generateAttestation(testDemande.id)
      ).rejects.toThrow();

      // Réactiver le template de test
      await prisma.template.update({
        where: { id: testTemplate.id },
        data: { actif: true },
      });
    });

    it('ne devrait pas générer deux fois pour la même demande', async () => {
      await attestationService.generateAttestation(testDemande.id);

      await expect(
        attestationService.generateAttestation(testDemande.id)
      ).rejects.toThrow();
    });
  });

  describe('Format du numéro d\'attestation', () => {
    it('devrait générer un numéro au format ATT-AAAA-XXXXX', async () => {
      const attestation = await attestationService.generateAttestation(testDemande.id);

      expect(attestation.numero).toMatch(/^ATT-\d{4}-\d{5}$/);
    });

    it('devrait utiliser l\'année courante', async () => {
      const attestation = await attestationService.generateAttestation(testDemande.id);
      const annee = new Date().getFullYear();

      expect(attestation.numero).toContain(`ATT-${annee}-`);
    });

    it('devrait padder le compteur avec des zéros', async () => {
      const attestation = await attestationService.generateAttestation(testDemande.id);
      const compteur = attestation.numero.split('-')[2];

      expect(compteur.length).toBe(5);
      expect(compteur).toMatch(/^\d{5}$/);
    });
  });

  describe('Gestion des données de l\'appelé', () => {
    it('devrait formater correctement les dates', async () => {
      const attestation = await attestationService.generateAttestation(testDemande.id);
      const qrData = JSON.parse(attestation.qrCodeData);

      expect(qrData.dn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(qrData.dt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('devrait inclure toutes les informations de l\'appelé dans le QR', async () => {
      const attestation = await attestationService.generateAttestation(testDemande.id);
      const qrData = JSON.parse(attestation.qrCodeData);

      expect(qrData.nom).toBe(testDemande.appele.nom);
      expect(qrData.prenom).toBe(testDemande.appele.prenom);
      expect(qrData.arr).toBe(testDemande.appele.numeroArrete);
    });

    it('devrait gérer les caractères spéciaux dans les noms', async () => {
      const demandeSpecial = await prisma.demande.create({
        data: {
          numeroEnregistrement: `TEST-GEN-SPECIAL-${Date.now()}`,
          dateEnregistrement: new Date(),
          statut: 'VALIDEE',
          dateValidation: new Date(),
          agentId: testAgent.id,
          appele: {
            create: {
              nom: 'N\'GUESSAN',
              prenom: 'Jean-François',
              dateNaissance: new Date('1995-03-15'),
              lieuNaissance: 'Niamey',
              diplome: 'Licence',
              promotion: '2023-2024',
              numeroArrete: 'TEST/003',
              dateDebutService: new Date('2023-09-01'),
              dateFinService: new Date('2024-08-31'),
            },
          },
        },
      });

      const attestation = await attestationService.generateAttestation(demandeSpecial.id);
      const qrData = JSON.parse(attestation.qrCodeData);

      expect(qrData.nom).toBe('N\'GUESSAN');
      expect(qrData.prenom).toBe('Jean-François');
    });
  });

  describe('Transactions et concurrence', () => {
    it('devrait gérer la génération concurrente', async () => {
      // Créer plusieurs demandes
      const demandes = await Promise.all(
        [1, 2, 3].map((i) =>
          prisma.demande.create({
            data: {
              numeroEnregistrement: `TEST-GEN-CONCURRENT-${i}-${Date.now()}`,
              dateEnregistrement: new Date(),
              statut: 'VALIDEE',
              dateValidation: new Date(),
              agentId: testAgent.id,
              appele: {
                create: {
                  nom: `CONCURRENT-${i}`,
                  prenom: 'Test',
                  dateNaissance: new Date('1995-03-15'),
                  lieuNaissance: 'Niamey',
                  diplome: 'Licence',
                  promotion: '2023-2024',
                  numeroArrete: `TEST/CONC-${i}`,
                  dateDebutService: new Date('2023-09-01'),
                  dateFinService: new Date('2024-08-31'),
                },
              },
            },
          })
        )
      );

      // Générer en parallèle
      const attestations = await Promise.all(
        demandes.map((d) => attestationService.generateAttestation(d.id))
      );

      // Vérifier que tous les numéros sont uniques
      const numeros = attestations.map((a) => a.numero);
      const uniqueNumeros = new Set(numeros);

      expect(uniqueNumeros.size).toBe(3);
    });
  });

  describe('Rollback en cas d\'erreur', () => {
    it('ne devrait pas créer d\'attestation si la génération PDF échoue', async () => {
      // Mock d'une erreur de génération PDF (difficile sans mocker le service)
      // Ce test vérifie plutôt la cohérence de la base après une erreur

      const demandeTest = await prisma.demande.create({
        data: {
          numeroEnregistrement: `TEST-GEN-ROLLBACK-${Date.now()}`,
          dateEnregistrement: new Date(),
          statut: 'VALIDEE',
          dateValidation: new Date(),
          agentId: testAgent.id,
          appele: {
            create: {
              nom: 'ROLLBACK',
              prenom: 'Test',
              dateNaissance: new Date('1995-03-15'),
              lieuNaissance: 'Niamey',
              diplome: 'Licence',
              promotion: '2023-2024',
              numeroArrete: 'TEST/ROLL',
              dateDebutService: new Date('2023-09-01'),
              dateFinService: new Date('2024-08-31'),
            },
          },
        },
      });

      try {
        await attestationService.generateAttestation(demandeTest.id);
      } catch (error) {
        // Si erreur, vérifier que rien n'est créé
        const attestationCreee = await prisma.attestation.findFirst({
          where: { demandeId: demandeTest.id },
        });

        // Soit l'attestation n'existe pas, soit elle est en erreur
        if (attestationCreee) {
          expect(attestationCreee.statut).not.toBe('SIGNEÉ');
        }
      }
    });
  });

  describe('Performance', () => {
    it('devrait générer rapidement une attestation', async () => {
      const startTime = Date.now();
      await attestationService.generateAttestation(testDemande.id);
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Devrait prendre moins de 3 secondes
      expect(duration).toBeLessThan(3000);
    });

    it('devrait gérer un lot de générations', async () => {
      const demandes = await Promise.all(
        Array.from({ length: 10 }).map((_, i) =>
          prisma.demande.create({
            data: {
              numeroEnregistrement: `TEST-GEN-BATCH-${i}-${Date.now()}`,
              dateEnregistrement: new Date(),
              statut: 'VALIDEE',
              dateValidation: new Date(),
              agentId: testAgent.id,
              appele: {
                create: {
                  nom: `BATCH-${i}`,
                  prenom: 'Test',
                  dateNaissance: new Date('1995-03-15'),
                  lieuNaissance: 'Niamey',
                  diplome: 'Licence',
                  promotion: '2023-2024',
                  numeroArrete: `TEST/BATCH-${i}`,
                  dateDebutService: new Date('2023-09-01'),
                  dateFinService: new Date('2024-08-31'),
                },
              },
            },
          })
        )
      );

      const startTime = Date.now();
      await Promise.all(demandes.map((d) => attestationService.generateAttestation(d.id)));
      const endTime = Date.now();

      const duration = endTime - startTime;

      // 10 attestations en moins de 10 secondes
      expect(duration).toBeLessThan(10000);
    });
  });
});
