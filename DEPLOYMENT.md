# Guide de Déploiement Docker - Attestations Service Civique National

## Table des matières

1. [Prérequis](#prérequis)
2. [Architecture](#architecture)
3. [Configuration](#configuration)
4. [Déploiement](#déploiement)
5. [SSL/TLS](#ssltls)
6. [Maintenance](#maintenance)
7. [Sauvegardes](#sauvegardes)
8. [Monitoring](#monitoring)
9. [Dépannage](#dépannage)

---

## Prérequis

### Serveur

- **OS**: Ubuntu 22.04 LTS ou Debian 12 (recommandé)
- **RAM**: Minimum 4 Go (8 Go recommandé)
- **CPU**: 2 vCPU minimum
- **Disque**: 50 Go SSD minimum
- **Réseau**: IP publique avec ports 80 et 443 ouverts

### Logiciels

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installation de Docker Compose
sudo apt install docker-compose-plugin -y

# Vérification
docker --version
docker compose version
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                    ┌─────▼─────┐
                    │   Nginx   │ (Port 80/443)
                    │  (Proxy)  │
                    └─────┬─────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
    │  Next.js │     │ PostgreSQL│    │  Redis  │
    │  (App)   │     │   (DB)    │    │ (Cache) │
    │ :3000    │     │  :5432    │    │ :6379   │
    └──────────┘     └───────────┘    └─────────┘
```

---

## Configuration

### 1. Cloner le projet

```bash
cd /opt
sudo git clone <url-du-repo> attestations-scn
cd attestations-scn
```

### 2. Configurer les variables d'environnement

```bash
# Copier le fichier d'exemple
cp .env.production.example .env

# Éditer le fichier
nano .env
```

### Variables obligatoires

```env
# Application
NODE_ENV=production
NEXTAUTH_URL=https://votre-domaine.ne
NEXTAUTH_SECRET=<générer avec: openssl rand -base64 32>

# Base de données
DATABASE_URL=postgresql://postgres:VOTRE_MOT_DE_PASSE_FORT@db:5432/attestations_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=VOTRE_MOT_DE_PASSE_FORT
POSTGRES_DB=attestations_db

# Redis
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=VOTRE_MOT_DE_PASSE_REDIS

# QR Code (sécurité)
QR_SECRET_KEY=<générer avec: openssl rand -hex 32>

# hCaptcha (anti-bot)
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=votre_site_key
HCAPTCHA_SECRET_KEY=votre_secret_key
```

### Variables optionnelles (notifications)

```env
# Email SMTP
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@example.com
SMTP_PASS=votre_mot_de_passe

# OU Brevo (anciennement Sendinblue)
EMAIL_PROVIDER=brevo
BREVO_API_KEY=votre_api_key
BREVO_SENDER_EMAIL=noreply@example.com
BREVO_SENDER_NAME=Attestations SCN

# SMS Twilio
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=votre_account_sid
TWILIO_AUTH_TOKEN=votre_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# WhatsApp Business
WHATSAPP_PHONE_NUMBER_ID=votre_phone_number_id
WHATSAPP_ACCESS_TOKEN=votre_access_token
```

### 3. Configurer Nginx

```bash
# Éditer la configuration Nginx
nano nginx/nginx.conf
```

Remplacer `your-domain.ne` par votre domaine réel (ligne 73).

---

## Déploiement

### Première installation

```bash
# 1. Construire l'image Docker
docker compose -f docker-compose.prod.yml build

# 2. Démarrer les services (PostgreSQL et Redis d'abord)
docker compose -f docker-compose.prod.yml up -d db redis

# 3. Attendre que PostgreSQL soit prêt (30 secondes)
sleep 30

# 4. Exécuter les migrations Prisma
docker compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy

# 5. Créer l'utilisateur admin initial
docker compose -f docker-compose.prod.yml run --rm app npx prisma db seed

# 6. Démarrer l'application
docker compose -f docker-compose.prod.yml up -d app

# 7. Vérifier le statut
docker compose -f docker-compose.prod.yml ps
```

### Avec Nginx (recommandé pour production)

```bash
# Démarrer avec le profil nginx
docker compose -f docker-compose.prod.yml --profile with-nginx up -d
```

### Vérifier les logs

```bash
# Tous les services
docker compose -f docker-compose.prod.yml logs -f

# Application uniquement
docker compose -f docker-compose.prod.yml logs -f app

# Base de données
docker compose -f docker-compose.prod.yml logs -f db
```

---

## SSL/TLS

### Option 1: Let's Encrypt avec Certbot

```bash
# Installer Certbot
sudo apt install certbot -y

# Obtenir un certificat (arrêter nginx temporairement)
docker compose -f docker-compose.prod.yml stop nginx
sudo certbot certonly --standalone -d votre-domaine.ne

# Copier les certificats
sudo cp /etc/letsencrypt/live/votre-domaine.ne/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/votre-domaine.ne/privkey.pem nginx/ssl/
sudo chown -R 1000:1000 nginx/ssl/

# Redémarrer nginx
docker compose -f docker-compose.prod.yml --profile with-nginx up -d nginx
```

### Renouvellement automatique

```bash
# Créer un script de renouvellement
cat > /etc/cron.d/certbot-renew << 'EOF'
0 3 * * * root certbot renew --quiet --deploy-hook "docker exec attestations-nginx nginx -s reload"
EOF
```

### Option 2: Certificat auto-signé (dev/test)

```bash
# Générer un certificat auto-signé
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/CN=votre-domaine.ne"
```

---

## Maintenance

### Mise à jour de l'application

```bash
# 1. Récupérer les dernières modifications
cd /opt/attestations-scn
git pull origin main

# 2. Reconstruire l'image
docker compose -f docker-compose.prod.yml build app

# 3. Redémarrer sans interruption
docker compose -f docker-compose.prod.yml up -d --no-deps app

# 4. Appliquer les migrations si nécessaires
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

### Arrêt complet

```bash
docker compose -f docker-compose.prod.yml down
```

### Redémarrage complet

```bash
docker compose -f docker-compose.prod.yml restart
```

### Nettoyage Docker

```bash
# Supprimer les images non utilisées
docker image prune -a

# Supprimer les volumes orphelins (ATTENTION: perte de données)
docker volume prune

# Nettoyage complet
docker system prune -a --volumes
```

---

## Sauvegardes

### Sauvegarde manuelle de PostgreSQL

```bash
# Créer une sauvegarde
docker compose -f docker-compose.prod.yml exec db pg_dump -U postgres attestations_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Compresser
gzip backup_*.sql
```

### Script de sauvegarde automatique

```bash
# Créer le script
cat > /opt/attestations-scn/scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/attestations-scn/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Sauvegarde PostgreSQL
docker compose -f /opt/attestations-scn/docker-compose.prod.yml exec -T db \
  pg_dump -U postgres attestations_db | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Sauvegarde des fichiers uploadés
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" \
  -C /var/lib/docker/volumes attestations-scn_uploads_data

# Supprimer les sauvegardes de plus de 30 jours
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Sauvegarde terminée: $DATE"
EOF

chmod +x /opt/attestations-scn/scripts/backup.sh

# Ajouter au cron (tous les jours à 2h)
echo "0 2 * * * /opt/attestations-scn/scripts/backup.sh >> /var/log/backup.log 2>&1" | sudo crontab -
```

### Restauration

```bash
# Restaurer PostgreSQL
gunzip -c backup_20240101_020000.sql.gz | docker compose -f docker-compose.prod.yml exec -T db psql -U postgres attestations_db

# Restaurer les fichiers
tar -xzf uploads_20240101_020000.tar.gz -C /var/lib/docker/volumes/
```

---

## Monitoring

### Vérifier la santé des services

```bash
# Statut des conteneurs
docker compose -f docker-compose.prod.yml ps

# Santé de l'application
curl -s http://localhost:3000/api/health | jq

# Utilisation des ressources
docker stats
```

### Logs centralisés

```bash
# Voir les logs en temps réel
docker compose -f docker-compose.prod.yml logs -f --tail=100

# Exporter les logs
docker compose -f docker-compose.prod.yml logs > logs_$(date +%Y%m%d).txt
```

### Alertes simples (exemple avec healthcheck)

```bash
# Script de monitoring
cat > /opt/attestations-scn/scripts/healthcheck.sh << 'EOF'
#!/bin/bash
HEALTH_URL="http://localhost:3000/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ "$RESPONSE" != "200" ]; then
    echo "ALERTE: Application non disponible (HTTP $RESPONSE)" | mail -s "Attestations SCN DOWN" admin@example.com
fi
EOF

chmod +x /opt/attestations-scn/scripts/healthcheck.sh

# Ajouter au cron (toutes les 5 minutes)
echo "*/5 * * * * /opt/attestations-scn/scripts/healthcheck.sh" | sudo crontab -
```

---

## Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs
docker compose -f docker-compose.prod.yml logs app

# Vérifier les variables d'environnement
docker compose -f docker-compose.prod.yml exec app env | grep -E "(DATABASE|NEXTAUTH|REDIS)"

# Vérifier la connexion à PostgreSQL
docker compose -f docker-compose.prod.yml exec app npx prisma db push --dry-run
```

### Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL est en cours d'exécution
docker compose -f docker-compose.prod.yml ps db

# Tester la connexion
docker compose -f docker-compose.prod.yml exec db psql -U postgres -c "SELECT 1"

# Vérifier les logs PostgreSQL
docker compose -f docker-compose.prod.yml logs db
```

### Problèmes de performance

```bash
# Vérifier l'utilisation des ressources
docker stats

# Augmenter les limites (dans docker-compose.prod.yml)
# deploy:
#   resources:
#     limits:
#       cpus: '2.0'
#       memory: 2048M

# Vérifier les connexions Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli info clients
```

### Réinitialisation complète (ATTENTION: perte de données)

```bash
# Arrêter tous les services
docker compose -f docker-compose.prod.yml down

# Supprimer les volumes
docker volume rm attestations-scn_postgres_data attestations-scn_redis_data attestations-scn_uploads_data

# Recréer tout
docker compose -f docker-compose.prod.yml up -d
```

---

## Commandes utiles

```bash
# Accéder au shell de l'application
docker compose -f docker-compose.prod.yml exec app sh

# Accéder à PostgreSQL
docker compose -f docker-compose.prod.yml exec db psql -U postgres attestations_db

# Accéder à Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli

# Exécuter une migration Prisma
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Réinitialiser le seed (ATTENTION: efface les données)
docker compose -f docker-compose.prod.yml exec app npx prisma db seed

# Voir l'espace disque utilisé par Docker
docker system df -v
```

---

## Checklist de production

- [ ] Variables d'environnement configurées (NEXTAUTH_SECRET, DATABASE_URL, QR_SECRET_KEY)
- [ ] Certificat SSL installé et valide
- [ ] hCaptcha configuré
- [ ] Sauvegardes automatiques configurées
- [ ] Monitoring mis en place
- [ ] Firewall configuré (ports 80, 443 uniquement)
- [ ] Mots de passe forts pour PostgreSQL et Redis
- [ ] Domaine DNS configuré
- [ ] Logs accessibles
- [ ] Utilisateur admin créé et testé

---

## Support

En cas de problème :

1. Consulter les logs : `docker compose -f docker-compose.prod.yml logs`
2. Vérifier la santé : `curl http://localhost:3000/api/health`
3. Redémarrer les services : `docker compose -f docker-compose.prod.yml restart`

---

*Document généré le 24/01/2026 - Version 1.0*
