# Guide de Développement - Système d'Import Excel

## Architecture

### Services

#### ExcelParserService
**Fichier:** `src/lib/services/excel-parser.service.ts`

Responsabilités :
- Lecture et parsing des fichiers Excel
- Auto-détection des colonnes
- Mapping personnalisé
- Validation des données
- Conversion des types (dates, nombres, texte)

**Méthodes principales:**

```typescript
// Preview du fichier (analyse sans import)
async previewExcelFile(filePath: string): Promise<ExcelPreviewResult>

// Import avec mapping optionnel
async parseExcelFile(filePath: string, columnMapping?: ColumnMapping): Promise<ExcelParseResult>

// Méthodes privées
private suggestMapping(headers: string[]): ColumnMapping
private convertMappingToIndexes(mapping: ColumnMapping, headerRow: ExcelJS.Row): Record<string, number>
private extractHeaders(headerRow: ExcelJS.Row): Record<string, number>
private parseRow(row: ExcelJS.Row, headers: Record<string, number>): AppeleFromExcel | null
private parseNumero(cell: ExcelJS.Cell): number | null
private parseText(cell: ExcelJS.Cell): string | null
private parseDate(cell: ExcelJS.Cell): Date | null
```

#### AppeleRechercheService
**Fichier:** `src/lib/services/appele-recherche.service.ts`

Responsabilités :
- Recherche d'appelés dans la base (table `appeles_arretes`)
- Filtres multiples (nom, promotion, lieu, diplôme, etc.)
- Statistiques

### API Endpoints

#### Preview (GET)
```
POST /api/admin/arretes/[id]/preview-appeles
```

**Input:** FormData avec fichier Excel

**Output:**
```typescript
{
  success: boolean;
  preview: {
    headers: string[];
    suggestedMapping: ColumnMapping;
    sampleRows: any[][];
    totalRows: number;
  }
}
```

**Rôles autorisés:** ADMIN, SAISIE

#### Upload (POST)
```
POST /api/admin/arretes/[id]/upload-appeles
```

**Input:** 
```typescript
FormData {
  file: File;
  mapping?: string; // JSON stringifié de ColumnMapping
}
```

**Output:**
```typescript
{
  success: boolean;
  appeles: number;
  errors?: string[];
  warnings?: string[];
}
```

**Rôles autorisés:** ADMIN, SAISIE

#### Liste des appelés
```
GET /api/admin/arretes/[id]/appeles
```

**Output:**
```typescript
{
  appeles: AppeleRechercheResult[];
  count: number;
}
```

### Base de données

#### Table `appeles_arretes`

```prisma
model AppeleArrete {
  id                String   @id @default(cuid())
  numero            Int      // Numéro dans l'arrêté
  nom               String
  prenoms           String?
  dateNaissance     DateTime?
  lieuNaissance     String?
  diplome           String?
  lieuService       String?  // Lieu de service de l'appelé
  
  // Relation
  arreteId          String
  arrete            Arrete   @relation(...)
  
  createdAt         DateTime @default(now())

  @@index([arreteId])
  @@index([nom])
}
```

**Index importants:**
- `arreteId` : Pour lister tous les appelés d'un arrêté
- `nom` : Pour les recherches par nom

**Relations:**
- `arrete` : Many-to-one vers `Arrete`

#### Table `arretes`

```prisma
model Arrete {
  id                String            @id @default(cuid())
  numero            String            @unique
  dateArrete        DateTime
  promotion         String
  annee             String
  lieuService       String?           // Fallback si pas dans appeles_arretes
  nombreAppeles     Int               @default(0)
  // ...
  
  appeles           AppeleArrete[]
}
```

## Workflow d'import complet

```
┌─────────────────┐
│  1. Upload      │
│  Fichier Excel  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. Preview     │
│  API Call       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  3. ExcelParserService      │
│  - Lecture fichier          │
│  - Extraction en-têtes      │
│  - Auto-détection mapping   │
│  - Échantillon 5 lignes     │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  4. UI : Validation mapping │
│  - Afficher en-têtes        │
│  - Afficher mapping suggéré │
│  - Permettre ajustement     │
│  - Afficher échantillon     │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────┐
│  5. Upload      │
│  avec mapping   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  6. ExcelParserService      │
│  - Parse avec mapping       │
│  - Validation données       │
│  - Conversion types         │
│  - Détection doublons       │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  7. Database                │
│  - Suppression anciens      │
│  - Insert nouveaux          │
│  - Update arrete.nombreAppeles │
└─────────────────────────────┘
```

## Gestion des types

### Numéros (entiers)
```typescript
private parseNumero(cell: ExcelJS.Cell): number | null {
  // Support: number, string convertible
  // Exemple: 1, "1", 1.5 → 1
}
```

### Texte
```typescript
private parseText(cell: ExcelJS.Cell): string | null {
  // Support: string, number, any.toString()
  // Trim automatique
}
```

### Dates
```typescript
private parseDate(cell: ExcelJS.Cell): Date | null {
  // Support:
  // - Date objects
  // - Excel serial dates (nombres)
  // - Formats texte: JJ/MM/AAAA, AAAA-MM-JJ
}
```

## Tests

### Test unitaire du service
```bash
npx tsx scripts/test-excel-mapping.ts
```

**Prérequis:** Fichier Excel de test dans `public/uploads/test-appeles.xlsx`

### Test d'intégration
```bash
# Démarrer le serveur
npm run dev

# Tester l'API avec curl
curl -X POST http://localhost:3000/api/admin/arretes/[ID]/preview-appeles \
  -H "Cookie: ..." \
  -F "file=@test.xlsx"
```

## Cas d'usage

### Cas 1 : Format standard (auto-détection)
```typescript
// Pas de mapping nécessaire
const formData = new FormData();
formData.append('file', file);

fetch('/api/admin/arretes/123/upload-appeles', {
  method: 'POST',
  body: formData
});
```

### Cas 2 : Format personnalisé
```typescript
// 1. Preview
const preview = await fetch('/api/admin/arretes/123/preview-appeles', {
  method: 'POST',
  body: formData
}).then(r => r.json());

// 2. Ajuster le mapping
const mapping = {
  ...preview.preview.suggestedMapping,
  diplome: 8 // Override colonne diplôme
};

// 3. Import
formData.append('mapping', JSON.stringify(mapping));
fetch('/api/admin/arretes/123/upload-appeles', {
  method: 'POST',
  body: formData
});
```

### Cas 3 : Colonnes avec noms exacts
```typescript
const mapping = {
  numero: "N°",
  nom: "NOM_FAMILLE",
  prenoms: "PRENOMS_USUELS"
};
```

## Erreurs communes

### Colonne manquante
```json
{
  "success": false,
  "errors": ["Colonnes manquantes: numero, nom"]
}
```
**Solution:** Vérifier que les colonnes requises sont présentes ou ajuster le mapping

### Colonne introuvable
```json
{
  "success": false,
  "error": "Colonne \"NOM_COMPLET\" introuvable dans les en-têtes"
}
```
**Solution:** Vérifier l'orthographe exacte de la colonne (case-insensitive)

### Format de date invalide
**Warning:** "Ligne 5: Date de naissance invalide"
**Solution:** Les dates doivent être au format JJ/MM/AAAA ou AAAA-MM-JJ

### Numéro en double
**Warning:** "Numéros en double détectés: 1, 5"
**Solution:** Vérifier l'unicité des numéros d'ordre

## Optimisations futures

### Performance
- [ ] Streaming pour gros fichiers (>10 000 lignes)
- [ ] Batch insert avec prisma.$transaction
- [ ] Cache du mapping par arrêté

### Fonctionnalités
- [ ] Import incrémental (sans suppression)
- [ ] Détection automatique du lieu de service
- [ ] Validation avancée (emails, téléphones, etc.)
- [ ] Export du mapping en JSON réutilisable
- [ ] Templates de mapping par promotion

### UX
- [ ] Drag & drop pour associer les colonnes
- [ ] Visualisation des erreurs ligne par ligne
- [ ] Progression en temps réel
- [ ] Rollback en cas d'erreur

## Dépendances

- `exceljs` : Lecture/écriture fichiers Excel
- `prisma` : ORM base de données
- `next.js` : Framework API
- `fs/promises` : Gestion fichiers

## Logs de débogage

Le service génère des logs détaillés :

```
📊 Lecture du fichier Excel: /path/to/file.xlsx
📄 Feuille: "Sheet1" - 150 lignes
🔍 Mapping utilisé: {"numero":1,"nom":2,"prenoms":3}
✅ 149 appelés extraits
💾 Nouveaux appelés insérés en base
```

Activer les logs :
```typescript
// Dans excel-parser.service.ts
console.log(...) // Déjà présents
```

## Sécurité

### Validation des fichiers
- Types MIME vérifiés : `.xlsx`, `.xls`
- Taille max : Configurable (actuellement illimitée)
- Fichiers temporaires supprimés après traitement

### Permissions
- Preview : `ADMIN`, `SAISIE`
- Upload : `ADMIN`, `SAISIE`
- Liste : `ADMIN`, `SAISIE`, `AGENT`

### Injection
- Pas d'exécution de code depuis Excel
- Toutes les valeurs sont parsées et typées
- Validation Prisma sur insert

## Support

En cas de problème :
1. Vérifier les logs du serveur
2. Tester avec le script `test-excel-mapping.ts`
3. Vérifier la structure du fichier Excel
4. Consulter `MAPPING_COLONNES_EXCEL.md`
