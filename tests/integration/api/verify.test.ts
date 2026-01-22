import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { QRCodeService } from '@/lib/services/qrcode.service';

// Helper pour nettoyer les données de test
async function cleanupTestData() {
  await prisma.attestation.deleteMany({
    where: { numero: { startsWith: 'ATT-TEST-' } },
  });
  await prisma.pieceDossier.deleteMany({
    where: { demande: { numeroEnregistrement: { startsWith: 'TEST-VER-' } } },
  });
  await prisma.appele.deleteMany({
    where: { demande: { numeroEnregistrement: { startsWith: 'TEST-VER-' } } },
  });
  await prisma.demande.deleteMany({
    where: { numeroEnregistrement: { startsWith: 'TEST-VER-' } },
  });
}

// TODO: Tests intégration nécessitent base de données test configurée
describe.skip('API Vérification - Integration Tests', () => {
  let testAttestation: any;
  let testDemande: any;
  let qrCodeService: QRCodeService;

  beforeAll(async () => {
    qrCodeService = new QRCodeService();
    
    // Créer une demande de test avec attestation
    testDemande = await prisma.demande.create({
      data: {
        numeroEnregistrement: `TEST-VER-${Date.now()}`,
        dateEnregistrement: new Date(),
        statut: 'SIGNEE',
        appele: {
          create: {
            nom: 'VERIFICATION',
            prenom: 'Test',
            dateNaissance: new Date('1995-03-15'),
            lieuNaissance: 'Niamey',
            diplome: 'Licence Test',
            promotion: '2023-2024',
            numeroArrete: 'TEST/001',
            dateDebutService: new Date('2023-09-01'),
            dateFinService: new Date('2024-08-31'),
          },
        },
      },
      include: { appele: true },
    });

    // Générer QR Code valide
    const qrData = {
      n: 'ATT-TEST-00001',
      nom: testDemande.appele.nom,
      prenom: testDemande.appele.prenom,
      dn: testDemande.appele.dateNaissance.toISOString().split('T')[0],
      arr: testDemande.appele.numeroArrete,
      dt: new Date().toISOString().split('T')[0],
    };

    const qrCodeData = await qrCodeService.generateQRCodeData(qrData);

    // Créer attestation
    testAttestation = await prisma.attestation.create({
      data: {
        numero: 'ATT-TEST-00001',
        dateGeneration: new Date(),
        dateSignature: new Date(),
        typeSignature: 'ELECTRONIQUE',
        fichierPath: '/test/attestation.pdf',
        qrCodeData: qrCodeData,
        statut: 'SIGNEE',
        demandeId: testDemande.id,
      },
    });
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Rien à nettoyer entre les tests
  });

  describe('GET /api/verifier - Vérification par numéro', () => {
    it('devrait vérifier une attestation valide par numéro', async () => {
      const attestation = await prisma.attestation.findUnique({
        where: { numero: testAttestation.numero },
        include: {
          demande: {
            include: {
              appele: true,
            },
          },
        },
      });

      expect(attestation).toBeDefined();
      expect(attestation?.numero).toBe('ATT-TEST-00001');
      expect(attestation?.demande.appele).toBeDefined();
      expect(attestation?.demande.appele?.nom).toBe('VERIFICATION');
    });

    it('devrait retourner null pour un numéro invalide', async () => {
      const attestation = await prisma.attestation.findUnique({
        where: { numero: 'ATT-INVALID-99999' },
      });

      expect(attestation).toBeNull();
    });

    it('devrait normaliser le numéro (majuscules, trim)', async () => {
      const attestation = await prisma.attestation.findUnique({
        where: { numero: '  att-test-00001  '.trim().toUpperCase() },
        include: {
          demande: {
            include: {
              appele: true,
            },
          },
        },
      });

      expect(attestation).toBeDefined();
    });

    it('devrait inclure toutes les informations nécessaires', async () => {
      const attestation = await prisma.attestation.findUnique({
        where: { numero: testAttestation.numero },
        include: {
          demande: {
            include: {
              appele: true,
            },
          },
          signataire: {
            select: {
              nom: true,
              prenom: true,
            },
          },
        },
      });

      expect(attestation).toBeDefined();
      expect(attestation?.demande.appele).toBeDefined();
      expect(attestation?.dateGeneration).toBeDefined();
      expect(attestation?.typeSignature).toBe('ELECTRONIQUE');
    });
  });

  describe('GET /api/verifier/[code] - Vérification par QR Code', () => {
    it('devrait vérifier un QR Code valide', async () => {
      const qrCodeData = JSON.parse(testAttestation.qrCodeData);

      // Vérifier le HMAC
      const isValid = await qrCodeService.verifyQRCode(qrCodeData);

      expect(isValid).toBe(true);
    });

    it('devrait rejeter un QR Code avec HMAC invalide', async () => {
      const invalidQRData = {
        n: 'ATT-TEST-00001',
        nom: 'VERIFICATION',
        prenom: 'Test',
        dn: '1995-03-15',
        arr: 'TEST/001',
        dt: '2026-01-22',
        h: 'invalid-hmac-signature',
      };

      const isValid = await qrCodeService.verifyQRCode(invalidQRData);

      expect(isValid).toBe(false);
    });

    it('devrait rejeter un QR Code avec données modifiées', async () => {
      const qrCodeData = JSON.parse(testAttestation.qrCodeData);
      
      // Modifier le nom sans recalculer le HMAC
      qrCodeData.nom = 'MODIFIED';

      const isValid = await qrCodeService.verifyQRCode(qrCodeData);

      expect(isValid).toBe(false);
    });

    it('devrait extraire les données du QR Code', async () => {
      const qrCodeData = JSON.parse(testAttestation.qrCodeData);

      expect(qrCodeData.n).toBe('ATT-TEST-00001');
      expect(qrCodeData.nom).toBe('VERIFICATION');
      expect(qrCodeData.prenom).toBe('Test');
      expect(qrCodeData.dn).toBe('1995-03-15');
      expect(qrCodeData.arr).toBe('TEST/001');
      expect(qrCodeData.h).toBeDefined();
    });

    it('devrait récupérer l\'attestation après vérification QR', async () => {
      const qrCodeData = JSON.parse(testAttestation.qrCodeData);
      const isValid = await qrCodeService.verifyQRCode(qrCodeData);

      if (isValid) {
        const attestation = await prisma.attestation.findUnique({
          where: { numero: qrCodeData.n },
          include: {
            demande: {
              include: {
                appele: true,
              },
            },
          },
        });

        expect(attestation).toBeDefined();
        expect(attestation?.numero).toBe(qrCodeData.n);
        expect(attestation?.demande.appele?.nom).toBe(qrCodeData.nom);
      }
    });
  });

  describe('Sécurité - Tests de falsification', () => {
    it('ne devrait pas accepter un QR Code sans HMAC', async () => {
      const qrWithoutHMAC = {
        n: 'ATT-TEST-00001',
        nom: 'VERIFICATION',
        prenom: 'Test',
        dn: '1995-03-15',
        arr: 'TEST/001',
        dt: '2026-01-22',
        // Pas de champ h (HMAC)
      };

      const isValid = await qrCodeService.verifyQRCode(qrWithoutHMAC);

      expect(isValid).toBe(false);
    });

    it('ne devrait pas accepter un HMAC d\'une autre attestation', async () => {
      // Créer un autre QR Code valide
      const otherQRData = {
        n: 'ATT-TEST-00002',
        nom: 'OTHER',
        prenom: 'User',
        dn: '1996-05-20',
        arr: 'TEST/002',
        dt: '2026-01-22',
      };

      const validQRCode = await qrCodeService.generateQRCodeData(otherQRData);
      const validParsed = JSON.parse(validQRCode);

      // Essayer d'utiliser ce HMAC avec les données de l'attestation de test
      const tamperedQR = {
        n: 'ATT-TEST-00001',
        nom: 'VERIFICATION',
        prenom: 'Test',
        dn: '1995-03-15',
        arr: 'TEST/001',
        dt: '2026-01-22',
        h: validParsed.h, // HMAC d'une autre attestation
      };

      const isValid = await qrCodeService.verifyQRCode(tamperedQR);

      expect(isValid).toBe(false);
    });

    it('devrait détecter la modification du numéro d\'attestation', async () => {
      const qrCodeData = JSON.parse(testAttestation.qrCodeData);
      
      // Changer le numéro
      qrCodeData.n = 'ATT-FAKE-99999';

      const isValid = await qrCodeService.verifyQRCode(qrCodeData);

      expect(isValid).toBe(false);
    });

    it('devrait détecter la modification de la date', async () => {
      const qrCodeData = JSON.parse(testAttestation.qrCodeData);
      
      // Changer la date
      qrCodeData.dt = '2030-12-31';

      const isValid = await qrCodeService.verifyQRCode(qrCodeData);

      expect(isValid).toBe(false);
    });

    it('devrait détecter la modification du numéro d\'arrêté', async () => {
      const qrCodeData = JSON.parse(testAttestation.qrCodeData);
      
      // Changer le numéro d'arrêté
      qrCodeData.arr = 'FAKE/999';

      const isValid = await qrCodeService.verifyQRCode(qrCodeData);

      expect(isValid).toBe(false);
    });
  });

  describe('Cas limites', () => {
    it('devrait gérer les caractères spéciaux dans les noms', async () => {
      const demandeSpecial = await prisma.demande.create({
        data: {
          numeroEnregistrement: `TEST-VER-SPECIAL-${Date.now()}`,
          dateEnregistrement: new Date(),
          statut: 'SIGNEE',
          appele: {
            create: {
              nom: 'N\'GUESSAN',
              prenom: 'Jean-François',
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
        include: { appele: true },
      });

      const qrData = {
        n: `ATT-TEST-SPECIAL-${Date.now()}`,
        nom: demandeSpecial.appele.nom,
        prenom: demandeSpecial.appele.prenom,
        dn: demandeSpecial.appele.dateNaissance.toISOString().split('T')[0],
        arr: demandeSpecial.appele.numeroArrete,
        dt: new Date().toISOString().split('T')[0],
      };

      const qrCodeData = await qrCodeService.generateQRCodeData(qrData);
      const parsed = JSON.parse(qrCodeData);
      const isValid = await qrCodeService.verifyQRCode(parsed);

      expect(isValid).toBe(true);
      expect(parsed.nom).toBe('N\'GUESSAN');
      expect(parsed.prenom).toBe('Jean-François');
    });

    it('devrait gérer les numéros d\'attestation très longs', async () => {
      const longNumero = 'ATT-2026-99999';
      
      const qrData = {
        n: longNumero,
        nom: 'TEST',
        prenom: 'User',
        dn: '1995-03-15',
        arr: 'TEST/001',
        dt: '2026-01-22',
      };

      const qrCodeData = await qrCodeService.generateQRCodeData(qrData);
      const parsed = JSON.parse(qrCodeData);
      const isValid = await qrCodeService.verifyQRCode(parsed);

      expect(isValid).toBe(true);
      expect(parsed.n).toBe(longNumero);
    });

    it('devrait gérer les dates de naissance anciennes', async () => {
      const qrData = {
        n: 'ATT-TEST-OLD',
        nom: 'ANCIEN',
        prenom: 'Personne',
        dn: '1950-01-01', // Date très ancienne
        arr: 'TEST/001',
        dt: '2026-01-22',
      };

      const qrCodeData = await qrCodeService.generateQRCodeData(qrData);
      const parsed = JSON.parse(qrCodeData);
      const isValid = await qrCodeService.verifyQRCode(parsed);

      expect(isValid).toBe(true);
    });
  });

  describe('Performance', () => {
    it('devrait vérifier rapidement un grand nombre de QR Codes', async () => {
      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < 100; i++) {
        const qrData = {
          n: `ATT-PERF-${i}`,
          nom: 'PERFORMANCE',
          prenom: 'Test',
          dn: '1995-03-15',
          arr: 'PERF/001',
          dt: '2026-01-22',
        };

        const qrCodeData = qrCodeService.generateQRCodeData(qrData);
        promises.push(qrCodeData);
      }

      await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Devrait prendre moins de 5 secondes pour 100 QR Codes
      expect(duration).toBeLessThan(5000);
    });
  });
});
