# 🚀 Guide de Déploiement Docker

## Configuration Pré-Déploiement

### 1. Copier le fichier d'environnement

```bash
cp .env.production.example .env
```

### 2. Configurer les variables d'environnement

Éditez le fichier `.env` et configurez :

```bash
# Base de données
DATABASE_URL=postgresql://user:password@db:5432/attestations_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=votre_mot_de_passe_securise
POSTGRES_DB=attestations_db

# Application
NEXTAUTH_URL=https://votre-domaine.ne
NEXTAUTH_SECRET=votre_secret_nextauth_64_caracteres_minimum

# Redis
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=

# Sécurité
QR_SECRET_KEY=votre_cle_32_caracteres_min

# Notifications (optionnel)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

## Déploiement

### Option 1: Script automatique (Recommandé)

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows:**
```powershell
.\deploy.ps1
```

### Option 2: Commandes manuelles

```bash
# 1. Arrêter les conteneurs existants
docker-compose -f docker-compose.prod.yml down

# 2. Construire l'image
docker-compose -f docker-compose.prod.yml build --no-cache

# 3. Démarrer les services
docker-compose -f docker-compose.prod.yml up -d

# 4. Vérifier l'état
docker-compose -f docker-compose.prod.yml ps
```

## Commandes Utiles

### Voir les logs
```bash
# Tous les services
docker-compose -f docker-compose.prod.yml logs -f

# Application uniquement
docker-compose -f docker-compose.prod.yml logs -f app

# Base de données
docker-compose -f docker-compose.prod.yml logs -f db
```

### Redémarrer un service
```bash
docker-compose -f docker-compose.prod.yml restart app
```

### Arrêter tous les services
```bash
docker-compose -f docker-compose.prod.yml down
```

### Nettoyer complètement (⚠️ Supprime les données)
```bash
docker-compose -f docker-compose.prod.yml down -v
```

## Mise à Jour

Après avoir récupéré les dernières modifications du code :

```bash
# 1. Reconstruire l'image
docker-compose -f docker-compose.prod.yml build --no-cache app

# 2. Redémarrer le conteneur
docker-compose -f docker-compose.prod.yml up -d app
```

## Sauvegarde

### Base de données
```bash
# Créer une sauvegarde
docker exec attestations-db pg_dump -U postgres attestations_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurer une sauvegarde
docker exec -i attestations-db psql -U postgres attestations_db < backup.sql
```

### Fichiers uploadés
```bash
# Les volumes Docker persistent automatiquement les données
# Localisation: /var/lib/docker/volumes/

# Sauvegarder les uploads
docker run --rm -v attestations-scn_public_uploads:/data -v $(pwd):/backup ubuntu tar czf /backup/uploads_backup.tar.gz /data
```

## Résolution de Problèmes

### L'application ne démarre pas
```bash
# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs app

# Vérifier l'état des services
docker-compose -f docker-compose.prod.yml ps
```

### Erreur de connexion à la base de données
```bash
# Vérifier que PostgreSQL est démarré
docker-compose -f docker-compose.prod.yml ps db

# Vérifier les logs de la base de données
docker-compose -f docker-compose.prod.yml logs db
```

### Fichiers uploadés non accessibles
```bash
# Vérifier les volumes
docker volume ls | grep attestations

# Inspecter un volume
docker volume inspect attestations-scn_public_uploads
```

## Performances

Les ressources allouées sont configurées dans `docker-compose.prod.yml` :

- **App**: 1 CPU, 1GB RAM (max)
- **PostgreSQL**: 0.5 CPU, 512MB RAM (max)
- **Redis**: 0.25 CPU, 256MB RAM (max)

Ajustez selon vos besoins en modifiant les sections `deploy.resources`.

## Sécurité

- ✅ Les mots de passe sont dans `.env` (non versionné)
- ✅ Les communications inter-conteneurs sont isolées sur un réseau privé
- ✅ Seuls les ports nécessaires sont exposés
- ✅ Les conteneurs s'exécutent avec un utilisateur non-root
- ✅ Les volumes sont persistés en dehors des conteneurs

## Support

Pour plus d'informations, consultez :
- [GUIDE_DEPLOIEMENT_DOCKER.md](./GUIDE_DEPLOIEMENT_DOCKER.md)
- [GUIDE_SECURITE.md](./GUIDE_SECURITE.md)
