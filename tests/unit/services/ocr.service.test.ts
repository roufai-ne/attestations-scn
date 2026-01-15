import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Tesseract.js
vi.mock('tesseract.js', () => ({
  default: {
    recognize: vi.fn().mockResolvedValue({
      data: {
        text: 'Texte extrait par OCR\nNom: DIALLO Amadou\nPromotion: 15ème',
        confidence: 92.5,
      },
    }),
  },
}))

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 2,
      getPage: vi.fn().mockResolvedValue({
        getViewport: vi.fn().mockReturnValue({
          width: 595,
          height: 842,
        }),
        render: vi.fn().mockReturnValue({
          promise: Promise.resolve(),
        }),
        cleanup: vi.fn(),
      }),
    }),
  }),
  GlobalWorkerOptions: {
    workerSrc: '',
  },
}))

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
}))

// Mock canvas
vi.mock('canvas', () => ({
  createCanvas: vi.fn().mockReturnValue({
    getContext: vi.fn().mockReturnValue({
      drawImage: vi.fn(),
      fillRect: vi.fn(),
    }),
    width: 595,
    height: 842,
  }),
}))

import { OCRService } from '@/lib/services/ocr.service'
import Tesseract from 'tesseract.js'

describe('OCRService', () => {
  let ocrService: OCRService

  beforeEach(() => {
    vi.clearAllMocks()
    ocrService = new OCRService()
  })

  describe('extractTextFromPDF', () => {
    it('devrait extraire le texte d\'un PDF', async () => {
      const result = await ocrService.extractTextFromPDF('/path/to/test.pdf')

      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('pageCount')
      expect(result).toHaveProperty('processingTime')
    })

    it('devrait appeler Tesseract pour chaque page', async () => {
      await ocrService.extractTextFromPDF('/path/to/test.pdf')

      // 2 pages dans le mock
      expect(Tesseract.recognize).toHaveBeenCalledTimes(2)
    })

    it('devrait utiliser le français pour l\'OCR', async () => {
      await ocrService.extractTextFromPDF('/path/to/test.pdf')

      expect(Tesseract.recognize).toHaveBeenCalledWith(
        expect.anything(),
        'fra',
        expect.anything()
      )
    })

    it('devrait calculer la confiance moyenne', async () => {
      const result = await ocrService.extractTextFromPDF('/path/to/test.pdf')

      // Le mock retourne 92.5% de confiance pour chaque page
      expect(result.confidence).toBe(92.5)
    })

    it('devrait retourner le nombre correct de pages', async () => {
      const result = await ocrService.extractTextFromPDF('/path/to/test.pdf')

      expect(result.pageCount).toBe(2)
    })

    it('devrait mesurer le temps de traitement', async () => {
      const result = await ocrService.extractTextFromPDF('/path/to/test.pdf')

      expect(result.processingTime).toBeGreaterThanOrEqual(0)
    })

    it('devrait concaténer le texte de toutes les pages avec séparateurs', async () => {
      const result = await ocrService.extractTextFromPDF('/path/to/test.pdf')

      expect(result.text).toContain('--- PAGE BREAK ---')
    })

    it('devrait lever une erreur si la lecture du fichier échoue', async () => {
      const { readFile } = await import('fs/promises')
      vi.mocked(readFile).mockRejectedValueOnce(new Error('File not found'))

      await expect(ocrService.extractTextFromPDF('/invalid/path.pdf')).rejects.toThrow()
    })
  })

  describe('cleanText', () => {
    it('devrait supprimer les espaces multiples', () => {
      const input = 'Texte    avec   espaces    multiples'
      const result = ocrService.cleanText(input)

      expect(result).toBe('Texte avec espaces multiples')
    })

    it('devrait normaliser les sauts de ligne', () => {
      const input = 'Ligne 1\n\n\n\nLigne 2'
      const result = ocrService.cleanText(input)

      expect(result).toBe('Ligne 1\nLigne 2')
    })

    it('devrait supprimer les espaces en début et fin', () => {
      const input = '   Texte avec espaces   '
      const result = ocrService.cleanText(input)

      expect(result).toBe('Texte avec espaces')
    })

    it('devrait gérer un texte vide', () => {
      const result = ocrService.cleanText('')

      expect(result).toBe('')
    })

    it('devrait gérer les espaces mixtes (tabs, newlines)', () => {
      const input = 'Texte\t\tavec\t\ttabs'
      const result = ocrService.cleanText(input)

      expect(result).toBe('Texte avec tabs')
    })
  })
})
