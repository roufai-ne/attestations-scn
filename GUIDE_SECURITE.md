# 🔒 GUIDE DE SÉCURITÉ - Attestations Service Civique National

## Table des matières
1. [Variables d'environnement](#variables-denvironnement)
2. [Déploiement sécurisé](#déploiement-sécurisé)
3. [Checklist de production](#checklist-de-production)
4. [Bonnes pratiques](#bonnes-pratiques)
5. [Gestion des secrets](#gestion-des-secrets)

---

## Variables d'environnement

### ✅ Variables CRITIQUES (obligatoires)

#### NEXTAUTH_SECRET
**Requis** : Oui  
**Description** : Clé secrète pour le chiffrement des sessions et des données sensibles TOTP.  
**Génération** :
```bash
openssl rand -base64 32
```
**Sécurité** :
- ❌ Ne JAMAIS utiliser de valeur par défaut
- ❌ Ne JAMAIS committer cette valeur
- ✅ Minimum 32 caractères
- ✅ Unique par environnement (dev ≠ staging ≠ production)

#### QR_SECRET_KEY
**Requis** : Oui  
**Description** : Clé secrète pour signer les QR codes d'attestation (HMAC-SHA256).  
**Génération** :
```bash
openssl rand -hex 32
```
**Sécurité** :
- ❌ Ne JAMAIS changer en production (invaliderait tous les QR codes)
- ✅ Sauvegarder dans un gestionnaire de secrets
- ✅ Backup sécurisé de cette clé

#### DATABASE_URL
**Requis** : Oui  
**Format** : `postgresql://user:password@host:port/database`  
**Sécurité** :
- ✅ Utiliser un utilisateur dédié avec privilèges limités
- ✅ Mot de passe fort (20+ caractères)
- ✅ Connexion chiffrée (SSL) en production

#### NEXTAUTH_URL
**Requis** : Oui  
**Format** : `https://votre-domaine.com`  
**Sécurité** :
- ✅ **HTTPS obligatoire en production**
- ✅ Certificat SSL valide

---

### 📧 Variables EMAIL (recommandées)

#### SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
**Requis** : Non (mais recommandé pour 2FA par email)  
**Description** : Configuration du serveur SMTP pour l'envoi d'emails.  
**Exemple** :
```env
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_SECURE="true"
SMTP_USER="notifications@example.com"
SMTP_PASS="votre-mot-de-passe-fort"
```

---

### 📱 Variables SMS (optionnelles)

#### Twilio
```env
SMS_PROVIDER="twilio"
TWILIO_ACCOUNT_SID="ACxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxx"
TWILIO_PHONE_NUMBER="+22790123456"
```

#### API Générique
```env
SMS_PROVIDER="generic"
SMS_API_URL="https://api.sms-provider.com/send"
SMS_API_KEY="votre-cle-api"
```

---

### 🔴 Variables REDIS (production)

#### REDIS_URL
**Requis en production** : Oui  
**Description** : Redis pour rate limiting distribué et gestion de sessions.  
**Format** : `redis://[:password]@host:port`  
**Pourquoi obligatoire en production** :
- Rate limiting en mémoire ne fonctionne pas en cluster
- Sessions distribuées entre instances
- Performance optimale

---

## Déploiement sécurisé

### 1. Vérification au démarrage

L'application vérifie automatiquement les variables d'environnement au démarrage :

```typescript
// Dans votre fichier de démarrage
import { checkEnvironmentVariables, checkProductionSecurity } from '@/lib/config/env-check';

// Vérifier les variables requises
checkEnvironmentVariables();

// Vérifier la sécurité en production
if (process.env.NODE_ENV === 'production') {
    checkProductionSecurity();
}
```

### 2. Fichiers à ne JAMAIS committer

```gitignore
.env
.env.local
.env.production
.env.production.local
*.pem
*.key
secrets/
```

### 3. Headers de sécurité HTTP

Les headers suivants sont **automatiquement configurés** (voir [next.config.ts](attestations-scn/next.config.ts)) :

✅ `Strict-Transport-Security` (HSTS)  
✅ `X-Frame-Options` (Protection clickjacking)  
✅ `X-Content-Type-Options` (Protection MIME sniffing)  
✅ `Content-Security-Policy` (Protection XSS)  
✅ `Referrer-Policy`  
✅ `Permissions-Policy`

---

## Checklist de production

### Avant le déploiement

- [ ] **Variables d'environnement**
  - [ ] `NEXTAUTH_SECRET` généré et défini (32+ caractères)
  - [ ] `QR_SECRET_KEY` généré et défini (32+ caractères)
  - [ ] `DATABASE_URL` avec mot de passe fort
  - [ ] `NEXTAUTH_URL` utilise HTTPS
  - [ ] `REDIS_URL` configuré

- [ ] **Sécurité réseau**
  - [ ] Certificat SSL/TLS valide et auto-renouvelable
  - [ ] Pare-feu configuré (ports 80, 443 uniquement)
  - [ ] Base de données accessible uniquement depuis le serveur app
  - [ ] Redis accessible uniquement depuis le serveur app

- [ ] **Base de données**
  - [ ] Utilisateur PostgreSQL dédié avec privilèges minimaux
  - [ ] Backups automatisés configurés
  - [ ] Connexion SSL/TLS activée
  - [ ] Migrations exécutées : `npx prisma migrate deploy`

- [ ] **Application**
  - [ ] `NODE_ENV=production`
  - [ ] Build optimisé : `npm run build`
  - [ ] Tests de sécurité passés
  - [ ] Logs configurés vers système externe (non en console)

- [ ] **Monitoring**
  - [ ] Logs d'audit exportés
  - [ ] Alertes configurées pour tentatives de connexion suspectes
  - [ ] Monitoring des performances
  - [ ] Alertes en cas d'erreurs critiques

### Après le déploiement

- [ ] Tester l'authentification
- [ ] Tester le 2FA (email et TOTP)
- [ ] Vérifier les headers de sécurité : https://securityheaders.com
- [ ] Vérifier SSL : https://www.ssllabs.com/ssltest/
- [ ] Tester les logs d'audit
- [ ] Vérifier le rate limiting

---

## Bonnes pratiques

### 🔐 Gestion des secrets

1. **Utiliser un gestionnaire de secrets**
   - AWS Secrets Manager
   - Azure Key Vault
   - HashiCorp Vault
   - Google Secret Manager

2. **Rotation des secrets**
   - Changer `NEXTAUTH_SECRET` tous les 90 jours
   - ⚠️ NE PAS changer `QR_SECRET_KEY` (invaliderait les QR codes)

3. **Séparation des environnements**
   - Secrets différents pour dev / staging / production
   - Pas de réutilisation entre environnements

### 🔒 Authentification & Autorisation

1. **Politique de mot de passe**
   - Minimum 8 caractères (configurable)
   - Incluant lettres, chiffres
   - Hashage bcrypt (10 rounds)

2. **Verrouillage de compte**
   - 5 tentatives échouées → verrouillage 30 minutes
   - Notification par email (à implémenter)

3. **Double authentification (2FA)**
   - Recommandé pour rôles DIRECTEUR et ADMIN
   - Méthodes : Email OTP et TOTP (Google Authenticator)
   - Codes de backup disponibles

### 🚦 Rate Limiting

**Configuration actuelle** :
- Authentification : 10 requêtes / 15 minutes
- Endpoints publics : 30 requêtes / minute
- Endpoints standard : 100 requêtes / minute
- Génération PDF : 10 requêtes / minute

**⚠️ En production : utiliser Redis** pour le rate limiting distribué.

### 📝 Journalisation

**Ce qui est loggué** :
- Connexions (succès et échecs)
- Activation/désactivation 2FA
- Changements de rôle
- Signature d'attestations
- Validation/rejet de demandes
- Accès aux endpoints admin

**Données capturées** :
- Action effectuée
- User ID
- Demande ID (si applicable)
- Adresse IP
- User-Agent
- Timestamp

---

## Gestion des secrets

### Génération de secrets sécurisés

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# QR_SECRET_KEY
openssl rand -hex 32

# Mot de passe PostgreSQL
openssl rand -base64 24
```

### Script de vérification

Vérifier la configuration avant le démarrage :

```bash
# Test des variables d'environnement
npx tsx src/lib/config/env-check.ts

# Générer des secrets pour le dev
npx tsx src/lib/config/env-check.ts --generate
```

### Exemple .env.production

```env
# Database
DATABASE_URL="postgresql://scn_user:STRONG_PASSWORD@db.example.com:5432/scn_prod?sslmode=require"

# Auth
NEXTAUTH_SECRET="GENERATED_SECRET_32_CHARS_MINIMUM"
NEXTAUTH_URL="https://attestations.example.com"

# QR Code
QR_SECRET_KEY="GENERATED_HEX_SECRET_64_CHARS"

# Email
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_SECURE="true"
SMTP_USER="notifications@example.com"
SMTP_PASS="STRONG_EMAIL_PASSWORD"

# SMS (optionnel)
SMS_PROVIDER="twilio"
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxxxx"
TWILIO_PHONE_NUMBER="+22790123456"

# Redis (obligatoire en production)
REDIS_URL="redis://:REDIS_PASSWORD@redis.example.com:6379"

# Application
NODE_ENV="production"
```

---

## Support et contact

Pour toute question de sécurité :
- 📧 Email : security@example.com
- 📞 Téléphone : +227 XX XX XX XX
- 🔒 Signalement de vulnérabilité : security@example.com (PGP disponible)

---

## Références

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [NextAuth.js Documentation](https://next-auth.js.org/configuration/options)
- [ANSSI - Recommandations de sécurité](https://www.ssi.gouv.fr/)

---

*Document mis à jour le : 23 Janvier 2026*  
*Version : 1.0*
