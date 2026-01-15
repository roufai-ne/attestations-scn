import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prismaMock, resetPrismaMock } from '../../mocks/prisma.mock'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

import { AuditService, AuditAction } from '@/lib/audit/audit.service'

describe('AuditService', () => {
  let auditService: AuditService

  beforeEach(() => {
    vi.clearAllMocks()
    resetPrismaMock()
    auditService = new AuditService()
  })

  describe('log', () => {
    it('devrait créer un log d\'audit', async () => {
      prismaMock.auditLog.create.mockResolvedValueOnce({
        id: 'log-123',
        action: 'USER_LOGIN',
        userId: 'user-123',
        createdAt: new Date(),
      })

      await auditService.log({
        action: AuditAction.USER_LOGIN,
        userId: 'user-123',
        ipAddress: '192.168.1.1',
      })

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'USER_LOGIN',
          userId: 'user-123',
          ipAddress: '192.168.1.1',
        }),
      })
    })

    it('devrait sérialiser les détails en JSON', async () => {
      prismaMock.auditLog.create.mockResolvedValueOnce({
        id: 'log-123',
        action: 'USER_CREATED',
        createdAt: new Date(),
      })

      await auditService.log({
        action: AuditAction.USER_CREATED,
        userId: 'admin-123',
        details: { newUserId: 'user-456', email: 'test@test.com' },
      })

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          details: JSON.stringify({ newUserId: 'user-456', email: 'test@test.com' }),
        }),
      })
    })

    it('ne devrait pas lever d\'erreur si la création échoue', async () => {
      prismaMock.auditLog.create.mockRejectedValueOnce(new Error('DB Error'))

      // Ne devrait pas lever d'exception
      await expect(
        auditService.log({
          action: AuditAction.USER_LOGIN,
          userId: 'user-123',
        })
      ).resolves.toBeUndefined()
    })
  })

  describe('logUserCreated', () => {
    it('devrait logger la création d\'un utilisateur', async () => {
      prismaMock.auditLog.create.mockResolvedValueOnce({})

      await auditService.logUserCreated(
        'admin-123',
        'user-456',
        { email: 'newuser@test.com', role: 'AGENT' },
        '192.168.1.1'
      )

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'USER_CREATED',
          userId: 'admin-123',
          details: expect.stringContaining('newuser@test.com'),
        }),
      })
    })
  })

  describe('logUserDeleted', () => {
    it('devrait logger la suppression d\'un utilisateur', async () => {
      prismaMock.auditLog.create.mockResolvedValueOnce({})

      await auditService.logUserDeleted(
        'admin-123',
        'user-456',
        'deleted@test.com',
        '192.168.1.1'
      )

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'USER_DELETED',
          userId: 'admin-123',
        }),
      })
    })
  })

  describe('logDemandeCreated', () => {
    it('devrait logger la création d\'une demande', async () => {
      prismaMock.auditLog.create.mockResolvedValueOnce({})

      await auditService.logDemandeCreated(
        'agent-123',
        'demande-456',
        'DEM-2026-00001',
        '192.168.1.1'
      )

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'DEMANDE_CREATED',
          userId: 'agent-123',
          demandeId: 'demande-456',
        }),
      })
    })
  })

  describe('logDemandeValidated', () => {
    it('devrait logger la validation d\'une demande', async () => {
      prismaMock.auditLog.create.mockResolvedValueOnce({})

      await auditService.logDemandeValidated(
        'agent-123',
        'demande-456',
        'DEM-2026-00001'
      )

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'DEMANDE_VALIDATED',
          demandeId: 'demande-456',
        }),
      })
    })
  })

  describe('logDemandeRejected', () => {
    it('devrait logger le rejet d\'une demande avec motif', async () => {
      prismaMock.auditLog.create.mockResolvedValueOnce({})

      await auditService.logDemandeRejected(
        'agent-123',
        'demande-456',
        'Documents incomplets'
      )

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'DEMANDE_REJECTED',
          details: expect.stringContaining('Documents incomplets'),
        }),
      })
    })
  })

  describe('logAttestationGenerated', () => {
    it('devrait logger la génération d\'une attestation', async () => {
      prismaMock.auditLog.create.mockResolvedValueOnce({})

      await auditService.logAttestationGenerated(
        'agent-123',
        'demande-456',
        'ATT-2026-00001'
      )

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'ATTESTATION_GENERATED',
          details: expect.stringContaining('ATT-2026-00001'),
        }),
      })
    })
  })

  describe('logAttestationSigned', () => {
    it('devrait logger la signature d\'une attestation', async () => {
      prismaMock.auditLog.create.mockResolvedValueOnce({})

      await auditService.logAttestationSigned(
        'directeur-123',
        'demande-456',
        'ATT-2026-00001',
        'ELECTRONIQUE'
      )

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'ATTESTATION_SIGNED',
          details: expect.stringContaining('ELECTRONIQUE'),
        }),
      })
    })
  })

  describe('getLogs', () => {
    it('devrait récupérer les logs avec pagination', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          action: 'USER_LOGIN',
          userId: 'user-1',
          details: '{}',
          createdAt: new Date(),
          user: { id: 'user-1', nom: 'Test', email: 'test@test.com' },
          demande: null,
        },
      ]

      prismaMock.auditLog.findMany.mockResolvedValueOnce(mockLogs)
      prismaMock.auditLog.count.mockResolvedValueOnce(1)

      const result = await auditService.getLogs({ limit: 50, offset: 0 })

      expect(result.logs).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('devrait filtrer par action', async () => {
      prismaMock.auditLog.findMany.mockResolvedValueOnce([])
      prismaMock.auditLog.count.mockResolvedValueOnce(0)

      await auditService.getLogs({ action: 'USER_LOGIN' })

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ action: 'USER_LOGIN' }),
        })
      )
    })

    it('devrait filtrer par plage de dates', async () => {
      prismaMock.auditLog.findMany.mockResolvedValueOnce([])
      prismaMock.auditLog.count.mockResolvedValueOnce(0)

      const startDate = new Date('2026-01-01')
      const endDate = new Date('2026-01-31')

      await auditService.getLogs({ startDate, endDate })

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: startDate,
              lte: endDate,
            }),
          }),
        })
      )
    })

    it('devrait parser les détails JSON', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          action: 'USER_CREATED',
          details: '{"email":"test@test.com"}',
          createdAt: new Date(),
          user: null,
          demande: null,
        },
      ]

      prismaMock.auditLog.findMany.mockResolvedValueOnce(mockLogs)
      prismaMock.auditLog.count.mockResolvedValueOnce(1)

      const result = await auditService.getLogs({})

      expect(result.logs[0].details).toEqual({ email: 'test@test.com' })
    })
  })

  describe('getActivityStats', () => {
    it('devrait calculer les statistiques d\'activité', async () => {
      const mockLogs = [
        { action: 'USER_LOGIN', userId: 'user-1', createdAt: new Date() },
        { action: 'USER_LOGIN', userId: 'user-1', createdAt: new Date() },
        { action: 'DEMANDE_CREATED', userId: 'user-2', createdAt: new Date() },
      ]

      prismaMock.auditLog.findMany.mockResolvedValueOnce(mockLogs)

      const result = await auditService.getActivityStats('day')

      expect(result.totalActions).toBe(3)
      expect(result.actionCounts['USER_LOGIN']).toBe(2)
      expect(result.actionCounts['DEMANDE_CREATED']).toBe(1)
    })

    it('devrait identifier les utilisateurs les plus actifs', async () => {
      const mockLogs = [
        { action: 'USER_LOGIN', userId: 'user-1', createdAt: new Date() },
        { action: 'USER_LOGIN', userId: 'user-1', createdAt: new Date() },
        { action: 'USER_LOGIN', userId: 'user-1', createdAt: new Date() },
        { action: 'DEMANDE_CREATED', userId: 'user-2', createdAt: new Date() },
      ]

      prismaMock.auditLog.findMany.mockResolvedValueOnce(mockLogs)

      const result = await auditService.getActivityStats('week')

      expect(result.mostActiveUsers[0]).toEqual({ userId: 'user-1', count: 3 })
    })
  })

  describe('getUserActivity', () => {
    it('devrait récupérer l\'activité d\'un utilisateur', async () => {
      const mockActivity = [
        { id: 'log-1', action: 'USER_LOGIN', demande: null },
        { id: 'log-2', action: 'DEMANDE_CREATED', demande: { numeroEnregistrement: 'DEM-001' } },
      ]

      prismaMock.auditLog.findMany.mockResolvedValueOnce(mockActivity)

      const result = await auditService.getUserActivity('user-123', 20)

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123' },
          take: 20,
        })
      )
      expect(result).toHaveLength(2)
    })
  })
})
