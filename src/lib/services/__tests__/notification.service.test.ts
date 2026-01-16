import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService, SendNotificationOptions } from '../notification.service';
import { prisma } from '../../prisma';
import { emailService } from '../email.service';
import { smsService } from '../sms.service';
import { whatsappService } from '../whatsapp.service';
import { CanalNotification, TypeNotification, StatutNotification } from '@prisma/client';

// Mock dependencies
vi.mock('../../prisma', () => ({
    prisma: {
        demande: {
            findUnique: vi.fn(),
        },
        notification: {
            create: vi.fn(),
            findMany: vi.fn(),
        },
    },
}));

vi.mock('../email.service', () => ({
    emailService: {
        sendConfirmationDepot: vi.fn(),
        sendDemandeRejetee: vi.fn(),
        sendAttestationPrete: vi.fn(),
        testConnection: vi.fn(),
    },
}));

vi.mock('../sms.service', () => ({
    smsService: {
        sendConfirmationDepot: vi.fn(),
        sendDemandeRejetee: vi.fn(),
        sendAttestationPrete: vi.fn(),
        testConnection: vi.fn(),
    },
}));

vi.mock('../whatsapp.service', () => ({
    whatsappService: {
        sendConfirmationDepot: vi.fn(),
        sendDemandeRejetee: vi.fn(),
        sendAttestationPrete: vi.fn(),
        testConnection: vi.fn(),
    },
}));

describe('NotificationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('send', () => {
        it('should send email notifications correctly', async () => {
            // Mock demande data
            vi.mocked(prisma.demande.findUnique).mockResolvedValue({
                id: 'demande-123',
                appele: {
                    nom: 'DOE',
                    prenom: 'John',
                    email: 'john.doe@example.com',
                    telephone: '12345678',
                    whatsapp: '12345678',
                },
            } as any);

            // Mock email success
            vi.mocked(emailService.sendConfirmationDepot).mockResolvedValue(true);

            const options: SendNotificationOptions = {
                demandeId: 'demande-123',
                type: 'CONFIRMATION_DEPOT' as any, // TypeNotification enum might be tricky to import if purely value based not const
                canaux: ['EMAIL'] as any,
                data: {
                    numeroEnregistrement: 'REQ-001',
                    nom: 'DOE',
                    prenom: 'John',
                    dateEnregistrement: '2024-01-01',
                },
            };

            const results = await notificationService.send(options);

            expect(emailService.sendConfirmationDepot).toHaveBeenCalledWith(
                'john.doe@example.com',
                expect.objectContaining({ numeroEnregistrement: 'REQ-001' })
            );

            expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    canal: 'EMAIL',
                    statut: 'ENVOYEE',
                    demandeId: 'demande-123'
                })
            }));

            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({ canal: 'EMAIL', success: true, error: undefined });
        });

        it('should handle missing contact info gracefully', async () => {
            vi.mocked(prisma.demande.findUnique).mockResolvedValue({
                id: 'demande-123',
                appele: {
                    nom: 'DOE',
                    prenom: 'John',
                    email: null, // No email
                },
            } as any);

            const options: SendNotificationOptions = {
                demandeId: 'demande-123',
                type: 'CONFIRMATION_DEPOT' as any,
                canaux: ['EMAIL'] as any,
                data: { numeroEnregistrement: 'REQ-001' },
            };

            const results = await notificationService.send(options);

            expect(results[0]).toEqual({ canal: 'EMAIL', success: false, error: 'Email non renseigné' });
            expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    statut: 'ECHEC',
                    messageErreur: 'Email non renseigné'
                })
            }));
        });

        it('should send multiple channels', async () => {
            vi.mocked(prisma.demande.findUnique).mockResolvedValue({
                id: 'demande-123',
                appele: {
                    nom: 'DOE',
                    prenom: 'John',
                    email: 'john@test.com',
                    telephone: '12345678',
                },
            } as any);

            vi.mocked(emailService.sendConfirmationDepot).mockResolvedValue(true);
            vi.mocked(smsService.sendConfirmationDepot).mockResolvedValue(true);

            const options: SendNotificationOptions = {
                demandeId: 'demande-123',
                type: 'CONFIRMATION_DEPOT' as any,
                canaux: ['EMAIL', 'SMS'] as any,
                data: { numeroEnregistrement: 'REQ-001' },
            };

            const results = await notificationService.send(options);

            expect(results).toHaveLength(2);
            expect(results.find(r => r.canal === 'EMAIL')?.success).toBe(true);
            expect(results.find(r => r.canal === 'SMS')?.success).toBe(true);
            expect(prisma.notification.create).toHaveBeenCalledTimes(2);
        });
    });
});
