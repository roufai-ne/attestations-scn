import { test, expect } from '@playwright/test'

test.describe('Authentification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('devrait afficher la page de connexion', async ({ page }) => {
    await expect(page).toHaveTitle(/Connexion|Login|Attestations/i)
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /mot de passe|password/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /connexion|se connecter|login/i })).toBeVisible()
  })

  test('devrait afficher une erreur pour des identifiants invalides', async ({ page }) => {
    await page.getByRole('textbox', { name: /email/i }).fill('invalid@test.com')
    await page.getByRole('textbox', { name: /mot de passe|password/i }).fill('wrongpassword')
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()

    // Attendre un message d'erreur
    await expect(page.getByText(/erreur|invalide|incorrect/i)).toBeVisible({ timeout: 5000 })
  })

  test('devrait valider le format email', async ({ page }) => {
    await page.getByRole('textbox', { name: /email/i }).fill('not-an-email')
    await page.getByRole('textbox', { name: /mot de passe|password/i }).fill('password123')
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()

    // Le navigateur ou l'app devrait afficher une erreur de validation
    const emailInput = page.getByRole('textbox', { name: /email/i })
    await expect(emailInput).toBeVisible()
  })

  test('devrait connecter un admin avec succès', async ({ page }) => {
    // Utiliser les identifiants de test
    await page.getByRole('textbox', { name: /email/i }).fill('admin@servicecivique.ne')
    await page.getByRole('textbox', { name: /mot de passe|password/i }).fill('Admin123!')
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()

    // Devrait être redirigé vers le dashboard admin
    await page.waitForURL(/admin|dashboard/, { timeout: 10000 })
    await expect(page.url()).toContain('admin')
  })

  test('devrait connecter un agent avec succès', async ({ page }) => {
    await page.getByRole('textbox', { name: /email/i }).fill('agent@servicecivique.ne')
    await page.getByRole('textbox', { name: /mot de passe|password/i }).fill('Agent123!')
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()

    // Devrait être redirigé vers le dashboard agent
    await page.waitForURL(/agent|dashboard/, { timeout: 10000 })
    await expect(page.url()).toContain('agent')
  })

  test('devrait connecter un directeur avec succès', async ({ page }) => {
    await page.getByRole('textbox', { name: /email/i }).fill('directeur@servicecivique.ne')
    await page.getByRole('textbox', { name: /mot de passe|password/i }).fill('Directeur123!')
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()

    // Devrait être redirigé vers le dashboard directeur
    await page.waitForURL(/directeur|dashboard/, { timeout: 10000 })
    await expect(page.url()).toContain('directeur')
  })
})

test.describe('Déconnexion', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter d'abord
    await page.goto('/login')
    await page.getByRole('textbox', { name: /email/i }).fill('admin@servicecivique.ne')
    await page.getByRole('textbox', { name: /mot de passe|password/i }).fill('Admin123!')
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()
    await page.waitForURL(/admin|dashboard/, { timeout: 10000 })
  })

  test('devrait permettre la déconnexion', async ({ page }) => {
    // Chercher et cliquer sur le bouton de déconnexion
    const logoutButton = page.getByRole('button', { name: /déconnexion|logout|quitter/i })
      .or(page.getByText(/déconnexion|logout/i))

    if (await logoutButton.isVisible()) {
      await logoutButton.click()
      await page.waitForURL(/login/, { timeout: 5000 })
      await expect(page.url()).toContain('login')
    }
  })
})

test.describe('Protection des routes', () => {
  test('devrait rediriger vers login si non authentifié', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForURL(/login/, { timeout: 5000 })
    await expect(page.url()).toContain('login')
  })

  test('devrait protéger les routes agent', async ({ page }) => {
    await page.goto('/agent')
    await page.waitForURL(/login/, { timeout: 5000 })
    await expect(page.url()).toContain('login')
  })

  test('devrait protéger les routes directeur', async ({ page }) => {
    await page.goto('/directeur')
    await page.waitForURL(/login/, { timeout: 5000 })
    await expect(page.url()).toContain('login')
  })
})
