# 📧 Système de Notifications Multi-Canal

Ce module gère l'envoi de notifications via **Email**, **SMS** et **WhatsApp** pour l'application de gestion des attestations du Service Civique.

## 📋 Table des matières

- [Architecture](#architecture)
- [Services disponibles](#services-disponibles)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Templates](#templates)
- [Queue asynchrone](#queue-asynchrone)
- [Tests](#tests)

---

## 🏗 Architecture

Le système de notifications est composé de :

1. **Services individuels** : Email, SMS, WhatsApp
2. **Service unifié** : Orchestre l'envoi sur plusieurs canaux
3. **Queue asynchrone** : Traitement en arrière-plan avec retry automatique
4. **Templates** : Messages pré-configurés pour chaque type de notification
5. **Interface admin** : Configuration des paramètres via l'UI

```
src/lib/notifications/
├── email.service.ts          # Service SMTP (Nodemailer)
├── sms.service.ts            # Service SMS (Twilio ou API générique)
├── whatsapp.service.ts       # Service WhatsApp Business Cloud API
├── notification.service.ts   # Service unifié
├── notification.queue.ts     # Queue Bull + Redis
├── templates.ts              # Templates de messages
└── index.ts                  # Point d'entrée
```

---

## 🛠 Services disponibles

### 1. EmailService

Envoi d'emails via SMTP avec Nodemailer.

**Méthodes :**
- `sendEmail(options)` - Envoi générique
- `sendConfirmationDepot(to, data)` - Confirmation de dépôt
- `sendDemandeRejetee(to, data)` - Demande rejetée
- `sendAttestationPrete(to, data)` - Attestation prête
- `testConnection()` - Test de la connexion SMTP

### 2. SmsService

Envoi de SMS via Twilio ou API générique.

**Providers supportés :**
- **Twilio** : Solution internationale
- **Generic API** : Pour fournisseurs locaux au Niger

**Méthodes :**
- `sendSms(options)` - Envoi générique
- `sendConfirmationDepot(to, data)` - SMS de confirmation
- `sendDemandeRejetee(to, data)` - SMS de rejet
- `sendAttestationPrete(to, data)` - SMS d'attestation prête
- `testConnection()` - Test de la connexion

### 3. WhatsAppService

Envoi de messages WhatsApp via l'API Cloud de Meta.

**Important :** Les templates doivent être créés et approuvés dans Meta Business Manager.

**Méthodes :**
- `sendTemplate(options)` - Envoi avec template
- `sendText(to, message)` - Envoi texte simple (tests uniquement)
- `sendConfirmationDepot(to, data)` - WhatsApp de confirmation
- `sendDemandeRejetee(to, data)` - WhatsApp de rejet
- `sendAttestationPrete(to, data)` - WhatsApp d'attestation prête
- `testConnection()` - Test de la connexion

### 4. NotificationService (Service unifié)

Orchestre l'envoi sur plusieurs canaux simultanément.

**Méthode principale :**
```typescript
await notificationService.send({
  demandeId: 'xxx',
  type: TypeNotification.ATTESTATION_PRETE,
  canaux: [CanalNotification.EMAIL, CanalNotification.SMS],
  data: {
    numeroEnregistrement: 'REG-001',
    numeroAttestation: 'ATT-2024-00001',
    nom: 'ABDOU',
    prenom: 'Ibrahim',
  },
});
```

---

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env` avec les paramètres suivants :

```bash
# Email (SMTP)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="user@example.com"
SMTP_PASS="password"

# SMS
SMS_PROVIDER="twilio"  # ou "generic"

# Twilio
TWILIO_ACCOUNT_SID="ACxxxxxxxx"
TWILIO_AUTH_TOKEN="your-token"
TWILIO_PHONE_NUMBER="+1234567890"

# API SMS Générique
SMS_API_URL="https://api.example.com/sms"
SMS_API_KEY="your-api-key"

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID="123456789"
WHATSAPP_ACCESS_TOKEN="your-access-token"

# Redis (pour la queue)
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
```

### Configuration via l'interface admin

Accédez à `/admin/configuration/notifications` pour configurer graphiquement :
- Paramètres SMTP
- Provider SMS (Twilio ou API générique)
- WhatsApp Business Cloud API
- Tester chaque canal

---

## 🚀 Utilisation

### Envoi simple via le service unifié

```typescript
import { notificationService, TypeNotification } from '@/lib/notifications';
import { CanalNotification } from '@prisma/client';

await notificationService.send({
  demandeId: 'demande-id',
  type: TypeNotification.CONFIRMATION_DEPOT,
  canaux: [CanalNotification.EMAIL, CanalNotification.SMS],
  data: {
    numeroEnregistrement: 'REG-001',
    nom: 'ABDOU',
    prenom: 'Ibrahim',
    dateEnregistrement: '15/01/2024',
  },
});
```

### Envoi via la queue (recommandé)

```typescript
import { enqueueNotification, TypeNotification } from '@/lib/notifications';
import { CanalNotification } from '@prisma/client';

// Envoi asynchrone avec retry automatique
await enqueueNotification({
  demandeId: 'demande-id',
  type: TypeNotification.ATTESTATION_PRETE,
  canaux: [CanalNotification.EMAIL, CanalNotification.SMS, CanalNotification.WHATSAPP],
  data: {
    numeroEnregistrement: 'REG-001',
    numeroAttestation: 'ATT-2024-00001',
    nom: 'ABDOU',
    prenom: 'Ibrahim',
  },
});
```

### Envoi immédiat (haute priorité)

```typescript
import { sendNotificationNow } from '@/lib/notifications';

await sendNotificationNow({
  // ... même structure
});
```

### Envoi programmé

```typescript
import { scheduleNotification } from '@/lib/notifications';

// Envoyer dans 1 heure
const delayMs = 60 * 60 * 1000;
await scheduleNotification({ /* ... */ }, delayMs);
```

---

## 📝 Templates

### Types de notifications disponibles

```typescript
enum TypeNotification {
  CONFIRMATION_DEPOT = 'CONFIRMATION_DEPOT',
  DEMANDE_EN_TRAITEMENT = 'DEMANDE_EN_TRAITEMENT',
  PIECES_NON_CONFORMES = 'PIECES_NON_CONFORMES',
  DEMANDE_REJETEE = 'DEMANDE_REJETEE',
  ATTESTATION_PRETE = 'ATTESTATION_PRETE',
  MESSAGE_PERSONNALISE = 'MESSAGE_PERSONNALISE',
}
```

### Templates Email

Les emails sont en HTML avec design responsive et en-tête institutionnel.

### Templates SMS

Messages courts (< 160 caractères) optimisés pour le coût.

### Templates WhatsApp

**IMPORTANT :** Les templates WhatsApp doivent être créés dans Meta Business Manager.

Voir le fichier [templates.ts](./templates.ts) pour les instructions détaillées de création des templates WhatsApp.

---

## 🔄 Queue asynchrone

Le système utilise **Bull** et **Redis** pour la gestion des notifications asynchrones.

### Avantages

- ✅ Traitement en arrière-plan (non bloquant)
- ✅ Retry automatique en cas d'échec (3 tentatives)
- ✅ Délai exponentiel entre les tentatives
- ✅ Historique des jobs (100 derniers succès, 500 derniers échecs)
- ✅ Gestion des priorités

### Statistiques de la queue

```typescript
import { getQueueStats } from '@/lib/notifications';

const stats = await getQueueStats();
console.log(stats);
// { waiting: 5, active: 2, completed: 100, failed: 3, delayed: 0 }
```

### Réessayer les jobs échoués

```typescript
import { retryFailedJob, retryAllFailedJobs } from '@/lib/notifications';

// Réessayer un job spécifique
await retryFailedJob('job-id');

// Réessayer tous les jobs échoués
await retryAllFailedJobs();
```

---

## 🧪 Tests

### Tester la connexion Email

```typescript
import { emailService } from '@/lib/notifications';

const success = await emailService.testConnection();
console.log(success ? 'OK' : 'Échec');
```

### Tester la connexion SMS

```typescript
import { smsService } from '@/lib/notifications';

const success = await smsService.testConnection();
console.log(success ? 'OK' : 'Échec');
```

### Tester la connexion WhatsApp

```typescript
import { whatsappService } from '@/lib/notifications';

const success = await whatsappService.testConnection();
console.log(success ? 'OK' : 'Échec');
```

### Tester tous les canaux

```typescript
import { notificationService } from '@/lib/notifications';

const results = await notificationService.testAllChannels();
console.log(results);
// { email: true, sms: true, whatsapp: false }
```

---

## 📊 Historique des notifications

Toutes les notifications sont enregistrées dans la base de données.

```typescript
import { notificationService } from '@/lib/notifications';

const historique = await notificationService.getHistorique('demande-id');
// Retourne un tableau de notifications avec statut et date d'envoi
```

---

## 🔐 Sécurité

- ✅ Vérification des permissions (Agent ou Admin uniquement)
- ✅ Les mots de passe SMTP/SMS/WhatsApp sont stockés de manière sécurisée
- ✅ Rate limiting sur les endpoints d'envoi (à implémenter)
- ✅ Logs de toutes les notifications envoyées

---

## 🐛 Dépannage

### Problème de connexion SMTP

1. Vérifier les paramètres (host, port, user, pass)
2. Tester avec `telnet smtp.example.com 587`
3. Vérifier les règles de pare-feu

### Problème de connexion SMS

1. Vérifier les credentials Twilio
2. Vérifier que le numéro est au format international
3. Consulter les logs Twilio

### Problème de connexion WhatsApp

1. Vérifier le Phone Number ID et Access Token
2. S'assurer que les templates sont approuvés
3. Vérifier les permissions de l'Access Token

### Redis non disponible

1. Vérifier que Redis est démarré : `redis-cli ping`
2. Vérifier la configuration dans `.env`
3. Installer Redis : `sudo apt install redis-server` (Linux)

---

## 📚 Ressources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Twilio SMS Documentation](https://www.twilio.com/docs/sms)
- [WhatsApp Business Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/)
- [Bull Queue Documentation](https://github.com/OptimalBits/bull)

---

**Développé pour le Service Civique National du Niger** 🇳🇪
