# Système de Mapping des Colonnes Excel

## Vue d'ensemble

Le système de mapping des colonnes permet d'importer des fichiers Excel avec **n'importe quelle structure** en spécifiant explicitement quelle colonne correspond à quel champ.

## Flux d'importation

### 1. **Preview** (Analyse du fichier)

```
POST /api/admin/arretes/[id]/preview-appeles
```

**Requête:**
```typescript
FormData {
  file: File // Fichier Excel
}
```

**Réponse:**
```typescript
{
  success: true,
  preview: {
    headers: string[],           // ["N°", "NOM", "PRENOM", "DN", ...]
    suggestedMapping: {          // Mapping auto-détecté
      numero: 1,
      nom: 2,
      prenoms: 3,
      dateNaissance: 4,
      // ...
    },
    sampleRows: any[][],         // 5 premières lignes de données
    totalRows: number            // Nombre total de lignes (hors en-tête)
  }
}
```

### 2. **Import** (avec mapping personnalisé)

```
POST /api/admin/arretes/[id]/upload-appeles
```

**Requête:**
```typescript
FormData {
  file: File,                    // Fichier Excel
  mapping: string                // JSON stringifié du mapping (optionnel)
}
```

**Mapping Format:**
```typescript
interface ColumnMapping {
  numero: string | number;       // REQUIS
  nom: string | number;          // REQUIS
  prenoms: string | number;      // REQUIS
  dateNaissance?: string | number;
  lieuNaissance?: string | number;
  diplome?: string | number;
  lieuService?: string | number;
}
```

## Types de mapping

### 1. **Auto-détection** (pas de mapping fourni)

Si aucun mapping n'est fourni, le système essaie de détecter automatiquement les colonnes basé sur les en-têtes :

| En-tête Excel | Champ détecté |
|---------------|---------------|
| `N°`, `Numero`, `N` | numero |
| `Nom` | nom |
| `Prénom`, `Prenom`, `Prénoms` | prenoms |
| `Date Naissance`, `Date de Naissance` | dateNaissance |
| `Lieu Naissance`, `Lieu de Naissance` | lieuNaissance |
| `Diplôme`, `Diplome`, `Formation` | diplome |
| `Lieu Service`, `Lieu de Service` | lieuService |

### 2. **Mapping par index de colonne**

Spécifier l'index de la colonne (1-based, comme dans Excel) :

```json
{
  "numero": 1,
  "nom": 2,
  "prenoms": 3,
  "dateNaissance": 4,
  "lieuNaissance": 5,
  "diplome": 6,
  "lieuService": 7
}
```

### 3. **Mapping par nom de colonne**

Spécifier le nom exact de la colonne (sensible à la casse) :

```json
{
  "numero": "N°",
  "nom": "NOM",
  "prenoms": "PRENOM",
  "dateNaissance": "DN",
  "lieuNaissance": "LN",
  "diplome": "DIPLOME",
  "lieuService": "LIEU"
}
```

### 4. **Mapping mixte**

Combiner index et noms :

```json
{
  "numero": 1,
  "nom": "NOM_FAMILLE",
  "prenoms": 3,
  "dateNaissance": "DATE_NAISSANCE"
}
```

## Exemples d'utilisation

### Exemple 1 : Fichier standard

**Fichier Excel:**
```
| N° | Nom     | Prénom  | Date Naissance | Lieu Naissance | Diplôme |
|----|---------|---------|----------------|----------------|---------|
| 1  | DUPONT  | Jean    | 15/03/1995     | Paris          | BAC+3   |
| 2  | MARTIN  | Marie   | 22/07/1996     | Lyon           | BAC+2   |
```

**Requête:** Pas de mapping nécessaire (auto-détection) ✅

### Exemple 2 : Fichier avec colonnes non standard

**Fichier Excel:**
```
| NO | NOM_FAMILLE | PRENOMS_USUELS | DN         | LN      | DIPLOME_OBTENU |
|----|-------------|----------------|------------|---------|----------------|
| 1  | DUPONT      | Jean           | 15/03/1995 | Paris   | Licence        |
| 2  | MARTIN      | Marie          | 22/07/1996 | Lyon    | BTS            |
```

**Requête avec mapping:**
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('mapping', JSON.stringify({
  numero: "NO",
  nom: "NOM_FAMILLE",
  prenoms: "PRENOMS_USUELS",
  dateNaissance: "DN",
  lieuNaissance: "LN",
  diplome: "DIPLOME_OBTENU"
}));
```

### Exemple 3 : Colonnes dans le désordre

**Fichier Excel:**
```
| Nom     | Prénom  | N° | Diplôme | Date Naissance | Lieu Naissance |
|---------|---------|----|---------| ---------------|----------------|
| DUPONT  | Jean    | 1  | BAC+3   | 15/03/1995     | Paris          |
```

**Requête avec mapping par index:**
```typescript
formData.append('mapping', JSON.stringify({
  numero: 3,        // Colonne C
  nom: 1,           // Colonne A
  prenoms: 2,       // Colonne B
  dateNaissance: 5, // Colonne E
  lieuNaissance: 6, // Colonne F
  diplome: 4        // Colonne D
}));
```

## Workflow Frontend recommandé

```typescript
// 1. Upload et preview
const previewResponse = await fetch('/api/admin/arretes/123/preview-appeles', {
  method: 'POST',
  body: formData
});
const { preview } = await previewResponse.json();

// 2. Afficher les colonnes détectées et suggérer le mapping
console.log('En-têtes:', preview.headers);
console.log('Mapping suggéré:', preview.suggestedMapping);
console.log('Échantillon:', preview.sampleRows);

// 3. Laisser l'utilisateur ajuster le mapping si nécessaire
const userMapping = adjustMapping(preview.suggestedMapping);

// 4. Importer avec le mapping final
const importFormData = new FormData();
importFormData.append('file', file);
importFormData.append('mapping', JSON.stringify(userMapping));

const importResponse = await fetch('/api/admin/arretes/123/upload-appeles', {
  method: 'POST',
  body: importFormData
});
```

## Validation

### Champs requis
- `numero` (numéro d'ordre de l'appelé)
- `nom` (nom de famille)
- `prenoms` (prénom(s) de l'appelé)

### Champs optionnels
- `dateNaissance`
- `lieuNaissance`
- `diplome`
- `lieuService`

### Gestion des erreurs

**Colonne manquante:**
```json
{
  "success": false,
  "errors": ["Colonnes manquantes: numero, nom"]
}
```

**Colonne introuvable:**
```json
{
  "success": false,
  "error": "Colonne \"NOM_COMPLET\" introuvable dans les en-têtes"
}
```

## Avantages

✅ **Flexibilité totale** : Supporte n'importe quelle structure Excel
✅ **Auto-détection** : Mapping automatique pour les formats standards
✅ **Preview** : Validation avant import définitif
✅ **Réutilisable** : Sauvegarder le mapping pour les imports futurs
✅ **Validation** : Erreurs claires si le mapping est incorrect

## Notes techniques

- Les index de colonnes sont **1-based** (comme dans Excel : A=1, B=2, etc.)
- Les noms de colonnes doivent correspondre **exactement** (case-insensitive)
- Le fichier temporaire est automatiquement supprimé après traitement
- Le mapping est optionnel : auto-détection par défaut
