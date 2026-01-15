import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prismaMock, resetPrismaMock } from '../../mocks/prisma.mock'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

// Mock queue service
vi.mock('@/lib/services/queue.service', () => ({
  addOCRJob: vi.fn().mockResolvedValue(undefined),
}))

// Mock fs/promises
vi.mock('fs/promises', () => ({
  unlink: vi.fn().mockResolvedValue(undefined),
}))

import { ArreteService, CreateArreteInput } from '@/lib/services/arrete.service'
import { addOCRJob } from '@/lib/services/queue.service'
import { unlink } from 'fs/promises'

describe('ArreteService', () => {
  let arreteService: ArreteService

  const mockArreteInput: CreateArreteInput = {
    numero: 'ARR-2026-001',
    dateArrete: new Date('2026-01-15'),
    promotion: '15ème Promotion',
    annee: '2026',
    fichierPath: '/uploads/arretes/arr-2026-001.pdf',
  }

  const mockArrete = {
    id: 'arrete-123',
    numero: 'ARR-2026-001',
    dateArrete: new Date('2026-01-15'),
    promotion: '15ème Promotion',
    annee: '2026',
    fichierPath: '/uploads/arretes/arr-2026-001.pdf',
    statutIndexation: 'EN_ATTENTE',
    contenuOCR: null,
    messageErreur: null,
    dateIndexation: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    resetPrismaMock()
    arreteService = new ArreteService()
  })

  describe('createArrete', () => {
    it('devrait créer un arrêté et lancer l\'OCR', async () => {
      prismaMock.arrete.create.mockResolvedValueOnce(mockArrete)

      const result = await arreteService.createArrete(mockArreteInput)

      expect(prismaMock.arrete.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          numero: mockArreteInput.numero,
          promotion: mockArreteInput.promotion,
          annee: mockArreteInput.annee,
          statutIndexation: 'EN_ATTENTE',
        }),
      })

      expect(addOCRJob).toHaveBeenCalledWith(mockArrete.id, mockArreteInput.fichierPath)
      expect(result.id).toBe(mockArrete.id)
    })
  })

  describe('getArreteById', () => {
    it('devrait retourner un arrêté par ID', async () => {
      prismaMock.arrete.findUnique.mockResolvedValueOnce(mockArrete)

      const result = await arreteService.getArreteById('arrete-123')

      expect(prismaMock.arrete.findUnique).toHaveBeenCalledWith({
        where: { id: 'arrete-123' },
      })
      expect(result?.numero).toBe(mockArrete.numero)
    })

    it('devrait retourner null si l\'arrêté n\'existe pas', async () => {
      prismaMock.arrete.findUnique.mockResolvedValueOnce(null)

      const result = await arreteService.getArreteById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('listArretes', () => {
    it('devrait lister les arrêtés avec pagination', async () => {
      const mockArretes = [mockArrete]
      prismaMock.arrete.findMany.mockResolvedValueOnce(mockArretes)
      prismaMock.arrete.count.mockResolvedValueOnce(1)

      const result = await arreteService.listArretes({ page: 1, limit: 20 })

      expect(result.data).toEqual(mockArretes)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.total).toBe(1)
    })

    it('devrait filtrer par statut', async () => {
      prismaMock.arrete.findMany.mockResolvedValueOnce([])
      prismaMock.arrete.count.mockResolvedValueOnce(0)

      await arreteService.listArretes({ statut: 'INDEXE' as any })

      expect(prismaMock.arrete.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            statutIndexation: 'INDEXE',
          }),
        })
      )
    })

    it('devrait filtrer par promotion', async () => {
      prismaMock.arrete.findMany.mockResolvedValueOnce([])
      prismaMock.arrete.count.mockResolvedValueOnce(0)

      await arreteService.listArretes({ promotion: '15ème Promotion' })

      expect(prismaMock.arrete.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            promotion: '15ème Promotion',
          }),
        })
      )
    })

    it('devrait supporter la recherche fulltext', async () => {
      prismaMock.arrete.findMany.mockResolvedValueOnce([])
      prismaMock.arrete.count.mockResolvedValueOnce(0)

      await arreteService.listArretes({ search: 'DIALLO' })

      expect(prismaMock.arrete.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ numero: expect.any(Object) }),
              expect.objectContaining({ contenuOCR: expect.any(Object) }),
            ]),
          }),
        })
      )
    })
  })

  describe('updateArrete', () => {
    it('devrait mettre à jour les métadonnées d\'un arrêté', async () => {
      const updatedArrete = { ...mockArrete, numero: 'ARR-2026-002' }
      prismaMock.arrete.update.mockResolvedValueOnce(updatedArrete)

      const result = await arreteService.updateArrete('arrete-123', {
        numero: 'ARR-2026-002',
      })

      expect(prismaMock.arrete.update).toHaveBeenCalledWith({
        where: { id: 'arrete-123' },
        data: { numero: 'ARR-2026-002' },
      })
      expect(result.numero).toBe('ARR-2026-002')
    })
  })

  describe('deleteArrete', () => {
    it('devrait supprimer l\'arrêté et son fichier', async () => {
      prismaMock.arrete.findUnique.mockResolvedValueOnce(mockArrete)
      prismaMock.arrete.delete.mockResolvedValueOnce(mockArrete)

      await arreteService.deleteArrete('arrete-123')

      expect(unlink).toHaveBeenCalledWith(mockArrete.fichierPath)
      expect(prismaMock.arrete.delete).toHaveBeenCalledWith({
        where: { id: 'arrete-123' },
      })
    })

    it('devrait lever une erreur si l\'arrêté n\'existe pas', async () => {
      prismaMock.arrete.findUnique.mockResolvedValueOnce(null)

      await expect(arreteService.deleteArrete('non-existent')).rejects.toThrow(
        'Arrêté introuvable'
      )
    })

    it('devrait continuer même si le fichier ne peut pas être supprimé', async () => {
      prismaMock.arrete.findUnique.mockResolvedValueOnce(mockArrete)
      prismaMock.arrete.delete.mockResolvedValueOnce(mockArrete)
      vi.mocked(unlink).mockRejectedValueOnce(new Error('File not found'))

      // Ne devrait pas lever d'erreur
      await expect(arreteService.deleteArrete('arrete-123')).resolves.toBeUndefined()
      expect(prismaMock.arrete.delete).toHaveBeenCalled()
    })
  })

  describe('reindexArrete', () => {
    it('devrait réinitialiser le statut et relancer l\'OCR', async () => {
      prismaMock.arrete.findUnique.mockResolvedValueOnce(mockArrete)
      prismaMock.arrete.update.mockResolvedValueOnce({
        ...mockArrete,
        statutIndexation: 'EN_ATTENTE',
        contenuOCR: null,
      })

      await arreteService.reindexArrete('arrete-123')

      expect(prismaMock.arrete.update).toHaveBeenCalledWith({
        where: { id: 'arrete-123' },
        data: expect.objectContaining({
          statutIndexation: 'EN_ATTENTE',
          contenuOCR: null,
          messageErreur: null,
          dateIndexation: null,
        }),
      })

      expect(addOCRJob).toHaveBeenCalledWith(mockArrete.id, mockArrete.fichierPath)
    })

    it('devrait lever une erreur si l\'arrêté n\'existe pas', async () => {
      prismaMock.arrete.findUnique.mockResolvedValueOnce(null)

      await expect(arreteService.reindexArrete('non-existent')).rejects.toThrow(
        'Arrêté introuvable'
      )
    })
  })

  describe('searchInArretes', () => {
    it('devrait retourner un tableau vide pour une requête trop courte', async () => {
      const result = await arreteService.searchInArretes('a')

      expect(result).toEqual([])
      expect(prismaMock.$queryRaw).not.toHaveBeenCalled()
    })

    it('devrait effectuer une recherche fulltext', async () => {
      const mockResults = [
        {
          id: 'arrete-123',
          numero: 'ARR-2026-001',
          promotion: '15ème Promotion',
          annee: '2026',
          excerpt: '... DIALLO Amadou ...',
          rank: 0.85,
        },
      ]
      prismaMock.$queryRaw.mockResolvedValueOnce(mockResults)

      const result = await arreteService.searchInArretes('DIALLO')

      expect(prismaMock.$queryRaw).toHaveBeenCalled()
      expect(result).toEqual(mockResults)
    })
  })

  describe('getIndexationStats', () => {
    it('devrait retourner les statistiques d\'indexation', async () => {
      prismaMock.arrete.groupBy.mockResolvedValueOnce([
        { statutIndexation: 'INDEXE', _count: 10 },
        { statutIndexation: 'EN_ATTENTE', _count: 5 },
        { statutIndexation: 'ERREUR', _count: 2 },
      ])
      prismaMock.arrete.count.mockResolvedValueOnce(17)

      const result = await arreteService.getIndexationStats()

      expect(result.total).toBe(17)
      expect(result.byStatus.INDEXE).toBe(10)
      expect(result.byStatus.EN_ATTENTE).toBe(5)
      expect(result.byStatus.ERREUR).toBe(2)
    })
  })
})
