# 🔒 RAPPORT D'AUDIT DE SÉCURITÉ
**Projet:** Attestations SCN  
**Date:** 28 Janvier 2026  
**Auditeur:** Ingénieur Sécurité Senior  
**Niveau de criticité:** 🔴 ÉLEVÉ - Actions requises

---

## 📊 RÉSUMÉ EXÉCUTIF

### Score Global: 6.5/10

**Vulnérabilités Identifiées:**
- 🔴 **Critique**: 4
- 🟠 **Élevée**: 6
- 🟡 **Moyenne**: 8
- 🟢 **Faible**: 3

---

## 🔴 VULNÉRABILITÉS CRITIQUES

### 1. Dépendances Vulnérables (CVE Connus)

**Criticité:** 🔴 CRITIQUE  
**CVE:** Multiples

#### Packages Affectés:
```
- @types/react-pdf: HIGH severity (range: 5.0.8 - 6.2.0)
  Impact: Vulnérabilité dans le typage React PDF
  
- pdfjs-dist: HIGH severity (<=4.1.392)
  Impact: Vulnérabilités XSS potentielles dans le rendu PDF
  
- next: MODERATE severity (15.6.0-canary.0 - 16.1.4)
  Impact: Version utilisée (16.1.1) présente des vulnérabilités connues
  
- diff: LOW severity (<4.0.4)
  Impact: Prototype pollution
```

**Recommandation:**
```bash
npm update @types/react-pdf pdfjs-dist next
npm audit fix --force
```

**Action Immédiate:**
- Mettre à jour `next` vers >= 16.1.5
- Mettre à jour `pdfjs-dist` vers >= 4.2.0
- Remplacer `@types/react-pdf` par la version corrigée

---

### 2. Injection SQL Potentielle - Raw Queries Non Paramétrées

**Criticité:** 🔴 CRITIQUE  
**Fichier:** `src/lib/services/stats.service.ts:168`

#### Code Vulnérable:
```typescript
const result = await prisma.$queryRaw<{ promotion: string; count: bigint }[]>`
  SELECT a.promotion, COUNT(*)::int as count
  FROM appeles a
  INNER JOIN demandes d ON a."demandeId" = d.id
  INNER JOIN attestations att ON d.id = att."demandeId"
  GROUP BY a.promotion
  ORDER BY count DESC
  LIMIT 10
`;
```

**Problème:** Bien que cette requête spécifique n'ait pas d'injection directe, l'utilisation de `$queryRaw` est dangereuse.

**Recommandation:**
```typescript
// ✅ SÉCURISÉ - Utiliser Prisma ORM natif
const result = await prisma.appeles.groupBy({
  by: ['promotion'],
  _count: { id: true },
  orderBy: { _count: { id: 'desc' } },
  take: 10,
  where: {
    demande: {
      attestations: {
        some: {}
      }
    }
  }
});
```

---

### 3. Upload de Fichiers Sans Validation de Type Stricte

**Criticité:** 🔴 CRITIQUE  
**Fichiers:** Multiples routes d'upload

#### Vulnérabilités:
```typescript
// ❌ VULNÉRABLE - Validation basée sur MIME type client
const allowedTypes = ['image/jpeg', 'image/png'];
if (!allowedTypes.includes(file.type)) {
  // Le client peut falsifier file.type !
}
```

**Fichiers Affectés:**
- `src/app/api/admin/assets/route.ts`
- `src/app/api/directeur/signature/config/route.ts`
- `src/app/api/admin/templates/route.ts`

**Recommandation:**
```typescript
import { fileTypeFromBuffer } from 'file-type';

// ✅ SÉCURISÉ - Validation basée sur les magic bytes
const buffer = await file.arrayBuffer();
const fileType = await fileTypeFromBuffer(Buffer.from(buffer));

if (!fileType || !['image/jpeg', 'image/png'].includes(fileType.mime)) {
  throw new Error('Type de fichier invalide');
}
```

**Installation requise:**
```bash
npm install file-type
```

---

### 4. Path Traversal dans les Routes d'Upload

**Criticité:** 🔴 CRITIQUE  
**Fichier:** `src/app/api/uploads/[...path]/route.ts`

#### Code Vulnérable:
```typescript
const { path: segments } = await params;
const filePath = path.join(getProjectRoot(), 'public', 'uploads', ...segments);
```

**Attaque Possible:**
```
GET /api/uploads/../../.env
GET /api/uploads/../../../etc/passwd
```

**Recommandation:**
```typescript
// ✅ SÉCURISÉ
import path from 'path';

const { path: segments } = await params;

// Valider chaque segment
for (const segment of segments) {
  if (segment.includes('..') || segment.includes('/') || segment.includes('\\')) {
    return NextResponse.json(
      { error: 'Chemin invalide' },
      { status: 400 }
    );
  }
}

const filePath = path.join(getProjectRoot(), 'public', 'uploads', ...segments);

// Vérifier que le chemin final est bien dans uploads
const uploadDir = path.join(getProjectRoot(), 'public', 'uploads');
if (!filePath.startsWith(uploadDir)) {
  return NextResponse.json(
    { error: 'Accès refusé' },
    { status: 403 }
  );
}
```

---

## 🟠 VULNÉRABILITÉS ÉLEVÉES

### 5. Absence de Rate Limiting sur Routes Sensibles

**Criticité:** 🟠 ÉLEVÉE  
**Impact:** Attaques par force brute

#### Routes Non Protégées:
- `/api/auth/signin` - Login
- `/api/auth/forgot-password` - Réinitialisation mot de passe
- `/api/admin/users/[id]/reset-password` - Reset admin
- `/api/directeur/signature/verify` - Vérification PIN

**Recommandation:**
Créer un middleware de rate limiting:

```typescript
// src/lib/security/rate-limiter.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export async function rateLimit(
  identifier: string,
  limit: number = 5,
  window: number = 60
): Promise<boolean> {
  const key = `rate_limit:${identifier}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, window);
  }
  
  return count <= limit;
}
```

---

### 6. Secrets Hardcodés et Gestion des Clés

**Criticité:** 🟠 ÉLEVÉE  
**Fichier:** `.env` exposé dans le repo

**Risques:**
- ❌ `.env` présent dans l'historique Git
- ❌ `NEXTAUTH_SECRET` potentiellement faible
- ❌ `QR_SECRET_KEY` non vérifié au démarrage

**Recommandation:**
```bash
# 1. Supprimer .env de l'historique Git
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 2. Ajouter au .gitignore (déjà fait)
echo ".env" >> .gitignore

# 3. Générer de nouveaux secrets
openssl rand -hex 32  # NEXTAUTH_SECRET
openssl rand -hex 32  # QR_SECRET_KEY
```

**Validation au démarrage:**
```typescript
// src/lib/security/env-validator.ts
export function validateSecrets() {
  const required = ['NEXTAUTH_SECRET', 'QR_SECRET_KEY', 'DATABASE_URL'];
  
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`❌ ${key} manquant dans .env`);
    }
    
    if (key.includes('SECRET') && process.env[key]!.length < 32) {
      throw new Error(`❌ ${key} doit contenir au moins 32 caractères`);
    }
  }
}
```

---

### 7. CORS Non Configuré Correctement

**Criticité:** 🟠 ÉLEVÉE  
**Fichier:** `next.config.ts`

**Problème:** Pas de configuration CORS explicite

**Recommandation:**
```typescript
// next.config.ts
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Access-Control-Allow-Origin',
          value: process.env.NEXTAUTH_URL || 'http://localhost:3000'
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET, POST, PUT, DELETE, OPTIONS'
        },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'Content-Type, Authorization'
        },
      ],
    },
  ];
}
```

---

### 8. Logs Contenant des Données Sensibles

**Criticité:** 🟠 ÉLEVÉE  
**Fichiers:** Multiples

**Code Problématique:**
```typescript
console.log('User data:', user); // ❌ Contient mot de passe hashé
console.error('Error:', error); // ❌ Peut contenir des tokens
```

**Recommandation:**
```typescript
// ✅ Créer un logger sécurisé
import { sanitizeForLogs } from '@/lib/security/sanitize';

export const logger = {
  info: (message: string, data?: any) => {
    console.log(message, sanitizeForLogs(data));
  },
  error: (message: string, error: Error) => {
    console.error(message, {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
```

---

### 9. Validation Insuffisante des Entrées Utilisateur

**Criticité:** 🟠 ÉLEVÉE  

**Champs Non Validés:**
- Numéro de téléphone (pas de validation format international)
- NIU (pas de validation checksum)
- Dates (pas de validation cohérence temporelle)

**Recommandation:**
```typescript
// src/lib/validation/custom-validators.ts
export const phoneValidator = z.string()
  .regex(/^\+227\d{8}$/, 'Format: +227XXXXXXXX')
  .refine(async (phone) => {
    // Vérifier que le numéro n'existe pas déjà
    const exists = await prisma.appele.findFirst({ where: { telephone: phone } });
    return !exists;
  }, 'Ce numéro existe déjà');

export const niuValidator = z.string()
  .length(13, 'Le NIU doit contenir 13 caractères')
  .regex(/^\d{13}$/, 'Le NIU doit contenir uniquement des chiffres')
  .refine((niu) => {
    // Validation checksum Luhn
    return validateNIUChecksum(niu);
  }, 'NIU invalide');
```

---

### 10. Sessions Sans Timeout Absolu

**Criticité:** 🟠 ÉLEVÉE  
**Fichier:** `src/auth.config.ts`

**Problème:** Pas de timeout absolu, sessions peuvent durer indéfiniment

**Recommandation:**
```typescript
// auth.config.ts
session: {
  strategy: 'jwt',
  maxAge: 8 * 60 * 60, // 8 heures
  updateAge: 30 * 60, // Rafraîchir toutes les 30 minutes
}

callbacks: {
  async jwt({ token, user }) {
    // Ajouter timestamp de création
    if (user) {
      token.createdAt = Date.now();
    }
    
    // Forcer re-authentification après 24h
    if (token.createdAt && Date.now() - token.createdAt > 24 * 60 * 60 * 1000) {
      throw new Error('Session expirée');
    }
    
    return token;
  }
}
```

---

## 🟡 VULNÉRABILITÉS MOYENNES

### 11. Absence de Protection CSRF sur Certaines Routes

**Criticité:** 🟡 MOYENNE

**Routes Sans Protection:**
- `/api/admin/assets` (PUT)
- `/api/admin/templates/[id]` (PUT, DELETE)

**Recommandation:**
Next.js 16 inclut une protection CSRF automatique, mais vérifier:
```typescript
// Ajouter un header custom pour les requêtes API
headers: {
  'X-CSRF-Token': await getCsrfToken()
}
```

---

### 12. Mot de Passe: Politique Faible

**Criticité:** 🟡 MOYENNE  
**Fichier:** `src/lib/validation/schemas.ts:94`

**Problème:**
```typescript
password: z.string().min(8) // ❌ Trop faible
```

**Recommandation:**
```typescript
password: z.string()
  .min(12, 'Au moins 12 caractères')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/[a-z]/, 'Au moins une minuscule')
  .regex(/[0-9]/, 'Au moins un chiffre')
  .regex(/[@$!%*?&]/, 'Au moins un caractère spécial')
  .refine(async (password) => {
    // Vérifier contre liste de mots de passe communs
    return !isCommonPassword(password);
  }, 'Mot de passe trop commun')
```

---

### 13. Gestion des Erreurs Exposant Trop d'Informations

**Criticité:** 🟡 MOYENNE

**Code Problématique:**
```typescript
catch (error) {
  return NextResponse.json({ 
    error: error.message // ❌ Expose détails internes
  }, { status: 500 });
}
```

**Recommandation:**
```typescript
catch (error) {
  logger.error('Erreur serveur', error);
  
  return NextResponse.json({ 
    error: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Une erreur est survenue'
  }, { status: 500 });
}
```

---

### 14. Backup de Base de Données Non Chiffré

**Criticité:** 🟡 MOYENNE  
**Fichier:** `attestations_backup.sql` (présent dans le repo)

**Problème:**
- Backup SQL en clair dans le repo
- Peut contenir des données sensibles

**Recommandation:**
```bash
# Supprimer du repo
git rm attestations_backup.sql
git commit -m "Remove database backup from repo"

# Ajouter au .gitignore
echo "*.sql" >> .gitignore
echo "*.dump" >> .gitignore
echo "backups/" >> .gitignore

# Chiffrer les backups
gpg --symmetric --cipher-algo AES256 backup.sql
```

---

### 15. Absence de CSP pour les Workers

**Criticité:** 🟡 MOYENNE

**Recommandation:**
Ajouter dans `next.config.ts`:
```typescript
"worker-src 'self' blob:;",
"child-src 'self' blob:;",
```

---

### 16. JWT Sans Signature Vérifiable

**Criticité:** 🟡 MOYENNE

**Vérifier:**
```typescript
// auth.config.ts
jwt: {
  // Utiliser RS256 au lieu de HS256 pour production
  algorithm: 'RS256',
  publicKey: process.env.JWT_PUBLIC_KEY,
  privateKey: process.env.JWT_PRIVATE_KEY,
}
```

---

### 17. Absence de Monitoring des Échecs d'Authentification

**Criticité:** 🟡 MOYENNE

**Recommandation:**
```typescript
// Tracker les échecs de login
await prisma.authLog.create({
  data: {
    action: 'LOGIN_FAILED',
    email: credentials.email,
    ip: request.ip,
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date()
  }
});

// Alerter après 5 échecs en 10 minutes
const failures = await prisma.authLog.count({
  where: {
    email: credentials.email,
    action: 'LOGIN_FAILED',
    timestamp: { gte: new Date(Date.now() - 10 * 60 * 1000) }
  }
});

if (failures >= 5) {
  await sendSecurityAlert(credentials.email);
}
```

---

### 18. Upload Files: Pas de Scan Antivirus

**Criticité:** 🟡 MOYENNE

**Recommandation:**
Intégrer ClamAV pour scanner les fichiers:
```typescript
import { NodeClam } from 'clamscan';

const scanner = new NodeClam().init();

async function scanFile(filePath: string): Promise<boolean> {
  const { isInfected } = await scanner.scanFile(filePath);
  return !isInfected;
}
```

---

## 🟢 BONNES PRATIQUES À AMÉLIORER

### 19. Headers de Sécurité Manquants

**Criticité:** 🟢 FAIBLE

**Headers à ajouter:**
```typescript
// next.config.ts
{
  key: 'X-Permitted-Cross-Domain-Policies',
  value: 'none'
},
{
  key: 'X-Download-Options',
  value: 'noopen'
},
{
  key: 'Cross-Origin-Embedder-Policy',
  value: 'require-corp'
},
```

---

### 20. Pas de Politique de Rotation des Secrets

**Criticité:** 🟢 FAIBLE

**Recommandation:**
- Rotate `NEXTAUTH_SECRET` tous les 90 jours
- Rotate `QR_SECRET_KEY` tous les 180 jours
- Documenter la procédure

---

### 21. Absence de Tests de Sécurité Automatisés

**Criticité:** 🟢 FAIBLE

**Recommandation:**
```bash
# Ajouter au CI/CD
npm install -D snyk eslint-plugin-security

# .github/workflows/security.yml
- name: Security Scan
  run: |
    npm audit
    snyk test
    npm run test:security
```

---

## 📋 PLAN D'ACTION PRIORITAIRE

### 🔴 Urgent (Cette Semaine)

1. **Mettre à jour les dépendances vulnérables**
   ```bash
   npm update next pdfjs-dist @types/react-pdf
   npm audit fix
   ```

2. **Corriger l'injection SQL potentielle**
   - Remplacer `$queryRaw` par Prisma ORM
   - Fichier: `stats.service.ts`

3. **Sécuriser les uploads de fichiers**
   - Installer `file-type`
   - Ajouter validation magic bytes
   - Implémenter protection path traversal

4. **Supprimer les secrets du repo**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env attestations_backup.sql"
   ```

### 🟠 Important (Ce Mois)

5. **Implémenter le rate limiting**
   - Routes d'authentification
   - Routes sensibles (reset password, etc.)

6. **Améliorer la politique de mots de passe**
   - 12 caractères minimum
   - Complexité requise
   - Liste de mots de passe communs

7. **Ajouter timeout absolu aux sessions**
   - 24h maximum
   - Re-authentification requise

8. **Configurer CORS correctement**
   - Limiter aux domaines autorisés

### 🟡 Recommandé (Ce Trimestre)

9. **Monitoring et logging sécurisé**
   - Logger sécurisé
   - Monitoring des échecs d'auth
   - Alertes sécurité

10. **Tests de sécurité**
    - Tests automatisés
    - Scan de vulnérabilités
    - Intégration CI/CD

---

## 🛠️ OUTILS RECOMMANDÉS

### Scan de Vulnérabilités
```bash
npm install -g snyk
snyk auth
snyk test
snyk monitor
```

### Audit de Code
```bash
npm install -D eslint-plugin-security
npm install -D @typescript-eslint/eslint-plugin
```

### Tests de Pénétration
```bash
# OWASP ZAP
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://scn.mesrit.com
```

---

## 📞 CONTACTS URGENCE

**En cas de violation de sécurité:**
1. Isoler le système
2. Contacter l'équipe IT
3. Documenter l'incident
4. Notifier les utilisateurs si données exposées

---

**Rapport généré le:** 28 Janvier 2026  
**Prochaine revue:** Mars 2026  
**Signature:** Ingénieur Sécurité Senior
