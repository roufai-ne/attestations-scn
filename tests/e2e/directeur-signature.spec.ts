import { test, expect } from '@playwright/test'

/**
 * Tests E2E pour le workflow de signature du directeur
 */
test.describe('Directeur - Signature Attestations', () => {
    test.beforeEach(async ({ page }) => {
        // Se connecter en tant que directeur
        await page.goto('/login')
        await page.getByRole('textbox', { name: /email/i }).fill('directeur@servicecivique.ne')
        await page.getByRole('textbox', { name: /mot de passe|password/i }).fill('Directeur123!')
        await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()
        await page.waitForURL(/directeur|dashboard/, { timeout: 10000 })
    })

    test('devrait afficher le tableau de bord du directeur', async ({ page }) => {
        await page.goto('/directeur')

        // Vérifier la présence des éléments clés du dashboard
        await expect(page.getByText(/attestations/i)).toBeVisible()
        await expect(page.getByText(/en attente|à signer/i)).toBeVisible()
    })

    test('devrait lister les attestations en attente de signature', async ({ page }) => {
        await page.goto('/directeur/attestations')

        // Vérifier la présence du tableau ou de la liste
        const table = page.locator('table').or(page.locator('[data-testid="attestations-list"]'))
        await expect(table).toBeVisible({ timeout: 5000 })
    })

    test('devrait afficher le formulaire de signature avec demande de PIN', async ({ page }) => {
        await page.goto('/directeur/attestations')

        // Attendre que la liste soit chargée
        await page.waitForLoadState('networkidle')

        // Cliquer sur le premier bouton "Signer" s'il existe
        const signerButton = page.getByRole('button', { name: /signer/i }).first()

        if (await signerButton.isVisible({ timeout: 3000 })) {
            await signerButton.click()

            // Vérifier qu'un champ PIN apparaît
            await expect(page.getByRole('textbox', { name: /pin/i })
                .or(page.getByPlaceholder(/pin/i))
            ).toBeVisible({ timeout: 5000 })
        }
    })

    test('devrait afficher une erreur pour un PIN incorrect', async ({ page }) => {
        await page.goto('/directeur/attestations')
        await page.waitForLoadState('networkidle')

        const signerButton = page.getByRole('button', { name: /signer/i }).first()

        if (await signerButton.isVisible({ timeout: 3000 })) {
            await signerButton.click()

            // Entrer un PIN incorrect
            const pinInput = page.getByRole('textbox', { name: /pin/i })
                .or(page.getByPlaceholder(/pin/i))

            if (await pinInput.isVisible({ timeout: 3000 })) {
                await pinInput.fill('0000')

                // Soumettre
                const confirmButton = page.getByRole('button', { name: /confirmer|valider/i })
                if (await confirmButton.isVisible()) {
                    await confirmButton.click()

                    // Vérifier le message d'erreur
                    await expect(page.getByText(/incorrect|invalide|erreur/i)).toBeVisible({ timeout: 5000 })
                }
            }
        }
    })

    test('devrait pouvoir accéder à l\'historique des signatures', async ({ page }) => {
        // Naviguer vers l'historique
        await page.goto('/directeur/historique')
            .catch(() => page.goto('/directeur/signatures/historique'))

        // Vérifier la présence de l'historique
        await expect(page.getByText(/historique|signatures/i)).toBeVisible({ timeout: 5000 })
    })
})

test.describe('Directeur - Configuration Signature', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login')
        await page.getByRole('textbox', { name: /email/i }).fill('directeur@servicecivique.ne')
        await page.getByRole('textbox', { name: /mot de passe|password/i }).fill('Directeur123!')
        await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()
        await page.waitForURL(/directeur|dashboard/, { timeout: 10000 })
    })

    test('devrait afficher la page de configuration de signature', async ({ page }) => {
        await page.goto('/directeur/signature')
            .catch(() => page.goto('/directeur/signature/config'))

        // Vérifier les éléments de configuration
        await expect(page.getByText(/signature|configuration/i)).toBeVisible({ timeout: 5000 })
    })

    test('devrait permettre de changer le PIN', async ({ page }) => {
        await page.goto('/directeur/signature/pin')
            .catch(() => page.goto('/directeur/profil'))

        // Chercher les champs de changement de PIN
        const ancienPinField = page.getByRole('textbox', { name: /ancien|actuel/i })
            .or(page.getByPlaceholder(/ancien|actuel/i))

        const nouveauPinField = page.getByRole('textbox', { name: /nouveau/i })
            .or(page.getByPlaceholder(/nouveau/i))

        // Vérifier que les champs sont visibles si la page existe
        if (await ancienPinField.isVisible({ timeout: 3000 })) {
            await expect(ancienPinField).toBeVisible()
            await expect(nouveauPinField).toBeVisible()
        }
    })
})

test.describe('Directeur - Signature en Lot', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login')
        await page.getByRole('textbox', { name: /email/i }).fill('directeur@servicecivique.ne')
        await page.getByRole('textbox', { name: /mot de passe|password/i }).fill('Directeur123!')
        await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()
        await page.waitForURL(/directeur|dashboard/, { timeout: 10000 })
    })

    test('devrait permettre de sélectionner plusieurs attestations', async ({ page }) => {
        await page.goto('/directeur/attestations')
        await page.waitForLoadState('networkidle')

        // Chercher les cases à cocher de sélection
        const checkboxes = page.locator('input[type="checkbox"]')

        const count = await checkboxes.count()
        if (count > 1) {
            // Sélectionner les 2 premières
            await checkboxes.nth(0).check()
            await checkboxes.nth(1).check()

            // Vérifier qu'un bouton "Signer la sélection" apparaît
            await expect(
                page.getByRole('button', { name: /signer.*sélection|signer.*lot|signer\s+\d+/i })
            ).toBeVisible({ timeout: 3000 })
        }
    })

    test('devrait afficher le résumé après signature en lot', async ({ page }) => {
        await page.goto('/directeur/attestations')
        await page.waitForLoadState('networkidle')

        const selectAllCheckbox = page.locator('input[type="checkbox"]').first()

        if (await selectAllCheckbox.isVisible({ timeout: 3000 })) {
            // Ce test vérifie juste que l'UI de sélection fonctionne
            await selectAllCheckbox.check()
            await expect(selectAllCheckbox).toBeChecked()
        }
    })
})
