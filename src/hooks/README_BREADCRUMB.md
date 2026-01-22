# Hook useBreadcrumb - Documentation

## Vue d'ensemble

Le hook `useBreadcrumb` permet de générer automatiquement des fils d'Ariane (breadcrumbs) intelligents avec possibilité de customisation pour des contextes dynamiques.

## Installation

Le hook est disponible dans `src/hooks/useBreadcrumb.ts`. Il fonctionne avec le composant `Breadcrumbs` existant.

## Fonctionnalités

✅ **Auto-génération** : Génère automatiquement les breadcrumbs depuis le pathname  
✅ **Labels dynamiques** : Support des données dynamiques (ex: "Demande #1234")  
✅ **Mapping personnalisé** : Override des labels par segment  
✅ **Items additionnels** : Ajout d'items custom  
✅ **Détection IDs** : Masque automatiquement les CUID/UUID/nombres  
✅ **TypeScript** : Typage complet avec interfaces  

## API

### `useBreadcrumb(options?)`

Hook principal pour générer les breadcrumbs.

#### Options

```typescript
interface UseBreadcrumbOptions {
  // Override le label du dernier segment
  customLabel?: string;
  
  // Items additionnels à ajouter
  additionalItems?: BreadcrumbItem[];
  
  // Désactiver auto-génération
  disableAuto?: boolean;
  
  // Mapping personnalisé
  customMapping?: Record<string, string>;
}
```

#### Retour

```typescript
BreadcrumbItem[] // Array d'items avec label, href, icon
```

---

### `useBreadcrumbWithData(options)`

Hook simplifié pour afficher des données dynamiques (ex: nom d'entité).

#### Options

```typescript
{
  dataLabel?: string | null;        // Label depuis données (ex: demande.numero)
  fallbackLabel?: string;           // Label si données pas chargées
  customMapping?: Record<string, string>;
}
```

---

### `useBreadcrumbContext(items)`

Hook pour contexte complètement personnalisé (pas d'auto-génération).

#### Paramètres

```typescript
items: BreadcrumbItem[] // Array d'items personnalisés
```

---

## Exemples d'utilisation

### 1. Auto-génération basique

```tsx
'use client';

import { useBreadcrumb } from '@/hooks/useBreadcrumb';
import Breadcrumbs from '@/components/shared/Breadcrumbs';

export default function DemandesPage() {
  const breadcrumbs = useBreadcrumb();
  
  return (
    <div>
      <Breadcrumbs items={breadcrumbs} />
      <h1>Liste des demandes</h1>
    </div>
  );
}

// URL: /agent/demandes
// Breadcrumbs: Agent > Demandes
```

---

### 2. Label dynamique avec données

```tsx
'use client';

import { useBreadcrumbWithData } from '@/hooks/useBreadcrumb';
import Breadcrumbs from '@/components/shared/Breadcrumbs';

export default function DemandeDetailPage({ demande }: { demande?: Demande }) {
  const breadcrumbs = useBreadcrumbWithData({
    dataLabel: demande?.numeroEnregistrement,
    fallbackLabel: 'Chargement...',
  });
  
  return (
    <div>
      <Breadcrumbs items={breadcrumbs} />
      <h1>Détails de la demande</h1>
    </div>
  );
}

// URL: /agent/demandes/clxxx
// Breadcrumbs: Agent > Demandes > Demande #2026-001
```

---

### 3. Items additionnels

```tsx
'use client';

import { useBreadcrumb } from '@/hooks/useBreadcrumb';

export default function AttestationHistoriquePage({ attestation }: { attestation: Attestation }) {
  const breadcrumbs = useBreadcrumb({
    additionalItems: [
      {
        label: attestation.numero,
        href: `/admin/attestations/${attestation.id}`,
      },
      {
        label: 'Historique', // Dernier item sans href
      },
    ],
  });
  
  return <Breadcrumbs items={breadcrumbs} />;
}

// URL: /admin/attestations/clxxx/historique
// Breadcrumbs: Admin > Attestations > ATT-2026-00123 > Historique
```

---

### 4. Mapping personnalisé

```tsx
'use client';

import { useBreadcrumb } from '@/hooks/useBreadcrumb';

export default function MesDemandesPage() {
  const breadcrumbs = useBreadcrumb({
    customMapping: {
      'mes-demandes': 'Mes Demandes',
      'en-attente': 'En Attente de Signature',
    },
  });
  
  return <Breadcrumbs items={breadcrumbs} />;
}

// URL: /directeur/mes-demandes/en-attente
// Breadcrumbs: Directeur > Mes Demandes > En Attente de Signature
```

---

### 5. Contexte complètement custom

```tsx
'use client';

import { useBreadcrumbContext } from '@/hooks/useBreadcrumb';

export default function RapportDetailPage({ rapport }: { rapport: Rapport }) {
  const breadcrumbs = useBreadcrumbContext([
    { label: 'Administration', href: '/admin' },
    { label: 'Rapports', href: '/admin/rapports' },
    { label: 'Statistiques', href: '/admin/rapports/stats' },
    { label: rapport.titre }, // Dernier item sans href
  ]);
  
  return <Breadcrumbs items={breadcrumbs} />;
}

// Breadcrumbs: Administration > Rapports > Statistiques > Rapport Mensuel Janvier 2026
```

---

### 6. Avec Server Component (fetch data)

```tsx
import { useBreadcrumbWithData } from '@/hooks/useBreadcrumb';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { prisma } from '@/lib/prisma';

export default async function DemandeDetailPage({ params }: { params: { id: string } }) {
  // Fetch côté serveur
  const demande = await prisma.demande.findUnique({
    where: { id: params.id },
    select: { numeroEnregistrement: true, appeleLe: true },
  });
  
  // Client Component pour breadcrumb
  return (
    <>
      <BreadcrumbWrapper 
        dataLabel={demande?.numeroEnregistrement}
        appelleLe={demande?.appeleLe}
      />
      <h1>Détails</h1>
    </>
  );
}

// Client Component séparé
'use client';
function BreadcrumbWrapper({ dataLabel, appelleLe }: { dataLabel?: string; appelleLe?: Date }) {
  const breadcrumbs = useBreadcrumbWithData({
    dataLabel: dataLabel 
      ? `${dataLabel} - ${new Date(appelleLe).toLocaleDateString()}`
      : undefined,
    fallbackLabel: 'Chargement...',
  });
  
  return <Breadcrumbs items={breadcrumbs} />;
}
```

---

## Mapping par défaut

Le hook inclut un mapping pré-défini pour les segments courants :

```typescript
{
  // Rôles
  'agent': 'Agent',
  'directeur': 'Directeur',
  'admin': 'Administration',
  
  // Modules
  'demandes': 'Demandes',
  'attestations': 'Attestations',
  'arretes': 'Arrêtés',
  'utilisateurs': 'Utilisateurs',
  'rapports': 'Rapports',
  'audit': 'Journal d\'audit',
  
  // Pages
  'dashboard': 'Tableau de bord',
  'nouvelle-demande': 'Nouvelle demande',
  'signature': 'Signature',
  'profil': 'Mon profil',
  
  // Actions
  'ajouter': 'Ajouter',
  'modifier': 'Modifier',
  'details': 'Détails',
}
```

Pour ajouter des segments custom, utilisez `customMapping`.

---

## Détection automatique des IDs

Le hook détecte automatiquement 3 types d'IDs et les masque :

1. **CUID** : `clxxx` (20+ caractères alphanumériques)
2. **UUID** : `123e4567-e89b-12d3-a456-426614174000`
3. **Nombres** : `123`, `456789`

Quand un ID est détecté :
- Si `customLabel` fourni → Utilise customLabel
- Sinon → Affiche "Détails"

---

## Intégration avec Breadcrumbs existant

Le hook retourne des `BreadcrumbItem[]` compatibles avec le composant `Breadcrumbs` :

```tsx
// Composant Breadcrumbs attend:
interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

// Le hook retourne exactement ce format
const breadcrumbs = useBreadcrumb(); // BreadcrumbItem[]
<Breadcrumbs items={breadcrumbs} />
```

---

## Cas d'usage avancés

### Breadcrumb avec icône custom

```tsx
import { Home, FileText } from 'lucide-react';

const breadcrumbs = useBreadcrumb({
  additionalItems: [
    {
      label: 'Documents',
      href: '/admin/documents',
      icon: <FileText className="w-4 h-4" />,
    },
  ],
});
```

### Breadcrumb conditionnel

```tsx
const breadcrumbs = useBreadcrumb({
  customLabel: isEditing ? 'Modifier' : 'Détails',
  customMapping: {
    'demandes': isDraft ? 'Brouillons' : 'Demandes',
  },
});
```

### Breadcrumb avec état de chargement

```tsx
const breadcrumbs = useBreadcrumbWithData({
  dataLabel: isLoading ? undefined : demande?.numero,
  fallbackLabel: isLoading ? 'Chargement...' : 'Non trouvée',
});
```

---

## Performance

Le hook utilise `useMemo` pour éviter les recalculs inutiles. Les breadcrumbs sont regénérés seulement si :
- Le pathname change
- Les options changent (customLabel, additionalItems, etc.)

---

## Migration depuis Breadcrumbs existant

### Avant (manuel)

```tsx
<Breadcrumbs 
  items={[
    { label: 'Agent', href: '/agent' },
    { label: 'Demandes', href: '/agent/demandes' },
    { label: 'Nouvelle demande' },
  ]}
/>
```

### Après (automatique)

```tsx
const breadcrumbs = useBreadcrumb({
  customLabel: 'Nouvelle demande',
});
<Breadcrumbs items={breadcrumbs} />
```

---

## Tests

Pour tester le hook :

```typescript
import { renderHook } from '@testing-library/react';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';

// Mock usePathname
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/agent/demandes'),
}));

test('génère breadcrumbs depuis pathname', () => {
  const { result } = renderHook(() => useBreadcrumb());
  
  expect(result.current).toEqual([
    { label: 'Agent', href: '/agent' },
    { label: 'Demandes', href: '/agent/demandes' },
  ]);
});
```

---

## FAQ

**Q: Comment désactiver l'auto-génération ?**  
R: Utilisez `useBreadcrumbContext` ou passez `disableAuto: true`.

**Q: Les IDs sont toujours masqués ?**  
R: Oui, sauf si vous fournissez un `customLabel` pour override.

**Q: Puis-je ajouter des icônes ?**  
R: Oui, via la propriété `icon` dans `BreadcrumbItem`.

**Q: Fonctionne avec SSR ?**  
R: Oui, mais le hook doit être dans un Client Component (`'use client'`).

**Q: Comment tester si un label est utilisé ?**  
R: Vérifiez le label dans le tableau retourné par le hook.

---

## Support

Pour des questions ou bugs, consultez :
- [Breadcrumbs.tsx](../components/shared/Breadcrumbs.tsx)
- [Guide développement](../../../Guide_Agent_IA_Developpement.md)
- Tests : `tests/unit/hooks/useBreadcrumb.test.ts` (à créer)

---

**Version**: 1.0.0  
**Dernière mise à jour**: Janvier 2026
