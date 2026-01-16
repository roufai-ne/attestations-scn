# API Documentation - Attestations Service Civique National

## Vue d'ensemble

Cette documentation couvre l'ensemble des endpoints API de l'application de gestion des attestations.

**Base URL**: `http://localhost:3000/api` (développement) ou `https://votre-domaine.com/api` (production)

**Authentification**: Toutes les routes (sauf `/auth` et `/verify`) nécessitent une session NextAuth valide.

---

## 🔐 Authentification

### POST /api/auth/signin
Connexion utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "mot_de_passe"
}
```

**Réponse (200):**
```json
{
  "user": {
    "id": "cuid...",
    "email": "user@example.com",
    "nom": "Dupont",
    "prenom": "Jean",
    "role": "AGENT"
  }
}
```

### POST /api/auth/signout
Déconnexion utilisateur.

---

## 📋 Demandes

### GET /api/demandes
Liste les demandes avec pagination et filtres.

**Paramètres Query:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| page | number | Numéro de page (défaut: 1) |
| limit | number | Éléments par page (défaut: 20) |
| statut | string | Filtrer par statut |
| search | string | Recherche textuelle |

**Réponse (200):**
```json
{
  "demandes": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### POST /api/demandes
Crée une nouvelle demande.

**Body:**
```json
{
  "nom": "AMADOU",
  "prenom": "Ibrahim",
  "dateNaissance": "1995-03-15",
  "lieuNaissance": "Niamey",
  "sexe": "M",
  "email": "ibrahim@example.com",
  "telephone": "90123456",
  "diplome": "Licence en Informatique",
  "promotion": "2024",
  "dateDebutService": "2024-01-01",
  "dateFinService": "2024-12-31"
}
```

**Réponse (201):**
```json
{
  "id": "cuid...",
  "numeroEnregistrement": "DEM-2024-00001",
  "statut": "ENREGISTREE",
  "dateEnregistrement": "2024-01-15T10:30:00Z"
}
```

### GET /api/demandes/[id]
Récupère les détails d'une demande.

### PUT /api/demandes/[id]
Met à jour une demande.

### DELETE /api/demandes/[id]
Supprime une demande.

### POST /api/demandes/[id]/valider
Valide une demande (change statut vers VALIDEE).

**Body:**
```json
{
  "observations": "Dossier complet",
  "envoyerNotification": true
}
```

### POST /api/demandes/[id]/rejeter
Rejette une demande.

**Body:**
```json
{
  "motif": "Pièces manquantes",
  "envoyerNotification": true
}
```

### POST /api/demandes/[id]/generer-attestation
Génère l'attestation PDF pour une demande validée.

---

## 📄 Attestations

### GET /api/attestations
Liste les attestations.

### GET /api/attestations/[id]
Récupère une attestation.

### GET /api/attestations/[id]/download
Télécharge le PDF d'une attestation.

### GET /api/verify
Vérifie une attestation via QR Code (public).

**Paramètres Query:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| numero | string | Numéro d'attestation |
| signature | string | Signature HMAC |
| timestamp | number | Timestamp de génération |

---

## ✍️ Directeur - Signatures

### GET /api/directeur/stats
Statistiques du tableau de bord directeur.

### GET /api/directeur/attestations
Liste des attestations en attente de signature.

### POST /api/directeur/attestations/[id]/signer
Signe une attestation individuelle.

**Body:**
```json
{
  "pin": "1234"
}
```

### POST /api/directeur/attestations/signer-lot
Signe plusieurs attestations en lot.

**Body:**
```json
{
  "attestationIds": ["id1", "id2", "id3"],
  "pin": "1234"
}
```

### GET /api/directeur/signature/config
Récupère la configuration de signature.

### PUT /api/directeur/signature/config
Met à jour la configuration de signature.

### PUT /api/directeur/signature/pin
Change le PIN du directeur.

**Body:**
```json
{
  "ancienPin": "1234",
  "nouveauPin": "5678",
  "confirmerPin": "5678"
}
```

### GET /api/directeur/signatures/historique
Historique des signatures effectuées.

---

## 📁 Arrêtés

### GET /api/arretes
Liste les arrêtés indexés.

### POST /api/arretes
Upload et indexation d'un nouvel arrêté.

**Content-Type:** `multipart/form-data`

### GET /api/arretes/search
Recherche dans le contenu OCR des arrêtés.

**Paramètres Query:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| q | string | Terme de recherche (min 2 caractères) |
| limit | number | Nombre max de résultats (défaut: 10) |

### POST /api/arretes/[id]/reindex
Relance l'OCR sur un arrêté.

---

## 👥 Administration

### GET /api/admin/users
Liste les utilisateurs.

### POST /api/admin/users
Crée un nouvel utilisateur.

### PUT /api/admin/users/[id]
Met à jour un utilisateur.

### DELETE /api/admin/users/[id]
Désactive un utilisateur.

### GET /api/admin/audit
Journal d'audit des actions.

**Paramètres Query:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| userId | string | Filtrer par utilisateur |
| action | string | Filtrer par action |
| dateDebut | string | Date de début (ISO) |
| dateFin | string | Date de fin (ISO) |
| page | number | Numéro de page |
| limit | number | Éléments par page |
| export | string | 'csv' pour export CSV |

### POST /api/admin/signature/debloquer
Débloquer le PIN d'un directeur.

**Body:**
```json
{
  "userId": "cuid..."
}
```

### POST /api/admin/signature/revoquer
Révoquer la signature d'un directeur.

### POST /api/admin/signature/reactiver
Réactiver la signature d'un directeur.

---

## 📊 Rapports

### GET /api/admin/reports/demandes
Export des demandes (Excel ou PDF).

**Paramètres Query:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| dateDebut | string | Date de début |
| dateFin | string | Date de fin |
| statut | string | Filtrer par statut |
| format | string | 'excel' (défaut) ou 'pdf' |

### GET /api/admin/reports/attestations
Export des attestations.

### GET /api/admin/reports/agents
Rapport d'activité des agents.

---

## 🔔 Notifications

### POST /api/notifications/send
Envoie une notification manuelle.

**Body:**
```json
{
  "demandeId": "cuid...",
  "type": "ATTESTATION_PRETE",
  "canaux": ["EMAIL", "SMS"],
  "messagePersonnalise": "Votre attestation est prête."
}
```

### GET /api/notifications/test
Teste les connexions des canaux de notification.

---

## Codes d'erreur

| Code | Description |
|------|-------------|
| 400 | Requête invalide (données manquantes ou incorrectes) |
| 401 | Non authentifié |
| 403 | Non autorisé (rôle insuffisant) |
| 404 | Ressource non trouvée |
| 409 | Conflit (doublon) |
| 429 | Trop de requêtes (rate limiting) |
| 500 | Erreur serveur |

## Format des erreurs

```json
{
  "error": "Message d'erreur lisible",
  "code": "ERROR_CODE",
  "details": [
    { "field": "email", "message": "Email invalide" }
  ]
}
```
