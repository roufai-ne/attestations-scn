# Guide de Déploiement - Attestations Service Civique National

**Plateforme cible :** Ubuntu 22.04/24.04 LTS
**Prérequis :** Docker et Docker Compose installés
**Version :** 2.1.0 | Janvier 2026

---

## Table des matières

1. [Prérequis](#1-prérequis)
2. [Clonage du projet](#2-clonage-du-projet)
3. [Configuration des variables d'environnement](#3-configuration-des-variables-denvironnement)
4. [Configuration SSL](#4-configuration-ssl)
5. [Déploiement](#5-déploiement)
6. [Post-installation](#6-post-installation)
7. [Maintenance](#7-maintenance)
8. [Sauvegardes](#8-sauvegardes)
9. [Dépannage](#9-dépannage)

---

## 1. Prérequis

### 1.1 Vérifier Docker et Docker Compose

```bash
# Vérifier que Docker est installé
docker --version
# Attendu: Docker version 24.x ou supérieur

# Vérifier Docker Compose
docker compose version
# Attendu: Docker Compose version v2.x ou supérieur
```

### 1.2 Configuration serveur recommandée

| Ressource | Minimum | Recommandé |
|-----------|---------|------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 Go | 8 Go |
| Disque | 30 Go SSD | 50 Go SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |

### 1.3 Ports requis

Avec Cloudflare Tunnel, vous n'avez **pas besoin d'ouvrir les ports 80/443** car le tunnel crée une connexion sortante sécurisée.

```bash
# Ouvrir uniquement le port SSH (UFW)
sudo ufw allow 22/tcp    # SSH
sudo ufw enable
sudo ufw status
```

> **Note :** Le port 3000 reste accessible uniquement en local. Cloudflare Tunnel s'y connecte depuis l'intérieur du réseau.

---

## 2. Clonage du projet

### 2.1 Se connecter au serveur

```bash
ssh utilisateur@votre-serveur-ip
```

### 2.2 Créer le répertoire de l'application

```bash
sudo mkdir -p /opt/attestations-scn
sudo chown $USER:$USER /opt/attestations-scn
cd /opt/attestations-scn
```

### 2.3 Cloner le dépôt Git

```bash
git clone https://github.com/votre-organisation/attestations-scn.git .
```

> **Note :** Remplacez l'URL par celle de votre dépôt Git.

### 2.4 Vérifier la structure

```bash
ls -la
# Vous devez voir : Dockerfile, docker-compose.prod.yml, package.json, etc.
```

---

## 3. Configuration des variables d'environnement

### 3.1 Créer le fichier .env

```bash
cp .env.production.example .env
```

### 3.2 Générer les secrets

```bash
# Générer NEXTAUTH_SECRET (obligatoire - 32 caractères min)
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"

# Générer QR_SECRET_KEY (obligatoire - pour la signature des QR codes)
echo "QR_SECRET_KEY=$(openssl rand -hex 32)"

# Générer le mot de passe PostgreSQL
echo "POSTGRES_PASSWORD=$(openssl rand -base64 18 | tr -d '=+/')"

# Générer le mot de passe Redis
echo "REDIS_PASSWORD=$(openssl rand -base64 18 | tr -d '=+/')"
```

### 3.3 Éditer le fichier .env

```bash
nano .env
```

### 3.4 Variables obligatoires à configurer

```env
# ===== APPLICATION =====
NODE_ENV=production
NEXTAUTH_URL=https://attestations.votre-domaine.ne
NEXTAUTH_SECRET=VOTRE_SECRET_GENERE_ICI

# ===== BASE DE DONNÉES =====
DATABASE_URL=postgresql://postgres:VOTRE_MOT_DE_PASSE@db:5432/attestations_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=VOTRE_MOT_DE_PASSE
POSTGRES_DB=attestations_db

# ===== REDIS =====
REDIS_URL=redis://:VOTRE_MOT_DE_PASSE_REDIS@redis:6379
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=VOTRE_MOT_DE_PASSE_REDIS

# ===== SÉCURITÉ QR CODE =====
QR_SECRET_KEY=VOTRE_CLE_SECRETE_HEX_ICI

# ===== HCAPTCHA (Recommandé en production) =====
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=votre_site_key
HCAPTCHA_SECRET_KEY=votre_secret_key
```

### 3.5 Variables optionnelles (notifications)

```env
# ===== EMAIL SMTP =====
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.votre-fournisseur.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@votre-domaine.ne
SMTP_PASS=votre_mot_de_passe_smtp
SMTP_FROM=Service Civique National <noreply@votre-domaine.ne>

# ===== OU EMAIL BREVO =====
# EMAIL_PROVIDER=brevo
# BREVO_API_KEY=votre_api_key
# BREVO_SENDER_EMAIL=noreply@votre-domaine.ne
# BREVO_SENDER_NAME=Service Civique National
```

### 3.6 Sauvegarder et quitter

Appuyez sur `Ctrl+X`, puis `Y`, puis `Entrée`.

---

## 4. Configuration avec Cloudflare Tunnel

Votre réseau utilise Cloudflare Tunnel pour gérer le SSL et l'exposition de l'application. Cela simplifie le déploiement car :
- **Pas besoin de certificats SSL locaux** - Cloudflare gère le SSL
- **Pas besoin d'ouvrir les ports 80/443** - Le tunnel crée une connexion sortante
- **Pas besoin de Nginx** - Cloudflare route directement vers l'application

### 4.1 Vérifier que le tunnel est configuré

Assurez-vous que votre Cloudflare Tunnel est configuré pour pointer vers :

```
http://localhost:3000
```

ou l'IP interne de votre serveur :

```
http://192.168.x.x:3000
```

### 4.2 Configuration dans le dashboard Cloudflare

1. Connectez-vous à [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. Allez dans **Access > Tunnels**
3. Sélectionnez votre tunnel
4. Ajoutez un **Public Hostname** :
   - **Subdomain** : `attestations` (ou selon votre choix)
   - **Domain** : `votre-domaine.ne`
   - **Service Type** : `HTTP`
   - **URL** : `localhost:3000`

### 4.3 Mettre à jour le fichier .env

Assurez-vous que `NEXTAUTH_URL` correspond à l'URL publique via Cloudflare :

```bash
nano .env
```

```env
NEXTAUTH_URL=https://attestations.votre-domaine.ne
```

> **Important :** L'URL doit être en HTTPS car Cloudflare gère le SSL automatiquement.

---

## 5. Déploiement

### 5.1 Construire les images Docker

```bash
docker compose -f docker-compose.prod.yml build --no-cache
```

> **Durée estimée :** 5-10 minutes selon la connexion.

### 5.2 Démarrer les services de base

```bash
# Démarrer PostgreSQL et Redis d'abord
docker compose -f docker-compose.prod.yml up -d db redis

# Attendre que PostgreSQL soit prêt (30 secondes)
echo "Attente du démarrage de PostgreSQL..."
sleep 30

# Vérifier que PostgreSQL est prêt
docker compose -f docker-compose.prod.yml exec db pg_isready -U postgres
```

### 5.3 Exécuter les migrations de base de données

```bash
docker compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy
```

### 5.4 Créer l'utilisateur administrateur initial

```bash
docker compose -f docker-compose.prod.yml run --rm app npx prisma db seed
```

> **Identifiants par défaut créés :**
> - Email : `admin@scn.ne`
> - Mot de passe : `Admin123!`
>
> ⚠️ **Changez ce mot de passe immédiatement après la première connexion !**

### 5.5 Démarrer l'application

```bash
# Démarrer l'application (Cloudflare Tunnel se connecte au port 3000)
docker compose -f docker-compose.prod.yml up -d app
```

> **Note :** Avec Cloudflare Tunnel, vous n'avez pas besoin de Nginx. Le tunnel route directement vers le port 3000.

### 5.6 Vérifier le déploiement

```bash
# Vérifier que tous les conteneurs sont en cours d'exécution
docker compose -f docker-compose.prod.yml ps

# Résultat attendu : tous les services en "Up" ou "running"
```

```bash
# Tester l'API health localement
curl http://localhost:3000/api/health

# Tester via l'URL publique Cloudflare
curl https://attestations.votre-domaine.ne/api/health
```

**Réponse attendue :**
```json
{"status":"ok","timestamp":"...","database":"connected","redis":"connected"}
```

---

## 6. Post-installation

### 6.1 Accéder à l'application

Ouvrez votre navigateur et accédez à :

```
https://attestations.votre-domaine.ne
```

### 6.2 Première connexion

1. Cliquez sur **Connexion**
2. Entrez les identifiants admin :
   - Email : `admin@scn.ne`
   - Mot de passe : `Admin123!`
3. **Changez immédiatement le mot de passe** dans Profil > Sécurité

### 6.3 Configurer hCaptcha (Recommandé)

1. Créez un compte sur [hCaptcha Dashboard](https://dashboard.hcaptcha.com)
2. Créez un nouveau site et obtenez vos clés
3. Ajoutez les clés dans `.env` :
   ```env
   NEXT_PUBLIC_HCAPTCHA_SITE_KEY=votre_site_key
   HCAPTCHA_SECRET_KEY=votre_secret_key
   ```
4. Redémarrez l'application :
   ```bash
   docker compose -f docker-compose.prod.yml restart app
   ```

### 6.4 Configurer les notifications email

1. Allez dans **Administration > Configuration > Notifications**
2. Testez l'envoi d'email avec le bouton "Tester"

---

## 7. Maintenance

### 7.1 Voir les logs en temps réel

```bash
# Tous les services
docker compose -f docker-compose.prod.yml logs -f

# Application uniquement
docker compose -f docker-compose.prod.yml logs -f app

# Base de données
docker compose -f docker-compose.prod.yml logs -f db
```

### 7.2 Mettre à jour l'application

```bash
# 1. Récupérer les dernières modifications
cd /opt/attestations-scn
git pull origin main

# 2. Reconstruire l'image de l'application
docker compose -f docker-compose.prod.yml build --no-cache app

# 3. Appliquer les nouvelles migrations (si nécessaire)
docker compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy

# 4. Redémarrer l'application
docker compose -f docker-compose.prod.yml up -d --no-deps app

# 5. Vérifier
docker compose -f docker-compose.prod.yml ps
curl http://localhost:3000/api/health
```

### 7.3 Redémarrer les services

```bash
# Redémarrer uniquement l'application
docker compose -f docker-compose.prod.yml restart app

# Redémarrer tous les services
docker compose -f docker-compose.prod.yml restart

# Arrêt complet
docker compose -f docker-compose.prod.yml down

# Démarrage complet
docker compose -f docker-compose.prod.yml up -d
```

### 7.4 Nettoyer Docker

```bash
# Supprimer les images inutilisées
docker image prune -f

# Supprimer les conteneurs arrêtés
docker container prune -f

# Nettoyer le système (attention: ne supprime pas les volumes)
docker system prune -f
```

---

## 8. Sauvegardes

### 8.1 Sauvegarde manuelle

```bash
# Créer le dossier de sauvegardes
mkdir -p /opt/attestations-scn/backups

# Sauvegarder la base de données
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U postgres attestations_db | gzip > \
  /opt/attestations-scn/backups/db_$(date +%Y%m%d_%H%M%S).sql.gz

# Sauvegarder les fichiers uploadés
tar -czf /opt/attestations-scn/backups/uploads_$(date +%Y%m%d_%H%M%S).tar.gz \
  -C /var/lib/docker/volumes attestations-scn_uploads_data 2>/dev/null || \
  echo "Volumes non trouvés, vérifiez le chemin"
```

### 8.2 Sauvegarde automatique quotidienne

```bash
# Créer le script de sauvegarde
cat > /opt/attestations-scn/scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/attestations-scn/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Créer le dossier si nécessaire
mkdir -p $BACKUP_DIR

# Sauvegarde PostgreSQL
docker compose -f /opt/attestations-scn/docker-compose.prod.yml exec -T db \
  pg_dump -U postgres attestations_db | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Supprimer les sauvegardes de plus de 30 jours
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "$(date): Sauvegarde terminée - db_$DATE.sql.gz" >> /var/log/attestations-backup.log
EOF

chmod +x /opt/attestations-scn/scripts/backup.sh

# Ajouter au cron (sauvegarde quotidienne à 2h du matin)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/attestations-scn/scripts/backup.sh") | crontab -
```

### 8.3 Restauration

```bash
# Restaurer une sauvegarde
gunzip -c /opt/attestations-scn/backups/db_20260126_020000.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T db \
  psql -U postgres attestations_db
```

---

## 9. Dépannage

### 9.1 L'application ne démarre pas

```bash
# Vérifier les logs
docker compose -f docker-compose.prod.yml logs app

# Vérifier les variables d'environnement
docker compose -f docker-compose.prod.yml exec app env | grep -E "(DATABASE|NEXTAUTH|REDIS)"
```

### 9.2 Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL fonctionne
docker compose -f docker-compose.prod.yml exec db pg_isready -U postgres

# Tester la connexion
docker compose -f docker-compose.prod.yml exec db psql -U postgres -d attestations_db -c "SELECT 1"
```

### 9.3 Redis non connecté

```bash
# Vérifier Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli ping
# Réponse attendue: PONG
```

### 9.4 Problèmes avec Cloudflare Tunnel

```bash
# Vérifier que l'application écoute sur le port 3000
curl http://localhost:3000/api/health

# Vérifier les logs du tunnel (si installé localement via cloudflared)
sudo journalctl -u cloudflared -f

# Vérifier la connectivité depuis Cloudflare
# Allez dans Cloudflare Dashboard > Zero Trust > Tunnels > Votre tunnel > Logs
```

**Problèmes courants :**
- **502 Bad Gateway** : L'application n'est pas démarrée ou ne répond pas sur le port 3000
- **Tunnel offline** : Vérifiez que le service cloudflared est actif sur le serveur

### 9.5 Réinitialiser complètement (⚠️ Perte de données)

```bash
# Arrêter et supprimer tout
docker compose -f docker-compose.prod.yml down -v

# Reconstruire et redémarrer
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d db redis
sleep 30
docker compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy
docker compose -f docker-compose.prod.yml run --rm app npx prisma db seed
docker compose -f docker-compose.prod.yml up -d app
```

---

## Checklist de déploiement

### Avant le déploiement

- [ ] Docker et Docker Compose installés
- [ ] Cloudflare Tunnel configuré et actif
- [ ] Dépôt Git cloné dans `/opt/attestations-scn`

### Configuration

- [ ] Fichier `.env` créé avec tous les secrets
- [ ] `NEXTAUTH_URL` configuré avec l'URL Cloudflare (https://...)
- [ ] `NEXTAUTH_SECRET` généré (32+ caractères)
- [ ] `QR_SECRET_KEY` généré (64 caractères hex)
- [ ] Mots de passe PostgreSQL et Redis configurés
- [ ] Tunnel Cloudflare pointant vers `localhost:3000`

### Déploiement

- [ ] Images Docker construites
- [ ] PostgreSQL et Redis démarrés
- [ ] Migrations Prisma exécutées
- [ ] Seed de la base de données exécuté
- [ ] Application démarrée sur le port 3000
- [ ] Health check local réussi (`curl http://localhost:3000/api/health`)
- [ ] Health check via Cloudflare réussi

### Post-déploiement

- [ ] Connexion admin testée via URL publique
- [ ] Mot de passe admin changé
- [ ] hCaptcha configuré (production)
- [ ] Notifications email testées
- [ ] Sauvegarde automatique configurée

---

**Support :** admin@service-civique.ne
**Documentation :** https://docs.attestations-scn.ne
