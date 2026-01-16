import { describe, it, expect, vi, beforeEach } from 'vitest';
import { attestationService } from '../attestation.service';
import { prisma } from '../../prisma';
import { qrcodeService } from '../qrcode.service';

// Mock dependencies
vi.mock('../../prisma', () => ({
    prisma: {
        $transaction: vi.fn((callback) => callback(prisma)),
        attestationCounter: {
            findUnique: vi.fn(),
            upsert: vi.fn(),
            update: vi.fn(),
        },
        attestation: {
            create: vi.fn(),
            findUnique: vi.fn(),
        },
        demande: {
            update: vi.fn(),
        },
    },
}));

vi.mock('../qrcode.service', () => ({
    qrcodeService: {
        generateQRCodeBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-qr-code')),
        generateQRData: vi.fn().mockReturnValue('mock-qr-data'),
        parseAndValidateQRData: vi.fn(),
    },
}));

// Mock fs/promises
vi.mock('fs/promises', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual as any,
        readFile: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-template')),
        writeFile: vi.fn().mockResolvedValue(undefined),
        mkdir: vi.fn().mockResolvedValue(undefined),
    };
});

// Mock pdf-lib
vi.mock('pdf-lib', async () => {
    const actual = await vi.importActual('pdf-lib');
    return {
        ...actual,
        PDFDocument: {
            load: vi.fn().mockResolvedValue({
                getPages: vi.fn().mockReturnValue([{
                    drawText: vi.fn(),
                    getWidth: vi.fn().mockReturnValue(600),
                    getHeight: vi.fn().mockReturnValue(800),
                    drawImage: vi.fn(),
                }]),
                embedFont: vi.fn().mockResolvedValue({}),
                embedPng: vi.fn().mockResolvedValue({
                    scale: vi.fn().mockReturnValue({ width: 100, height: 100 }),
                }),
                save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
            }),
            create: vi.fn().mockResolvedValue({
                addPage: vi.fn().mockReturnValue({
                    drawText: vi.fn(),
                }),
                embedFont: vi.fn().mockResolvedValue({}),
                save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
            }),
        },
    };
});


describe('AttestationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('generateNumero', () => {
        it('should generate a correct sequence number for new year', async () => {
            const currentYear = new Date().getFullYear();

            // Mock findUnique to return null (no counter yet)
            vi.mocked(prisma.attestationCounter.findUnique).mockResolvedValue(null);

            // Mock upsert to return new counter
            vi.mocked(prisma.attestationCounter.upsert).mockResolvedValue({
                id: 'singleton',
                year: currentYear,
                counter: 1,
            });

            const numero = await attestationService.generateNumero();

            expect(numero).toBe(`ATT-${currentYear}-00001`);
            expect(prisma.attestationCounter.upsert).toHaveBeenCalled();
        });

        it('should increment existing counter', async () => {
            const currentYear = new Date().getFullYear();

            // Mock findUnique to return existing counter
            vi.mocked(prisma.attestationCounter.findUnique).mockResolvedValue({
                id: 'singleton',
                year: currentYear,
                counter: 10,
            });

            // Mock update to return incremented counter
            vi.mocked(prisma.attestationCounter.update).mockResolvedValue({
                id: 'singleton',
                year: currentYear,
                counter: 11,
            });

            const numero = await attestationService.generateNumero();

            expect(numero).toBe(`ATT-${currentYear}-00011`);
            expect(prisma.attestationCounter.update).toHaveBeenCalled();
        });
    });

    describe('createAttestation', () => {
        it('should create an attestation record and update demand status', async () => {
            // Mock generateNumero via internal logic (or mock the method if possible, but testing logic is better)
            const currentYear = new Date().getFullYear();
            vi.mocked(prisma.attestationCounter.findUnique).mockResolvedValue({
                id: 'singleton',
                year: currentYear,
                counter: 10,
            });
            vi.mocked(prisma.attestationCounter.update).mockResolvedValue({
                id: 'singleton',
                year: currentYear,
                counter: 11,
            });

            vi.mocked(prisma.attestation.create).mockResolvedValue({
                id: 'attestation-123',
                numero: `ATT-${currentYear}-00011`,
            } as any);

            const data = {
                demandeId: 'demande-123',
                nom: 'DOE',
                prenom: 'John',
                dateNaissance: new Date('1990-01-01'),
                lieuNaissance: 'Niamey',
                diplome: 'Master',
                numeroArrete: '2024/001',
                dateDebutService: new Date('2024-01-01'),
                dateFinService: new Date('2024-12-31'),
                promotion: '2024',
            };

            const result = await attestationService.createAttestation('demande-123', data);

            expect(prisma.attestation.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    demandeId: 'demande-123',
                    numero: `ATT-${currentYear}-00011`,
                    statut: 'GENEREE'
                })
            }));

            expect(prisma.demande.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'demande-123' },
                data: { statut: 'EN_ATTENTE_SIGNATURE' },
            }));

            expect(result).toHaveProperty('id', 'attestation-123');
        });
    });
});
