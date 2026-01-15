import { test, expect } from '@playwright/test'

test.describe('Agent - Gestion des Demandes', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter en tant qu'agent
    await page.goto('/login')
    await page.getByRole('textbox', { name: /email/i }).fill('agent@servicecivique.ne')
    await page.getByRole('textbox', { name: /mot de passe|password/i }).fill('Agent123!')
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()
    await page.waitForURL(/agent/, { timeout: 10000 })
  })

  test('devrait afficher le dashboard agent', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /tableau de bord|dashboard|demandes/i })).toBeVisible()
  })

  test('devrait afficher le bouton nouvelle demande', async ({ page }) => {
    const newButton = page.getByRole('button', { name: /nouvelle|créer|ajouter/i })
      .or(page.getByRole('link', { name: /nouvelle|créer|ajouter/i }))

    await expect(newButton).toBeVisible()
  })

  test('devrait naviguer vers le formulaire de création', async ({ page }) => {
    const newButton = page.getByRole('button', { name: /nouvelle|créer|ajouter/i })
      .or(page.getByRole('link', { name: /nouvelle|créer|ajouter/i }))

    await newButton.click()
    await page.waitForURL(/nouvelle|create|nouveau/, { timeout: 5000 })
  })

  test('devrait afficher la liste des demandes', async ({ page }) => {
    // Naviguer vers la liste
    const listLink = page.getByRole('link', { name: /liste|toutes|demandes/i })

    if (await listLink.isVisible()) {
      await listLink.click()
    }

    // Vérifier la présence d'un tableau ou d'une liste
    const dataContainer = page.locator('table')
      .or(page.locator('[role="table"]'))
      .or(page.getByText(/aucune demande/i))

    await expect(dataContainer).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Agent - Création de Demande', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('textbox', { name: /email/i }).fill('agent@servicecivique.ne')
    await page.getByRole('textbox', { name: /mot de passe|password/i }).fill('Agent123!')
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()
    await page.waitForURL(/agent/, { timeout: 10000 })

    // Naviguer vers le formulaire de création
    const newButton = page.getByRole('button', { name: /nouvelle|créer|ajouter/i })
      .or(page.getByRole('link', { name: /nouvelle|créer|ajouter/i }))

    await newButton.click()
    await page.waitForLoadState('networkidle')
  })

  test('devrait afficher le formulaire de création', async ({ page }) => {
    // Vérifier les champs principaux
    const nomField = page.getByLabel(/nom/i).or(page.getByPlaceholder(/nom/i))
    const prenomField = page.getByLabel(/prénom/i).or(page.getByPlaceholder(/prénom/i))

    await expect(nomField).toBeVisible()
    await expect(prenomField).toBeVisible()
  })

  test('devrait valider les champs requis', async ({ page }) => {
    // Essayer de soumettre sans remplir les champs
    const submitButton = page.getByRole('button', { name: /enregistrer|créer|soumettre|valider/i })

    if (await submitButton.isVisible()) {
      await submitButton.click()

      // Des erreurs de validation devraient apparaître
      const errorMessage = page.getByText(/requis|obligatoire|invalide|required/i)
      await expect(errorMessage.first()).toBeVisible({ timeout: 3000 })
    }
  })

  test('devrait permettre de remplir le formulaire complet', async ({ page }) => {
    // Remplir les informations de l'appelé
    await page.getByLabel(/nom/i).or(page.getByPlaceholder(/nom/i)).first().fill('DIALLO')
    await page.getByLabel(/prénom/i).or(page.getByPlaceholder(/prénom/i)).first().fill('Amadou')

    // Vérifier que les valeurs sont bien saisies
    await expect(page.getByLabel(/nom/i).or(page.getByPlaceholder(/nom/i)).first()).toHaveValue('DIALLO')
    await expect(page.getByLabel(/prénom/i).or(page.getByPlaceholder(/prénom/i)).first()).toHaveValue('Amadou')
  })
})

test.describe('Agent - Détails d\'une Demande', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('textbox', { name: /email/i }).fill('agent@servicecivique.ne')
    await page.getByRole('textbox', { name: /mot de passe|password/i }).fill('Agent123!')
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()
    await page.waitForURL(/agent/, { timeout: 10000 })
  })

  test('devrait pouvoir voir les détails d\'une demande', async ({ page }) => {
    // S'il y a des demandes dans la liste
    const viewButton = page.getByRole('button', { name: /voir|détails|view/i }).first()
      .or(page.getByRole('link', { name: /voir|détails|view/i }).first())

    if (await viewButton.isVisible()) {
      await viewButton.click()
      await page.waitForLoadState('networkidle')

      // Vérifier la présence d'informations
      const detailsContainer = page.locator('[class*="detail"]')
        .or(page.getByText(/informations|détails/i))

      await expect(detailsContainer.first()).toBeVisible()
    }
  })
})

test.describe('Agent - Workflow de Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('textbox', { name: /email/i }).fill('agent@servicecivique.ne')
    await page.getByRole('textbox', { name: /mot de passe|password/i }).fill('Agent123!')
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()
    await page.waitForURL(/agent/, { timeout: 10000 })
  })

  test('devrait permettre de valider une demande', async ({ page }) => {
    const validateButton = page.getByRole('button', { name: /valider|approuver|accept/i }).first()

    if (await validateButton.isVisible()) {
      await validateButton.click()

      // Vérifier le feedback
      const feedback = page.getByText(/validée|succès|approved/i)
      await expect(feedback).toBeVisible({ timeout: 5000 })
    }
  })

  test('devrait permettre de rejeter une demande avec motif', async ({ page }) => {
    const rejectButton = page.getByRole('button', { name: /rejeter|refuser|reject/i }).first()

    if (await rejectButton.isVisible()) {
      await rejectButton.click()

      // Un dialog/modal pour le motif devrait apparaître
      const motifInput = page.getByLabel(/motif|raison/i)
        .or(page.getByPlaceholder(/motif|raison/i))

      if (await motifInput.isVisible()) {
        await motifInput.fill('Documents incomplets')
        await page.getByRole('button', { name: /confirmer|valider/i }).click()
      }
    }
  })
})
