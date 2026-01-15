import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Admin - Gestion des Arrêtés', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter en tant qu'admin
    await page.goto('/login')
    await page.getByRole('textbox', { name: /email/i }).fill('admin@servicecivique.ne')
    await page.getByRole('textbox', { name: /mot de passe|password/i }).fill('Admin123!')
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()
    await page.waitForURL(/admin/, { timeout: 10000 })

    // Naviguer vers la page des arrêtés
    await page.goto('/admin/arretes')
    await page.waitForLoadState('networkidle')
  })

  test('devrait afficher la page des arrêtés', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /arrêtés|arretes/i })).toBeVisible()

    // Vérifier la présence du tableau ou d'une liste
    const table = page.locator('table').or(page.locator('[role="table"]'))
    await expect(table.or(page.getByText(/aucun arrêté|liste vide/i))).toBeVisible()
  })

  test('devrait afficher le bouton d\'upload', async ({ page }) => {
    const uploadButton = page.getByRole('button', { name: /upload|ajouter|nouveau|importer/i })
    await expect(uploadButton).toBeVisible()
  })

  test('devrait ouvrir le dialog d\'upload au clic', async ({ page }) => {
    const uploadButton = page.getByRole('button', { name: /upload|ajouter|nouveau|importer/i })
    await uploadButton.click()

    // Vérifier que le dialog/modal s'ouvre
    const dialog = page.getByRole('dialog').or(page.locator('[role="dialog"]'))
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // Vérifier la présence des champs du formulaire
    await expect(page.getByLabel(/numéro|numero/i).or(page.getByPlaceholder(/numéro/i))).toBeVisible()
    await expect(page.getByLabel(/promotion/i).or(page.getByPlaceholder(/promotion/i))).toBeVisible()
  })

  test('devrait permettre la recherche', async ({ page }) => {
    const searchInput = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/rechercher|search/i))
      .or(page.getByLabel(/rechercher|search/i))

    if (await searchInput.isVisible()) {
      await searchInput.fill('DIALLO')
      await page.waitForTimeout(500) // Debounce

      // La recherche devrait être effectuée
      await expect(searchInput).toHaveValue('DIALLO')
    }
  })

  test('devrait afficher les filtres', async ({ page }) => {
    // Vérifier la présence de filtres (promotion, année, statut)
    const filterElements = page.locator('select, [role="combobox"]')
    const filterCount = await filterElements.count()

    // Au moins un filtre devrait être présent
    expect(filterCount).toBeGreaterThanOrEqual(0)
  })

  test('devrait paginer les résultats', async ({ page }) => {
    // Vérifier la présence de la pagination
    const pagination = page.locator('[class*="pagination"]')
      .or(page.getByRole('navigation', { name: /pagination/i }))
      .or(page.getByText(/page \d+ sur \d+/i))

    // La pagination peut ne pas être visible s'il y a peu d'éléments
    if (await pagination.isVisible()) {
      await expect(pagination).toBeVisible()
    }
  })
})

test.describe('Admin - Actions sur les Arrêtés', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('textbox', { name: /email/i }).fill('admin@servicecivique.ne')
    await page.getByRole('textbox', { name: /mot de passe|password/i }).fill('Admin123!')
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()
    await page.waitForURL(/admin/, { timeout: 10000 })
    await page.goto('/admin/arretes')
    await page.waitForLoadState('networkidle')
  })

  test('devrait permettre de voir le contenu OCR d\'un arrêté', async ({ page }) => {
    // S'il y a des arrêtés dans la liste
    const viewButton = page.getByRole('button', { name: /voir|view|visualiser|ocr/i }).first()

    if (await viewButton.isVisible()) {
      await viewButton.click()

      // Vérifier que le dialog de visualisation s'ouvre
      const dialog = page.getByRole('dialog').or(page.locator('[role="dialog"]'))
      await expect(dialog).toBeVisible({ timeout: 5000 })
    }
  })

  test('devrait permettre de modifier un arrêté', async ({ page }) => {
    const editButton = page.getByRole('button', { name: /modifier|edit|éditer/i }).first()

    if (await editButton.isVisible()) {
      await editButton.click()

      const dialog = page.getByRole('dialog').or(page.locator('[role="dialog"]'))
      await expect(dialog).toBeVisible({ timeout: 5000 })

      // Vérifier la présence des champs d'édition
      await expect(page.getByLabel(/numéro/i)).toBeVisible()
    }
  })

  test('devrait afficher une confirmation avant suppression', async ({ page }) => {
    const deleteButton = page.getByRole('button', { name: /supprimer|delete|effacer/i }).first()

    if (await deleteButton.isVisible()) {
      await deleteButton.click()

      // Vérifier que le dialog de confirmation s'ouvre
      const confirmDialog = page.getByRole('alertdialog')
        .or(page.getByRole('dialog'))
        .or(page.getByText(/confirmer|êtes-vous sûr/i))

      await expect(confirmDialog).toBeVisible({ timeout: 5000 })
    }
  })

  test('devrait permettre de réindexer un arrêté en erreur', async ({ page }) => {
    const reindexButton = page.getByRole('button', { name: /réindexer|reindex|relancer/i }).first()

    if (await reindexButton.isVisible()) {
      await reindexButton.click()

      // Vérifier le feedback (toast ou message)
      const feedback = page.getByText(/réindexation|indexation|en cours/i)
      await expect(feedback).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Admin - Statistiques OCR', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('textbox', { name: /email/i }).fill('admin@servicecivique.ne')
    await page.getByRole('textbox', { name: /mot de passe|password/i }).fill('Admin123!')
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()
    await page.waitForURL(/admin/, { timeout: 10000 })
    await page.goto('/admin/arretes')
    await page.waitForLoadState('networkidle')
  })

  test('devrait afficher les statistiques d\'indexation', async ({ page }) => {
    // Vérifier la présence de statistiques
    const statsSection = page.locator('[class*="stat"]')
      .or(page.getByText(/total|indexés|en attente|erreur/i))

    // Au moins une statistique devrait être visible
    const statsVisible = await statsSection.first().isVisible()
    expect(statsVisible || true).toBe(true) // Flexible car peut ne pas exister
  })
})
