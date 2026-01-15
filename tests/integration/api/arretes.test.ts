import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prismaMock, resetPrismaMock } from '../../mocks/prisma.mock'

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// Mock auth config
vi.mock('@/auth.config', () => ({
  authOptions: {},
}))

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

// Mock arrete service
vi.mock('@/lib/services/arrete.service', () => ({
  arreteService: {
    listArretes: vi.fn(),
    createArrete: vi.fn(),
    getArreteById: vi.fn(),
    updateArrete: vi.fn(),
    deleteArrete: vi.fn(),
    reindexArrete: vi.fn(),
  },
}))

// Mock fs/promises
vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}))

import { getServerSession } from 'next-auth'
import { arreteService } from '@/lib/services/arrete.service'
import { GET, POST } from '@/app/api/admin/arretes/route'

describe('API /api/admin/arretes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetPrismaMock()
  })

  describe('GET /api/admin/arretes', () => {
    it('devrait retourner 403 si non authentifié', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/admin/arretes')
      const response = await GET(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Non autorisé')
    })

    it('devrait retourner 403 si non admin', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'user-1', role: 'AGENT' },
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/arretes')
      const response = await GET(request)

      expect(response.status).toBe(403)
    })

    it('devrait retourner la liste des arrêtés pour un admin', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'admin-1', role: 'ADMIN' },
      } as any)

      const mockResult = {
        data: [
          { id: 'arrete-1', numero: 'ARR-2026-001' },
          { id: 'arrete-2', numero: 'ARR-2026-002' },
        ],
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      }

      vi.mocked(arreteService.listArretes).mockResolvedValueOnce(mockResult)

      const request = new NextRequest('http://localhost:3000/api/admin/arretes')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveLength(2)
      expect(data.pagination.total).toBe(2)
    })

    it('devrait passer les paramètres de pagination', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'admin-1', role: 'ADMIN' },
      } as any)

      vi.mocked(arreteService.listArretes).mockResolvedValueOnce({
        data: [],
        pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
      })

      const request = new NextRequest(
        'http://localhost:3000/api/admin/arretes?page=2&limit=10'
      )
      await GET(request)

      expect(arreteService.listArretes).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10,
        })
      )
    })

    it('devrait passer les filtres de recherche', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'admin-1', role: 'ADMIN' },
      } as any)

      vi.mocked(arreteService.listArretes).mockResolvedValueOnce({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      })

      const request = new NextRequest(
        'http://localhost:3000/api/admin/arretes?search=DIALLO&promotion=15ème&annee=2026'
      )
      await GET(request)

      expect(arreteService.listArretes).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'DIALLO',
          promotion: '15ème',
          annee: '2026',
        })
      )
    })

    it('devrait gérer les erreurs serveur', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'admin-1', role: 'ADMIN' },
      } as any)

      vi.mocked(arreteService.listArretes).mockRejectedValueOnce(
        new Error('Database error')
      )

      const request = new NextRequest('http://localhost:3000/api/admin/arretes')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Erreur serveur')
    })
  })

  describe('POST /api/admin/arretes', () => {
    const createMockFormData = (overrides: Record<string, any> = {}) => {
      const formData = new FormData()

      const defaultData = {
        numero: 'ARR-2026-001',
        dateArrete: '2026-01-15',
        promotion: '15ème Promotion',
        annee: '2026',
        file: new File(['pdf content'], 'test.pdf', { type: 'application/pdf' }),
        ...overrides,
      }

      if (defaultData.file) {
        formData.append('file', defaultData.file)
      }
      formData.append('numero', defaultData.numero)
      formData.append('dateArrete', defaultData.dateArrete)
      formData.append('promotion', defaultData.promotion)
      formData.append('annee', defaultData.annee)

      return formData
    }

    it('devrait retourner 403 si non authentifié', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null)

      const formData = createMockFormData()
      const request = new NextRequest('http://localhost:3000/api/admin/arretes', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
    })

    it('devrait retourner 400 si pas de fichier', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'admin-1', role: 'ADMIN' },
      } as any)

      const formData = new FormData()
      formData.append('numero', 'ARR-2026-001')
      formData.append('dateArrete', '2026-01-15')
      formData.append('promotion', '15ème')
      formData.append('annee', '2026')

      const request = new NextRequest('http://localhost:3000/api/admin/arretes', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Fichier PDF requis')
    })

    it('devrait retourner 400 si fichier non-PDF', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'admin-1', role: 'ADMIN' },
      } as any)

      const formData = new FormData()
      formData.append('file', new File(['content'], 'test.txt', { type: 'text/plain' }))
      formData.append('numero', 'ARR-2026-001')
      formData.append('dateArrete', '2026-01-15')
      formData.append('promotion', '15ème')
      formData.append('annee', '2026')

      const request = new NextRequest('http://localhost:3000/api/admin/arretes', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Seuls les fichiers PDF sont acceptés')
    })

    it('devrait créer un arrêté avec succès', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'admin-1', role: 'ADMIN' },
      } as any)

      const mockArrete = {
        id: 'arrete-123',
        numero: 'ARR-2026-001',
        promotion: '15ème Promotion',
        annee: '2026',
        statutIndexation: 'EN_ATTENTE',
      }

      vi.mocked(arreteService.createArrete).mockResolvedValueOnce(mockArrete as any)

      const formData = createMockFormData()
      const request = new NextRequest('http://localhost:3000/api/admin/arretes', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.arrete.id).toBe('arrete-123')
    })

    it('devrait retourner 400 pour données invalides', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'admin-1', role: 'ADMIN' },
      } as any)

      const formData = new FormData()
      formData.append('file', new File(['pdf'], 'test.pdf', { type: 'application/pdf' }))
      formData.append('numero', '') // Invalid: empty
      formData.append('dateArrete', '2026-01-15')
      formData.append('promotion', '')
      formData.append('annee', '26') // Invalid: too short

      const request = new NextRequest('http://localhost:3000/api/admin/arretes', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Données invalides')
    })
  })
})
