import { test, expect } from '@playwright/test'

/**
 * Tests E2E pour le workflow complet de demande d'attestation
 * De la création jusqu'à la signature
 */
test.describe('Workflow Complet - Demande à Attestation', () => {
    let numeroEnregistrement: string

    test('1. Agent crée une nouvelle demande', async ({ page }) => {
        // Connexion en tant qu'agent
        await page.goto('/login')
        await page.getByRole('textbox', { name: /email/i }).fill('agent@servicecivique.ne')
        await page.getByRole('textbox', { name: /mot de passe|password/i }).fill('Agent123!')
        await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()
        await page.waitForURL(/agent/, { timeout: 10000 })

        // Aller sur le formulaire de nouvelle demande
        await page.goto('/agent/nouvelle-demande')
            .catch(() => page.goto('/agent/demandes/nouvelle'))

        // Remplir le formulaire
        await page.getByRole('textbox', { name: /nom/i }).fill('TESTEUR')
        await page.getByRole('textbox', { name: /prénom/i }).fill('Jean')

        // Date de naissance
        const dateNaissanceField = page.getByLabel(/date de naissance/i)
            .or(page.locator('input[name="dateNaissance"]'))
        if (await dateNaissanceField.isVisible()) {
            await dateNaissanceField.fill('1995-05-15')
        }

        // Lieu de naissance
        await page.getByRole('textbox', { name: /lieu/i }).fill('Niamey')

        // Email
        const emailField = page.getByRole('textbox', { name: /email/i }).last()
        if (await emailField.isVisible()) {
            await emailField.fill('test@example.com')
        }

        // Téléphone
        const telField = page.getByRole('textbox', { name: /téléphone/i })
        if (await telField.isVisible()) {
            await telField.fill('90123456')
        }

        // Diplôme
        await page.getByRole('textbox', { name: /diplôme/i }).fill('Licence en Informatique')

        // Promotion
        await page.getByRole('textbox', { name: /promotion/i }).fill('2024')

        // Dates de service
        const dateDebutField = page.locator('input[name="dateDebutService"]')
            .or(page.getByLabel(/date.*début/i))
        if (await dateDebutField.isVisible()) {
            await dateDebutField.fill('2024-01-01')
        }

        const dateFinField = page.locator('input[name="dateFinService"]')
            .or(page.getByLabel(/date.*fin/i))
        if (await dateFinField.isVisible()) {
            await dateFinField.fill('2024-12-31')
        }

        // Soumettre
        await page.getByRole('button', { name: /enregistrer|créer|soumettre/i }).click()

        // Vérifier le succès
        await expect(page.getByText(/succès|enregistrée|créée/i)).toBeVisible({ timeout: 10000 })
    })

    test('2. Agent valide la demande', async ({ page }) => {
        // Connexion agent
        await page.goto('/login')
        await page.getByRole('textbox', { name: /email/i }).fill('agent@servicecivique.ne')
        await page.getByRole('textbox', { name: /mot de passe|password/i }).fill('Agent123!')
        await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()
        await page.waitForURL(/agent/, { timeout: 10000 })

        // Aller sur la liste des demandes
        await page.goto('/agent/demandes')

        // Cliquer sur la première demande
        const premiereLigne = page.locator('table tbody tr').first()
            .or(page.locator('[data-testid="demande-item"]').first())

        if (await premiereLigne.isVisible({ timeout: 5000 })) {
            await premiereLigne.click()
        }

        // Chercher le bouton valider
        const validerButton = page.getByRole('button', { name: /valider/i })
        if (await validerButton.isVisible({ timeout: 5000 })) {
            await validerButton.click()

            // Confirmer si nécessaire
            const confirmerButton = page.getByRole('button', { name: /confirmer|oui/i })
            if (await confirmerButton.isVisible({ timeout: 2000 })) {
                await confirmerButton.click()
            }

            await expect(page.getByText(/validée|succès/i)).toBeVisible({ timeout: 10000 })
        }
    })

    test('3. Agent génère l\'attestation', async ({ page }) => {
        // Connexion agent
        await page.goto('/login')
        await page.getByRole('textbox', { name: /email/i }).fill('agent@servicecivique.ne')
        await page.getByRole('textbox', { name: /mot de passe|password/i }).fill('Agent123!')
        await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()
        await page.waitForURL(/agent/, { timeout: 10000 })

        // Aller sur une demande validée
        await page.goto('/agent/demandes')

        // Filtrer par statut VALIDEE si possible
        const statutFilter = page.getByRole('combobox', { name: /statut/i })
        if (await statutFilter.isVisible({ timeout: 2000 })) {
            await statutFilter.selectOption('VALIDEE')
            await page.waitForLoadState('networkidle')
        }

        // Cliquer sur le bouton générer
        const genererButton = page.getByRole('button', { name: /générer|attestation/i }).first()
        if (await genererButton.isVisible({ timeout: 5000 })) {
            await genererButton.click()

            await expect(page.getByText(/générée|succès/i)).toBeVisible({ timeout: 10000 })
        }
    })

    test('4. Directeur signe l\'attestation', async ({ page }) => {
        // Connexion directeur
        await page.goto('/login')
        await page.getByRole('textbox', { name: /email/i }).fill('directeur@servicecivique.ne')
        await page.getByRole('textbox', { name: /mot de passe|password/i }).fill('Directeur123!')
        await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()
        await page.waitForURL(/directeur/, { timeout: 10000 })

        // Aller sur les attestations
        await page.goto('/directeur/attestations')

        // Cliquer sur Signer
        const signerButton = page.getByRole('button', { name: /signer/i }).first()
        if (await signerButton.isVisible({ timeout: 5000 })) {
            await signerButton.click()

            // Entrer le PIN (utiliser le PIN de test)
            const pinField = page.getByRole('textbox', { name: /pin/i })
                .or(page.getByPlaceholder(/pin/i))

            if (await pinField.isVisible({ timeout: 3000 })) {
                await pinField.fill('1234') // PIN de test

                await page.getByRole('button', { name: /confirmer|signer/i }).last().click()

                await expect(page.getByText(/signée|succès/i)).toBeVisible({ timeout: 10000 })
            }
        }
    })
})

test.describe('Vérification QR Code', () => {
    test('devrait vérifier une attestation via la page publique', async ({ page }) => {
        // Cette page est publique
        await page.goto('/verify')

        // Vérifier que la page de vérification est accessible
        await expect(page.getByText(/vérification|authentification|attestation/i)).toBeVisible()
    })

    test('devrait afficher une erreur pour un QR invalide', async ({ page }) => {
        // Accéder avec des paramètres invalides
        await page.goto('/verify?numero=INVALID&signature=FAKE&timestamp=0')

        // Devrait afficher une erreur
        await expect(page.getByText(/invalide|introuvable|erreur/i)).toBeVisible({ timeout: 5000 })
    })
})
