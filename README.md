# Application de Gestion des Attestations du Service Civique

Application web de gestion des demandes d'attestation du Service Civique National du Niger.

## 📋 Description

Cette application permet de digitaliser et d'optimiser le processus de traitement des demandes d'attestation, depuis l'enregistrement du dossier physique jusqu'à la délivrance de l'attestation signée.

### Fonctionnalités Principales

- ✅ **Gestion des demandes** : Saisie, vérification et suivi des demandes
- 🔍 **Recherche OCR** : Indexation et recherche dans les arrêtés PDF
- 📄 **Génération d'attestations** : Génération automatique avec QR Code
- ✍️ **Signature électronique** : Signature manuelle ou électronique par le directeur
- 📧 **Notifications multi-canal** : Email, SMS et WhatsApp
- 📊 **Tableaux de bord** : Statistiques et rapports pour chaque rôle
- 🔐 **Sécurité** : Authentification, autorisation et audit complet

## 🛠️ Stack Technique

- **Frontend** : Next.js 14 (App Router) + TypeScript
- **Backend** : API Routes Next.js
- **Base de données** : PostgreSQL + Prisma ORM
- **Authentification** : NextAuth.js
- **UI** : Tailwind CSS + Shadcn/ui
- **OCR** : Tesseract.js
- **PDF** : pdf-lib
- **Notifications** : Nodemailer + API SMS + WhatsApp Business
- **Queue** : Bull + Redis

## 🚀 Installation

### Prérequis

- Node.js 18+ (LTS recommandé)
- PostgreSQL 15+
- Redis (pour les queues)
- Git

### Étapes d'installation

1. **Cloner le projet**
```bash
cd attestations-scn
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env et renseigner les valeurs
# Notamment DATABASE_URL et NEXTAUTH_SECRET
```

4. **Générer une clé secrète pour NextAuth**
```bash
# Sous Linux/Mac
openssl rand -base64 32

# Sous Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

5. **Créer la base de données**
```bash
# Créer la base de données PostgreSQL
createdb servicecivique

# Ou via psql
psql -U postgres
CREATE DATABASE servicecivique;
\q
```

6. **Exécuter les migrations Prisma**
```bash
npx prisma generate
npx prisma db push
```

7. **Créer les données de test (seed)**
```bash
npx prisma db seed
```

8. **Lancer le serveur de développement**
```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📁 Structure du Projet

```
attestations-scn/
├── prisma/
│   ├── schema.prisma          # Schéma de base de données
│   └── seed.ts                # Données de test
├── public/                    # Fichiers statiques
├── src/
│   ├── app/                   # Pages et routes (App Router)
│   │   ├── (auth)/           # Pages d'authentification
│   │   ├── (dashboard)/      # Pages protégées
│   │   │   ├── agent/        # Module agent
│   │   │   ├── directeur/    # Module directeur
│   │   │   └── admin/        # Module admin
│   │   ├── api/              # API Routes
│   │   └── verifier/         # Page publique de vérification
│   ├── components/           # Composants React
│   │   ├── auth/            # Composants d'authentification
│   │   ├── agent/           # Composants agent
│   │   ├── directeur/       # Composants directeur
│   │   ├── admin/           # Composants admin
│   │   ├── layout/          # Composants de layout
│   │   └── shared/          # Composants partagés
│   ├── lib/                 # Utilitaires et services
│   │   ├── prisma.ts        # Client Prisma
│   │   ├── auth.ts          # Configuration NextAuth
│   │   ├── password.ts      # Utilitaires mots de passe
│   │   └── validations/     # Schémas Zod
│   ├── hooks/               # Custom React hooks
│   └── types/               # Types TypeScript
├── uploads/                 # Fichiers uploadés (arrêtés, attestations)
├── .env                     # Variables d'environnement (ne pas commiter)
├── .env.example             # Exemple de variables
└── package.json
```

## 👥 Rôles Utilisateurs

### Agent de Traitement
- Créer et modifier des demandes
- Vérifier les pièces du dossier
- Rechercher dans les arrêtés indexés
- Générer des attestations
- Envoyer des notifications

### Directeur
- Consulter toutes les demandes
- Signer les attestations (manuellement ou électroniquement)
- Accéder aux statistiques et tableaux de bord

### Administrateur
- Toutes les permissions agent et directeur
- Gérer les utilisateurs
- Uploader et gérer les arrêtés PDF
- Configurer le système (SMTP, SMS, WhatsApp)
- Accéder aux rapports et au journal d'audit

## 🔐 Comptes de Test

Après avoir exécuté le seed, vous pouvez vous connecter avec :

**Administrateur**
- Email: `admin@servicecivique.ne`
- Mot de passe: `Admin123!`

**Agent**
- Email: `agent@servicecivique.ne`
- Mot de passe: `Agent123!`

**Directeur**
- Email: `directeur@servicecivique.ne`
- Mot de passe: `Directeur123!`

## 📝 Scripts Disponibles

```bash
# Développement
npm run dev              # Lancer le serveur de développement

# Build
npm run build            # Construire pour la production
npm run start            # Lancer en mode production

# Base de données
npx prisma generate      # Générer le client Prisma
npx prisma db push       # Appliquer le schéma à la BDD
npx prisma db seed       # Créer les données de test
npx prisma studio        # Interface graphique pour la BDD

# Linting
npm run lint             # Vérifier le code
```

## 🐳 Déploiement avec Docker

```bash
# Construire l'image
docker-compose build

# Lancer les services
docker-compose up -d

# Voir les logs
docker-compose logs -f app
```

## 📚 Documentation

- [Guide de développement](../Guide_Agent_IA_Developpement.md)
- [PRD - Spécifications produit](../PRD_Attestations_Service_Civique.md)
- [Prompts de développement](../Prompts/)

## 🤝 Contribution

Ce projet est développé pour le Ministère de la Jeunesse et des Sports du Niger.

## 📄 Licence

Usage interne - Ministère de la Jeunesse et des Sports, République du Niger

---

**Développé avec ❤️ pour le Service Civique National du Niger**
