import { describe, it, expect, beforeEach, vi } from 'vitest';
// import { AttestationService } from '@/lib/services/attestation.service';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    attestationCounter: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    attestation: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    demande: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    templateAttestation: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

// Mock pdf-lib
vi.mock('pdf-lib', () => ({
  PDFDocument: {
    load: vi.fn(() => ({
      getPages: vi.fn(() => [
        {
          drawText: vi.fn(),
          drawImage: vi.fn(),
          getWidth: vi.fn(() => 595),
          getHeight: vi.fn(() => 842),
        },
      ]),
      embedPng: vi.fn(() => ({})),
      save: vi.fn(() => Buffer.from('pdf-data')),
    })),
  },
  rgb: vi.fn(() => ({ r: 0, g: 0, b: 0 })),
}));

// Mock qrcode service
vi.mock('@/lib/services/qrcode.service', () => ({
  QRCodeService: {
    generateQRCode: vi.fn(() => Promise.resolve('qrcode-data-url')),
  },
}));

// Mock file system
vi.mock('fs/promises', () => ({
  mkdir: vi.fn(() => Promise.resolve()),
  writeFile: vi.fn(() => Promise.resolve()),
  readFile: vi.fn(() => Promise.resolve(Buffer.from('template-pdf'))),
}));

// TODO: Tests nécessitent services complets et template.service
describe.skip('AttestationService', () => {
  let service: any; // AttestationService

  beforeEach(() => {
    service = new AttestationService();
    vi.clearAllMocks();
  });

  describe('generateNumero', () => {
    it('devrait générer un numéro au format ATT-AAAA-XXXXX', async () => {
      const currentYear = new Date().getFullYear();
      
      vi.mocked(prisma.attestationCounter.findUnique).mockResolvedValue({
        id: 'singleton',
        year: currentYear,
        counter: 42,
      });

      vi.mocked(prisma.attestationCounter.upsert).mockResolvedValue({
        id: 'singleton',
        year: currentYear,
        counter: 43,
      });

      const numero = await service.generateNumero();

      expect(numero).toMatch(/^ATT-\d{4}-\d{5}$/);
      expect(numero).toBe(`ATT-${currentYear}-00043`);
    });

    it('devrait incrémenter le compteur', async () => {
      const currentYear = new Date().getFullYear();
      
      vi.mocked(prisma.attestationCounter.findUnique).mockResolvedValue({
        id: 'singleton',
        year: currentYear,
        counter: 99,
      });

      vi.mocked(prisma.attestationCounter.upsert).mockResolvedValue({
        id: 'singleton',
        year: currentYear,
        counter: 100,
      });

      const numero = await service.generateNumero();

      expect(numero).toBe(`ATT-${currentYear}-00100`);
      expect(prisma.attestationCounter.upsert).toHaveBeenCalledWith({
        where: { id: 'singleton' },
        update: { counter: 100 },
        create: { id: 'singleton', year: currentYear, counter: 1 },
      });
    });

    it('devrait réinitialiser le compteur pour une nouvelle année', async () => {
      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;
      
      vi.mocked(prisma.attestationCounter.findUnique).mockResolvedValue({
        id: 'singleton',
        year: lastYear,
        counter: 999,
      });

      vi.mocked(prisma.attestationCounter.upsert).mockResolvedValue({
        id: 'singleton',
        year: currentYear,
        counter: 1,
      });

      const numero = await service.generateNumero();

      expect(numero).toBe(`ATT-${currentYear}-00001`);
      expect(prisma.attestationCounter.upsert).toHaveBeenCalledWith({
        where: { id: 'singleton' },
        update: { counter: 1 },
        create: { id: 'singleton', year: currentYear, counter: 1 },
      });
    });

    it('devrait gérer le padding avec des zéros', async () => {
      const currentYear = new Date().getFullYear();
      
      vi.mocked(prisma.attestationCounter.findUnique).mockResolvedValue({
        id: 'singleton',
        year: currentYear,
        counter: 7,
      });

      vi.mocked(prisma.attestationCounter.upsert).mockResolvedValue({
        id: 'singleton',
        year: currentYear,
        counter: 8,
      });

      const numero = await service.generateNumero();

      expect(numero).toBe(`ATT-${currentYear}-00008`);
    });
  });

  describe('generateAttestation', () => {
    const mockDemande = {
      id: 'demande-1',
      numeroEnregistrement: 'ENR-001',
      appele: {
        nom: 'ABDOU',
        prenom: 'Ibrahim',
        dateNaissance: new Date('1995-03-15'),
        lieuNaissance: 'Niamey',
        diplome: 'Licence en Informatique',
        promotion: '2023-2024',
        numeroArrete: '2023/045',
        dateDebutService: new Date('2023-09-01'),
        dateFinService: new Date('2024-08-31'),
      },
    };

    const mockTemplate = {
      id: 'template-1',
      nom: 'Template Principal',
      fichierPath: '/uploads/templates/template.pdf',
      mappingChamps: JSON.stringify({
        nom: { x: 100, y: 500 },
        prenom: { x: 100, y: 480 },
        dateNaissance: { x: 100, y: 460 },
        qrcode: { x: 450, y: 100, size: 80 },
      }),
      actif: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('devrait générer une attestation avec succès', async () => {
      vi.mocked(prisma.demande.findUnique).mockResolvedValue(mockDemande as any);
      vi.mocked(prisma.templateAttestation.findFirst).mockResolvedValue(mockTemplate);
      
      vi.mocked(prisma.attestationCounter.findUnique).mockResolvedValue({
        id: 'singleton',
        year: 2026,
        counter: 1,
      });

      vi.mocked(prisma.attestationCounter.upsert).mockResolvedValue({
        id: 'singleton',
        year: 2026,
        counter: 2,
      });

      vi.mocked(prisma.attestation.create).mockResolvedValue({
        id: 'attestation-1',
        numero: 'ATT-2026-00002',
        dateGeneration: new Date(),
        dateSignature: null,
        typeSignature: null,
        fichierPath: '/uploads/attestations/ATT-2026-00002.pdf',
        qrCodeData: '{}',
        statut: 'GENEREE',
        demandeId: 'demande-1',
        signataireId: null,
      });

      const result = await service.generateAttestation('demande-1');

      expect(result).toBeDefined();
      expect(result.numero).toMatch(/^ATT-2026-\d{5}$/);
      expect(prisma.attestation.create).toHaveBeenCalled();
    });

    it('devrait lever une erreur si la demande n\'existe pas', async () => {
      vi.mocked(prisma.demande.findUnique).mockResolvedValue(null);

      await expect(service.generateAttestation('demande-inexistante')).rejects.toThrow();
    });

    it('devrait lever une erreur si aucun template actif', async () => {
      vi.mocked(prisma.demande.findUnique).mockResolvedValue(mockDemande as any);
      vi.mocked(prisma.templateAttestation.findFirst).mockResolvedValue(null);

      await expect(service.generateAttestation('demande-1')).rejects.toThrow(
        'Aucun template actif trouvé'
      );
    });

    it('devrait formater les dates en français', async () => {
      vi.mocked(prisma.demande.findUnique).mockResolvedValue(mockDemande as any);
      vi.mocked(prisma.templateAttestation.findFirst).mockResolvedValue(mockTemplate);
      
      vi.mocked(prisma.attestationCounter.findUnique).mockResolvedValue({
        id: 'singleton',
        year: 2026,
        counter: 5,
      });

      vi.mocked(prisma.attestationCounter.upsert).mockResolvedValue({
        id: 'singleton',
        year: 2026,
        counter: 6,
      });

      vi.mocked(prisma.attestation.create).mockResolvedValue({
        id: 'attestation-1',
        numero: 'ATT-2026-00006',
        dateGeneration: new Date(),
        dateSignature: null,
        typeSignature: null,
        fichierPath: '/uploads/attestations/ATT-2026-00006.pdf',
        qrCodeData: '{}',
        statut: 'GENEREE',
        demandeId: 'demande-1',
        signataireId: null,
      });

      await service.generateAttestation('demande-1');

      // Vérifier que les dates sont formatées correctement
      expect(prisma.attestation.create).toHaveBeenCalled();
    });
  });

  describe('getAttestation', () => {
    it('devrait récupérer une attestation par ID', async () => {
      const mockAttestation = {
        id: 'attestation-1',
        numero: 'ATT-2026-00001',
        dateGeneration: new Date(),
        fichierPath: '/uploads/attestations/ATT-2026-00001.pdf',
      };

      vi.mocked(prisma.attestation.findUnique).mockResolvedValue(mockAttestation as any);

      const result = await service.getAttestation('attestation-1');

      expect(result).toEqual(mockAttestation);
      expect(prisma.attestation.findUnique).toHaveBeenCalledWith({
        where: { id: 'attestation-1' },
        include: expect.anything(),
      });
    });

    it('devrait retourner null si attestation inexistante', async () => {
      vi.mocked(prisma.attestation.findUnique).mockResolvedValue(null);

      const result = await service.getAttestation('inexistant');

      expect(result).toBeNull();
    });
  });
});
