# ✅ Checklist de vérification - Système de Notifications

## 🔧 Configuration initiale

### 1. Dépendances installées
- [ ] Vérifier que les packages sont installés :
```bash
cd attestations-scn
npm list nodemailer twilio xlsx bull ioredis
```

### 2. Redis démarré
- [ ] Vérifier que Redis fonctionne :
```bash
redis-cli ping
# Devrait retourner : PONG
```

Si Redis n'est pas installé :
```bash
# Linux/Mac
sudo apt install redis-server  # Ubuntu/Debian
brew install redis             # macOS

# Windows (via Docker)
docker run -d -p 6379:6379 redis:alpine
```

### 3. Variables d'environnement
- [ ] Copier `.env.example` vers `.env` si pas déjà fait
- [ ] Configurer au minimum les variables Redis :
```bash
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
```

---

## 🧪 Tests de base

### 1. Compilation TypeScript
```bash
cd attestations-scn
npm run build
```
- [ ] Aucune erreur de compilation
- [ ] Les imports des services de notifications fonctionnent

### 2. Démarrage de l'application
```bash
npm run dev
```
- [ ] L'application démarre sans erreur
- [ ] Accès à http://localhost:3000

### 3. Accès à la page de configuration
- [ ] Se connecter en tant qu'admin (admin@servicecivique.ne / Admin123!)
- [ ] Naviguer vers `/admin/configuration/notifications`
- [ ] La page se charge correctement

---

## 📧 Configuration Email (SMTP)

### Option 1 : Gmail (pour tests)
```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="votre-email@gmail.com"
SMTP_PASS="votre-mot-de-passe-application"
```

**Note :** Utilisez un "mot de passe d'application" Gmail, pas votre mot de passe normal.

### Option 2 : Mailtrap (pour tests)
```bash
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT="2525"
SMTP_SECURE="false"
SMTP_USER="votre-username-mailtrap"
SMTP_PASS="votre-password-mailtrap"
```

### Test
- [ ] Configurer SMTP via l'interface admin
- [ ] Cliquer sur "Tester la connexion"
- [ ] Devrait afficher "✓ Connexion SMTP réussie"

---

## 📱 Configuration SMS (Twilio)

### Créer un compte Twilio
1. S'inscrire sur https://www.twilio.com/try-twilio
2. Récupérer :
   - Account SID
   - Auth Token
   - Phone Number

### Configuration
```bash
SMS_PROVIDER="twilio"
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

### Test
- [ ] Configurer Twilio via l'interface admin
- [ ] Cliquer sur "Tester la connexion"
- [ ] Devrait afficher "✓ Connexion SMS réussie"

**Note :** Pour les tests, Twilio propose des crédits gratuits.

---

## 💬 Configuration WhatsApp

### Créer WhatsApp Business Cloud API
1. Créer un compte Meta Business : https://business.facebook.com/
2. Configurer WhatsApp Cloud API
3. Récupérer :
   - Phone Number ID
   - Access Token

### Configuration
```bash
WHATSAPP_PHONE_NUMBER_ID="123456789"
WHATSAPP_ACCESS_TOKEN="your-access-token"
```

### Créer les templates
**Important :** Les templates doivent être créés et approuvés dans Meta Business Manager.

Voir `src/lib/notifications/templates.ts` pour les templates à créer.

### Test
- [ ] Configurer WhatsApp via l'interface admin
- [ ] Cliquer sur "Tester la connexion"
- [ ] Devrait afficher "✓ Connexion WhatsApp réussie"

---

## 🧩 Tests d'intégration

### 1. Test d'envoi via l'API

Créer un fichier de test `test-notification.ts` :

```typescript
import { enqueueNotification, TypeNotification } from '@/lib/notifications';
import { CanalNotification } from '@prisma/client';

async function testNotification() {
  // Remplacer par un vrai ID de demande
  const demandeId = 'votre-demande-id';

  const result = await enqueueNotification({
    demandeId,
    type: TypeNotification.CONFIRMATION_DEPOT,
    canaux: [CanalNotification.EMAIL], // Commencer avec Email uniquement
    data: {
      numeroEnregistrement: 'TEST-001',
      nom: 'TEST',
      prenom: 'Utilisateur',
      dateEnregistrement: new Date().toLocaleDateString('fr-FR'),
    },
  });

  console.log('Job ajouté à la queue:', result.id);
}

testNotification().catch(console.error);
```

Exécuter :
```bash
npx ts-node test-notification.ts
```

### 2. Vérifier la queue

```bash
redis-cli
> KEYS bull:notifications:*
> LLEN bull:notifications:wait
> LLEN bull:notifications:completed
```

### 3. Tester depuis l'interface

- [ ] Créer ou sélectionner une demande existante
- [ ] Ajouter le composant `SendNotificationModal` dans la page de détail
- [ ] Cliquer sur "Envoyer une notification"
- [ ] Sélectionner un type et des canaux
- [ ] Envoyer
- [ ] Vérifier l'historique dans `NotificationHistory`

---

## 📊 Vérifications en base de données

### Vérifier les notifications envoyées

```sql
-- Dans Prisma Studio ou psql
SELECT * FROM notifications
ORDER BY "createdAt" DESC
LIMIT 10;
```

- [ ] Les notifications apparaissent avec le bon statut
- [ ] Le canal, destinataire et contenu sont corrects
- [ ] La date d'envoi est renseignée pour les notifications réussies

---

## 🐛 Dépannage

### Erreur : Redis connection refused

**Cause :** Redis n'est pas démarré

**Solution :**
```bash
# Linux/Mac
sudo service redis-server start

# macOS
brew services start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

### Erreur : SMTP connection error

**Cause :** Mauvais paramètres SMTP ou pare-feu

**Solutions :**
1. Vérifier les paramètres (host, port, user, pass)
2. Tester manuellement avec telnet : `telnet smtp.gmail.com 587`
3. Désactiver temporairement le pare-feu/antivirus
4. Utiliser Mailtrap pour les tests

### Erreur : Twilio authentication error

**Cause :** Account SID ou Auth Token incorrect

**Solutions :**
1. Vérifier les credentials sur le dashboard Twilio
2. S'assurer que le compte est actif
3. Vérifier le format du numéro de téléphone (+227...)

### Erreur : WhatsApp template not found

**Cause :** Template non créé ou non approuvé

**Solutions :**
1. Créer les templates dans Meta Business Manager
2. Attendre l'approbation (24-48h)
3. Utiliser uniquement Email et SMS en attendant

### Les notifications ne sont pas envoyées

**Vérifications :**
1. Redis est-il démarré ? `redis-cli ping`
2. La queue est-elle active ? Vérifier les logs de l'application
3. Les workers sont-ils en cours d'exécution ?
4. Vérifier les jobs échoués dans Redis

---

## ✅ Validation finale

- [ ] ✅ Toutes les dépendances sont installées
- [ ] ✅ Redis fonctionne
- [ ] ✅ L'application démarre sans erreur
- [ ] ✅ La page de configuration est accessible
- [ ] ✅ Au moins un canal (Email) est configuré et testé
- [ ] ✅ Une notification test a été envoyée avec succès
- [ ] ✅ L'historique des notifications s'affiche
- [ ] ✅ Les notifications sont enregistrées en base de données

---

## 🎉 Félicitations !

Si toutes les cases sont cochées, le système de notifications est **opérationnel** !

### Prochaines étapes

1. Configurer les comptes SMS et WhatsApp en production
2. Créer et faire approuver les templates WhatsApp
3. Intégrer les composants de notification dans les pages de demandes
4. Tester l'envoi automatique lors du changement de statut d'une demande

---

**Support :** Consulter `src/lib/notifications/README.md` pour plus de détails
