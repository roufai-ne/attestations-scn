# Stratégie de Tests - Attestations SCN

## Vue d'ensemble

Ce document décrit la stratégie de tests mise en place pour l'application de gestion des attestations du Service Civique National du Niger.

## Stack de Tests

| Type | Outil | Description |
|------|-------|-------------|
| Tests Unitaires | Vitest | Tests rapides des fonctions et services isolés |
| Tests d'Intégration | Vitest | Tests des API routes et interactions entre composants |
| Tests E2E | Playwright | Tests de bout en bout simulant l'utilisateur |

## Structure des Tests

```
tests/
├── setup.ts                    # Configuration globale Vitest
├── mocks/
│   └── prisma.mock.ts         # Mock du client Prisma
├── unit/
│   └── services/
│       ├── qrcode.service.test.ts
│       ├── arrete.service.test.ts
│       ├── ocr.service.test.ts
│       └── audit.service.test.ts
├── integration/
│   └── api/
│       └── arretes.test.ts
└── e2e/
    ├── auth.spec.ts
    ├── admin-arretes.spec.ts
    └── agent-demandes.spec.ts
```

## Scripts Disponibles

```bash
# Tests unitaires en mode watch
npm run test

# Exécuter les tests unitaires une fois
npm run test:unit

# Exécuter les tests d'intégration
npm run test:integration

# Générer le rapport de couverture
npm run test:coverage

# Interface graphique Vitest
npm run test:ui

# Tests E2E avec Playwright
npm run test:e2e

# Tests E2E avec interface graphique
npm run test:e2e:ui

# Tests E2E avec navigateur visible
npm run test:e2e:headed

# Tous les tests
npm run test:all
```

## Configuration

### Vitest (vitest.config.ts)

- Environment: `jsdom` pour simuler le DOM
- Alias: `@/` pointe vers `./src`
- Coverage: V8 provider avec rapports text, JSON et HTML
- Globals: `describe`, `it`, `expect`, etc. disponibles sans import

### Playwright (playwright.config.ts)

- Navigateurs: Chrome et Firefox
- Base URL: `http://localhost:3000`
- Screenshots: Uniquement en cas d'échec
- Traces: Activées sur le premier retry

## Tests Unitaires

### Services Testés

#### 1. QRCodeService (`qrcode.service.test.ts`)
- Génération de QR codes signés HMAC-SHA256
- Validation des signatures
- Parsing et validation des données JSON
- Expiration des QR codes (10 ans)

#### 2. ArreteService (`arrete.service.test.ts`)
- CRUD des arrêtés
- Pagination et filtrage
- Recherche fulltext
- Réindexation OCR
- Statistiques d'indexation

#### 3. OCRService (`ocr.service.test.ts`)
- Extraction de texte depuis PDF
- Intégration Tesseract.js
- Nettoyage du texte extrait
- Calcul de la confiance moyenne

#### 4. AuditService (`audit.service.test.ts`)
- Logging des actions (20+ types)
- Filtrage des logs
- Statistiques d'activité
- Tracking par utilisateur

## Tests d'Intégration

### API Routes Testées

#### `/api/admin/arretes`
- `GET` - Liste paginée avec filtres
- `POST` - Upload et création d'arrêté
- Validation des permissions (role ADMIN requis)
- Validation des données (Zod)
- Gestion des erreurs

## Tests E2E

### Workflows Testés

#### 1. Authentification (`auth.spec.ts`)
- Affichage de la page de connexion
- Erreurs pour identifiants invalides
- Connexion réussie par rôle (Admin, Agent, Directeur)
- Déconnexion
- Protection des routes

#### 2. Admin - Arrêtés (`admin-arretes.spec.ts`)
- Affichage de la liste des arrêtés
- Upload de nouveaux arrêtés
- Recherche et filtrage
- Visualisation du contenu OCR
- Modification des métadonnées
- Suppression avec confirmation
- Réindexation

#### 3. Agent - Demandes (`agent-demandes.spec.ts`)
- Dashboard agent
- Création de nouvelle demande
- Validation des champs requis
- Détails d'une demande
- Workflow validation/rejet

## Bonnes Pratiques

### Mocking

```typescript
// Mock Prisma pour éviter les appels DB
vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

// Reset des mocks entre les tests
beforeEach(() => {
  vi.clearAllMocks()
  resetPrismaMock()
})
```

### Tests Asynchrones

```typescript
it('devrait créer un arrêté', async () => {
  prismaMock.arrete.create.mockResolvedValueOnce(mockArrete)

  const result = await service.createArrete(input)

  expect(result.id).toBeDefined()
})
```

### Tests E2E Robustes

```typescript
// Utiliser .or() pour des sélecteurs alternatifs
const button = page.getByRole('button', { name: /voir/i })
  .or(page.getByRole('link', { name: /voir/i }))

// Vérifier la visibilité avant interaction
if (await button.isVisible()) {
  await button.click()
}
```

## Couverture Cible

| Catégorie | Cible | Priorité |
|-----------|-------|----------|
| Services critiques | > 80% | Haute |
| API Routes | > 70% | Haute |
| Composants UI | > 60% | Moyenne |
| Workflows E2E | 100% cas critiques | Haute |

## Prérequis

### Pour les tests unitaires/intégration

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react jsdom
```

### Pour les tests E2E

```bash
npm install -D @playwright/test
npx playwright install  # Installe les navigateurs
```

## CI/CD

### GitHub Actions (exemple)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

## Données de Test

### Comptes de test (seed)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@servicecivique.ne | Admin123! |
| Agent | agent@servicecivique.ne | Agent123! |
| Directeur | directeur@servicecivique.ne | Directeur123! |

## Dépannage

### Erreur "Cannot find module '@/...'"

Vérifier que l'alias `@` est configuré dans `vitest.config.ts`:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### Tests Playwright timeout

Augmenter le timeout ou vérifier que l'application est démarrée:

```typescript
test.setTimeout(30000)
await page.waitForLoadState('networkidle')
```

### Mocks non réinitialisés

S'assurer d'appeler `vi.clearAllMocks()` dans `beforeEach`:

```typescript
beforeEach(() => {
  vi.clearAllMocks()
})
```

---

**Dernière mise à jour:** 14 janvier 2026
**Version:** 1.0.0
