# Guide de Déploiement Docker - Attestations SCN
**Version:** 2.0.0  
**Date:** 22 janvier 2026

---

## 📋 Prérequis

### Logiciels requis
- Docker Engine 20.10+
- Docker Compose 2.0+
- Git
- OpenSSL (pour génération secrets)

### Configuration serveur minimale
- **Développement:** 2 CPU, 4GB RAM, 20GB disque
- **Production:** 4 CPU, 8GB RAM, 50GB disque

---

## 🔐 Étape 1: Génération des Secrets

### 1.1 NEXTAUTH_SECRET (Obligatoire)

Générez un secret fort de 32+ caractères :

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)

# Ou en ligne
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Exemple de sortie:**
```
Kj8mP2xQwE7vR5tY9nU3bC6dF1gH4iJ0
```

### 1.2 QR_SECRET_KEY (Recommandé)

Même processus que NEXTAUTH_SECRET :

```bash
openssl rand -base64 32
```

### 1.3 Mots de passe Base de données

**Production uniquement** - Générez un mot de passe fort :

```bash
# Mot de passe aléatoire 24 caractères
openssl rand -base64 18

# Ou avec symboles
openssl rand -base64 32 | tr -d "=+/" | cut -c1-24
```

### 1.4 Mot de passe Redis (Optionnel mais recommandé)

```bash
openssl rand -base64 18
```

---

## ⚙️ Étape 2: Configuration

### 2.1 Créer le fichier .env

```bash
# Copier le template
cp .env.production.example .env

# Éditer le fichier
nano .env  # ou vim, code, etc.
```

### 2.2 Variables essentielles

Remplissez au minimum ces variables :

```env
# Application
NODE_ENV=production
NEXTAUTH_URL=https://attestations.votre-domaine.ne
NEXTAUTH_SECRET=<votre_secret_généré>

# Base de données
DATABASE_URL=postgresql://postgres:<mot_de_passe>@db:5432/attestations_db
POSTGRES_PASSWORD=<mot_de_passe_fort>

# Redis
REDIS_URL=redis://:mot_de_passe@redis:6379
REDIS_PASSWORD=<mot_de_passe_redis>

# Email SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@votre-domaine.ne
SMTP_PASS=<mot_de_passe_smtp>

# QR Code
QR_SECRET_KEY=<votre_secret_généré>
```

### 2.3 Variables optionnelles

```env
# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+242XXXXXXXXX

# WhatsApp Business
WHATSAPP_PHONE_NUMBER_ID=xxxxxxxxxxxxx
WHATSAPP_ACCESS_TOKEN=xxxxxxxxxxxxx
```

---

## 🔒 Étape 3: Configuration SSL (Production)

### Option A: Certificats auto-signés (développement/test)

```bash
cd nginx/ssl

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout privkey.pem \
  -out fullchain.pem \
  -subj "/C=NE/ST=Niamey/L=Niamey/O=SCN/CN=attestations.local"
```

### Option B: Let's Encrypt (production)

#### 1. Installer Certbot

```bash
# Ubuntu/Debian
sudo apt install certbot

# CentOS/RHEL
sudo yum install certbot
```

#### 2. Obtenir le certificat

```bash
# Méthode standalone (arrêter nginx d'abord)
sudo certbot certonly --standalone \
  -d attestations.votre-domaine.ne \
  --email admin@votre-domaine.ne \
  --agree-tos

# Ou méthode webroot (nginx en cours)
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d attestations.votre-domaine.ne \
  --email admin@votre-domaine.ne
```

#### 3. Copier les certificats

```bash
sudo cp /etc/letsencrypt/live/attestations.votre-domaine.ne/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/attestations.votre-domaine.ne/privkey.pem nginx/ssl/
sudo chown $USER:$USER nginx/ssl/*.pem
```

#### 4. Auto-renouvellement

```bash
# Ajouter au crontab
sudo crontab -e

# Ajouter cette ligne (renouvellement tous les lundis à 3h)
0 3 * * 1 certbot renew --quiet && cp /etc/letsencrypt/live/*/fullchain.pem /path/to/nginx/ssl/ && cp /etc/letsencrypt/live/*/privkey.pem /path/to/nginx/ssl/ && docker compose -f /path/to/docker-compose.prod.yml restart nginx
```

---

## 🚀 Étape 4: Déploiement

### 4.1 Build des images

```bash
# Production
docker compose -f docker-compose.prod.yml build --no-cache

# Ou utiliser le script
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 4.2 Démarrage

#### Sans Nginx (accès direct port 3000)

```bash
docker compose -f docker-compose.prod.yml up -d
```

#### Avec Nginx (ports 80/443)

```bash
docker compose -f docker-compose.prod.yml --profile with-nginx up -d
```

### 4.3 Vérification

```bash
# Statut des conteneurs
docker compose -f docker-compose.prod.yml ps

# Logs de l'application
docker compose -f docker-compose.prod.yml logs -f app

# Health check
curl http://localhost:3000/api/health
# ou
curl https://attestations.votre-domaine.ne/api/health
```

**Réponse attendue:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-22T10:30:00.000Z",
  "database": "connected",
  "redis": "connected"
}
```

---

## 🔄 Étape 5: Migrations & Seed

### 5.1 Migrations automatiques

Les migrations Prisma sont appliquées automatiquement au démarrage via `docker-entrypoint.sh`.

Pour vérifier :

```bash
docker compose -f docker-compose.prod.yml logs app | grep "migrations"
```

### 5.2 Seed manuel (première installation)

```bash
# Créer le compte admin initial
docker compose -f docker-compose.prod.yml exec app npx prisma db seed
```

### 5.3 Rollback d'une migration (si nécessaire)

```bash
# Lister les migrations
docker compose -f docker-compose.prod.yml exec app npx prisma migrate status

# Rollback (attention: perte de données)
docker compose -f docker-compose.prod.yml exec app npx prisma migrate resolve --rolled-back <migration_name>
```

---

## 📦 Étape 6: Sauvegarde & Restauration

### 6.1 Backup automatique

```bash
# Créer un cron job
crontab -e

# Ajouter (backup quotidien à 2h)
0 2 * * * /path/to/scripts/backup.sh
```

### 6.2 Backup manuel

```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

**Les backups sont stockés dans:** `./backups/attestations_YYYYMMDD_HHMMSS.sql.gz`

### 6.3 Restauration

```bash
chmod +x scripts/restore.sh
./scripts/restore.sh backups/attestations_20260122_020000.sql.gz
```

---

## 🔍 Étape 7: Monitoring & Logs

### 7.1 Logs en temps réel

```bash
# Tous les services
docker compose -f docker-compose.prod.yml logs -f

# Application uniquement
docker compose -f docker-compose.prod.yml logs -f app

# Base de données
docker compose -f docker-compose.prod.yml logs -f db

# Redis
docker compose -f docker-compose.prod.yml logs -f redis
```

### 7.2 Statistiques des conteneurs

```bash
# Utilisation CPU/RAM
docker stats

# Espace disque
docker system df
```

### 7.3 Health checks

```bash
# Application
curl http://localhost:3000/api/health

# PostgreSQL
docker compose -f docker-compose.prod.yml exec db pg_isready -U postgres

# Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli ping
```

---

## 🛠️ Étape 8: Maintenance

### 8.1 Mise à jour de l'application

```bash
# 1. Pull des nouvelles modifications
git pull origin main

# 2. Rebuild
docker compose -f docker-compose.prod.yml build --no-cache

# 3. Redémarrage avec zero-downtime
docker compose -f docker-compose.prod.yml up -d --no-deps --build app

# 4. Vérification
curl http://localhost:3000/api/health
```

### 8.2 Nettoyage Docker

```bash
# Images inutilisées
docker image prune -f

# Volumes orphelins (ATTENTION: vérifie avant)
docker volume ls -qf dangling=true
docker volume prune -f

# Système complet (ATTENTION: supprime tout ce qui n'est pas utilisé)
docker system prune -a --volumes
```

### 8.3 Redémarrage des services

```bash
# Redémarrer l'application
docker compose -f docker-compose.prod.yml restart app

# Redémarrer tous les services
docker compose -f docker-compose.prod.yml restart

# Arrêt complet
docker compose -f docker-compose.prod.yml down

# Redémarrage complet
docker compose -f docker-compose.prod.yml up -d
```

---

## 🔧 Dépannage

### Problème: L'application ne démarre pas

```bash
# Vérifier les logs
docker compose -f docker-compose.prod.yml logs app

# Vérifier les variables d'environnement
docker compose -f docker-compose.prod.yml exec app env | grep DATABASE_URL
```

### Problème: Erreur de connexion base de données

```bash
# Tester la connexion
docker compose -f docker-compose.prod.yml exec db psql -U postgres -d attestations_db -c "SELECT 1"

# Vérifier DATABASE_URL
echo $DATABASE_URL
```

### Problème: Redis non connecté

```bash
# Tester Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli ping

# Vérifier REDIS_URL
docker compose -f docker-compose.prod.yml exec app env | grep REDIS
```

### Problème: Certificats SSL invalides

```bash
# Vérifier les certificats
openssl x509 -in nginx/ssl/fullchain.pem -text -noout

# Vérifier l'expiration
openssl x509 -in nginx/ssl/fullchain.pem -noout -enddate
```

### Problème: Migrations échouent

```bash
# Forcer la génération du client Prisma
docker compose -f docker-compose.prod.yml exec app npx prisma generate

# Réappliquer les migrations
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Reset complet (ATTENTION: perte de données)
docker compose -f docker-compose.prod.yml exec app npx prisma migrate reset --force
```

---

## ✅ Checklist de Déploiement

### Avant le déploiement

- [ ] `.env` créé et rempli avec tous les secrets
- [ ] `NEXTAUTH_SECRET` généré (32+ caractères)
- [ ] `QR_SECRET_KEY` généré (32+ caractères)
- [ ] Mots de passe PostgreSQL et Redis forts
- [ ] Configuration SMTP testée
- [ ] Certificats SSL en place (production)
- [ ] DNS configuré pointant vers le serveur
- [ ] Firewall ouvert (ports 80, 443, 22)

### Après le déploiement

- [ ] Health check réussit (`/api/health`)
- [ ] Login admin fonctionne
- [ ] Upload de fichiers fonctionne
- [ ] Envoi d'emails fonctionne
- [ ] Signature d'attestations fonctionne
- [ ] 2FA Email/TOTP fonctionne
- [ ] Backup automatique configuré
- [ ] Monitoring des logs en place
- [ ] SSL actif et valide

---

## 📚 Ressources Supplémentaires

- **Documentation Next.js:** https://nextjs.org/docs
- **Documentation Prisma:** https://www.prisma.io/docs
- **Documentation Docker:** https://docs.docker.com
- **Let's Encrypt:** https://letsencrypt.org/getting-started

---

**Support:** admin@service-civique.ne  
**Repository:** https://github.com/votre-org/attestations-scn
