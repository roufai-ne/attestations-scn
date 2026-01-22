import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock du module crypto pour les tests
vi.mock('crypto', async () => {
  const actual = await vi.importActual<typeof import('crypto')>('crypto')
  
  const mockCreateHmac = vi.fn(() => ({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn().mockReturnValue('mock-signature-hex'),
  }))
  
  const mockTimingSafeEqual = vi.fn((a, b) => a.toString('hex') === b.toString('hex'))
  
  return {
    default: {
      ...actual,
      createHmac: mockCreateHmac,
      timingSafeEqual: mockTimingSafeEqual,
    },
    ...actual,
    createHmac: mockCreateHmac,
    timingSafeEqual: mockTimingSafeEqual,
  }
})

// Mock du module qrcode
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mock-qr-data'),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-qr-buffer')),
  },
}))

import { QRCodeService, QRCodeData } from '@/lib/services/qrcode.service'
import crypto from 'crypto'

describe('QRCodeService', () => {
  let qrcodeService: QRCodeService

  const mockData: QRCodeData = {
    id: 'test-id-123',
    numero: 'ATT-2026-00001',
    nom: 'DIALLO',
    prenom: 'Amadou',
    dateNaissance: '1990-01-15',
  }

  const baseUrl = 'https://attestations.ne'

  beforeEach(() => {
    vi.clearAllMocks()
    qrcodeService = new QRCodeService()
  })

  describe('generateQRCode', () => {
    it('devrait générer un QR code en base64', async () => {
      const result = await qrcodeService.generateQRCode(mockData, baseUrl)

      expect(result).toBeDefined()
      expect(result).toContain('data:image/png;base64')
    })

    it('devrait appeler crypto.createHmac pour signer les données', async () => {
      await qrcodeService.generateQRCode(mockData, baseUrl)

      expect(crypto.createHmac).toHaveBeenCalled()
    })
  })

  describe('generateQRCodeBuffer', () => {
    it('devrait générer un QR code en buffer', async () => {
      const result = await qrcodeService.generateQRCodeBuffer(mockData, baseUrl)

      expect(result).toBeDefined()
      expect(Buffer.isBuffer(result)).toBe(true)
    })
  })

  describe('generateQRData', () => {
    it('devrait générer des données JSON signées', () => {
      const result = qrcodeService.generateQRData(mockData)

      expect(result).toBeDefined()
      const parsed = JSON.parse(result)

      expect(parsed).toHaveProperty('id', mockData.id)
      expect(parsed).toHaveProperty('numero', mockData.numero)
      expect(parsed).toHaveProperty('nom', mockData.nom)
      expect(parsed).toHaveProperty('prenom', mockData.prenom)
      expect(parsed).toHaveProperty('dateNaissance', mockData.dateNaissance)
      expect(parsed).toHaveProperty('signature')
      expect(parsed).toHaveProperty('timestamp')
    })

    it('devrait inclure un timestamp valide', () => {
      const beforeTime = Date.now()
      const result = qrcodeService.generateQRData(mockData)
      const afterTime = Date.now()

      const parsed = JSON.parse(result)
      expect(parsed.timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(parsed.timestamp).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('validateQRCode', () => {
    it('devrait retourner valid: true pour une signature valide', () => {
      // Mock timingSafeEqual pour retourner true
      vi.mocked(crypto.timingSafeEqual).mockReturnValueOnce(true)

      const result = qrcodeService.validateQRCode(
        mockData,
        'mock-signature-hex',
        Date.now()
      )

      expect(result.valid).toBe(true)
    })

    it('devrait retourner valid: false pour une signature invalide', () => {
      // Mock timingSafeEqual pour retourner false
      vi.mocked(crypto.timingSafeEqual).mockReturnValueOnce(false)

      const result = qrcodeService.validateQRCode(
        mockData,
        'wrong-signature',
        Date.now()
      )

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Signature invalide')
    })

    it('devrait retourner valid: false pour un QR code expiré (> 10 ans)', () => {
      vi.mocked(crypto.timingSafeEqual).mockReturnValueOnce(true)

      const oldTimestamp = Date.now() - 11 * 365 * 24 * 60 * 60 * 1000 // 11 ans

      const result = qrcodeService.validateQRCode(
        mockData,
        'mock-signature-hex',
        oldTimestamp
      )

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('QR Code expiré')
    })
  })

  describe('parseAndValidateQRData', () => {
    it('devrait parser et valider des données JSON valides', () => {
      vi.mocked(crypto.timingSafeEqual).mockReturnValueOnce(true)

      const jsonData = JSON.stringify({
        ...mockData,
        signature: 'mock-signature-hex',
        timestamp: Date.now(),
      })

      const result = qrcodeService.parseAndValidateQRData(jsonData)

      expect(result.valid).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.numero).toBe(mockData.numero)
    })

    it('devrait retourner invalid pour du JSON malformé', () => {
      const result = qrcodeService.parseAndValidateQRData('invalid-json')

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Données QR Code invalides')
    })

    it('devrait retourner invalid si la signature ne correspond pas', () => {
      vi.mocked(crypto.timingSafeEqual).mockReturnValueOnce(false)

      const jsonData = JSON.stringify({
        ...mockData,
        signature: 'wrong-signature',
        timestamp: Date.now(),
      })

      const result = qrcodeService.parseAndValidateQRData(jsonData)

      expect(result.valid).toBe(false)
    })
  })
})
