# Guide de Configuration Brevo

## Vue d'ensemble

Brevo (anciennement Sendinblue) est une plateforme de marketing et communication tout-en-un qui permet d'envoyer des emails et SMS transactionnels de manière fiable et sécurisée.

### Pourquoi Brevo ?

✅ **Avantages**
- Emails transactionnels fiables avec haute délivrabilité
- SMS optionnels (payants) via le même service
- Interface d'administration complète
- Statistiques détaillées (ouvertures, clics, etc.)
- SMTP relay inclus
- Plan gratuit : 300 emails/jour

❌ **Inconvénients**
- Nécessite un compte Brevo
- SMS payants (coûts variables selon pays)

## Étape 1 : Créer un compte Brevo

1. Rendez-vous sur [https://www.brevo.com](https://www.brevo.com)
2. Cliquez sur "S'inscrire gratuitement"
3. Remplissez le formulaire avec vos informations
4. Validez votre email

## Étape 2 : Obtenir votre clé API

1. Connectez-vous à [https://app.brevo.com](https://app.brevo.com)
2. Allez dans **Paramètres** (icône engrenage en haut à droite)
3. Cliquez sur **Clés API**
4. Cliquez sur **Créer une nouvelle clé API**
5. Donnez un nom à votre clé (ex: "Service Civique Production")
6. Copiez la clé générée (vous ne pourrez plus la voir après)

⚠️ **Important** : Ne partagez jamais votre clé API publiquement !

## Étape 3 : Configurer l'expéditeur

### Vérifier votre domaine d'envoi

1. Dans Brevo, allez dans **Expéditeurs, Domaines & IPs** > **Domaines**
2. Cliquez sur **Ajouter un domaine**
3. Entrez votre domaine (ex: `servicecivique.ne`)
4. Suivez les instructions pour ajouter les enregistrements DNS :
   - **SPF** : Enregistrement TXT pour autoriser Brevo
   - **DKIM** : Clé de signature pour authentifier vos emails
   - **DMARC** : Politique de sécurité (recommandé)

### Ajouter un expéditeur

1. Allez dans **Expéditeurs, Domaines & IPs** > **Expéditeurs**
2. Cliquez sur **Ajouter un expéditeur**
3. Renseignez :
   - **Email** : `noreply@servicecivique.ne`
   - **Nom** : `Service Civique National`
4. Validez l'email de confirmation

## Étape 4 : Configuration du projet

### Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Email Provider
EMAIL_PROVIDER="brevo"

# Brevo Configuration
BREVO_API_KEY="xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxx"
BREVO_SENDER_EMAIL="noreply@servicecivique.ne"
BREVO_SENDER_NAME="Service Civique National"

# SMS Brevo (optionnel)
BREVO_SMS_ENABLED="false"
```

### Activer les SMS (optionnel)

Les SMS Brevo sont **payants** et nécessitent l'achat de crédits SMS.

1. Dans Brevo, allez dans **SMS** > **Acheter des crédits SMS**
2. Choisissez votre forfait selon vos besoins
3. Une fois les crédits achetés, activez les SMS dans votre `.env` :

```env
BREVO_SMS_ENABLED="true"
```

**Tarifs SMS indicatifs** (à vérifier sur Brevo) :
- Niger : ~0,05-0,08 € par SMS
- France : ~0,045 € par SMS

## Étape 5 : Tester la configuration

### Test depuis le code

```typescript
import { brevoService } from '@/lib/notifications/brevo.service';

// Test email
const result = await brevoService.sendEmail({
  to: 'test@example.com',
  subject: 'Test Brevo',
  html: '<p>Ceci est un email de test</p>',
  text: 'Ceci est un email de test',
});

console.log('Email envoyé:', result);

// Test SMS (si activé)
if (brevoService.isSmsEnabled()) {
  const smsResult = await brevoService.sendSms({
    to: '+227XXXXXXXX',
    message: 'Test SMS depuis Service Civique',
    sender: 'SCN-Niger',
  });
  console.log('SMS envoyé:', smsResult);
}

// Vérifier les informations du compte
const accountInfo = await brevoService.getAccountInfo();
console.log('Compte Brevo:', accountInfo);
```

### Test via l'interface Brevo

1. Allez dans **Transactionnel** > **Modèles**
2. Créez un modèle de test
3. Envoyez un email de test

## Utilisation dans l'application

### Service unifié (recommandé)

Le service unifié détecte automatiquement le provider configuré :

```typescript
import { unifiedEmailService } from '@/lib/notifications/unified-email.service';

// Envoi email simple
await unifiedEmailService.sendEmail({
  to: 'user@example.com',
  subject: 'Confirmation',
  html: '<p>Votre demande est confirmée</p>',
});

// Envoi avec SMS optionnel (uniquement si Brevo + SMS activé)
await unifiedEmailService.sendConfirmationDepot(
  'user@example.com',
  {
    numeroEnregistrement: 'SCN-2026-001',
    nom: 'Diallo',
    prenom: 'Amadou',
    dateEnregistrement: '23/01/2026',
  },
  {
    sendSms: true,
    phone: '+227XXXXXXXX',
  }
);
```

### Service Brevo direct

Pour utiliser des fonctionnalités spécifiques à Brevo :

```typescript
import { brevoService } from '@/lib/notifications/brevo.service';

// Email avec paramètres avancés
await brevoService.sendEmail({
  to: 'user@example.com',
  subject: 'Attestation prête',
  html: templateHtml,
  from: {
    email: 'attestations@servicecivique.ne',
    name: 'Service Attestations',
  },
});

// SMS avec expéditeur personnalisé
await brevoService.sendSms({
  to: '+227XXXXXXXX',
  message: 'Votre attestation est prête !',
  sender: 'SCN-Att', // Max 11 caractères
});
```

## Format des numéros de téléphone (SMS)

Les numéros doivent être au format **E.164** :
- ✅ Correct : `+227XXXXXXXX` (Niger)
- ✅ Correct : `+33612345678` (France)
- ❌ Incorrect : `0612345678`
- ❌ Incorrect : `227XXXXXXXX`

## Statistiques et monitoring

### Via l'interface Brevo

1. **Emails** : Allez dans **Statistiques** > **Emails transactionnels**
   - Taux d'ouverture
   - Taux de clics
   - Bounces (rebonds)
   - Spam reports

2. **SMS** : Allez dans **SMS** > **Statistiques**
   - Messages envoyés
   - Crédits restants
   - Taux de délivrance

### Via l'API (dans le code)

```typescript
const accountInfo = await brevoService.getAccountInfo();
console.log('Email restants aujourd\'hui:', accountInfo.plan);
console.log('Crédits SMS:', accountInfo.smsCredits);
```

## Limites et quotas

### Plan Gratuit
- **300 emails/jour**
- Pas de SMS inclus
- Logo Brevo dans les emails

### Plans Payants
- À partir de 25€/mois
- Emails illimités
- Suppression du logo Brevo
- Support prioritaire
- SMS payants en supplément

Pour le Service Civique National, le plan gratuit devrait suffire initialement. Si vous dépassez 300 emails/jour, envisagez un upgrade.

## Sécurité et bonnes pratiques

### Protection de la clé API

✅ **À faire**
- Stocker la clé dans `.env` uniquement
- Ne jamais commiter `.env` dans Git
- Utiliser des clés différentes pour dev/staging/prod
- Révoquer immédiatement une clé compromise

❌ **À ne pas faire**
- Exposer la clé côté client (frontend)
- Partager la clé par email ou chat
- Utiliser la même clé pour tous les environnements

### Rotation des clés

1. Créez une nouvelle clé API dans Brevo
2. Testez-la en staging
3. Mettez à jour la production
4. Supprimez l'ancienne clé

## Dépannage

### Email non reçu

1. **Vérifiez les logs** : Consultez l'onglet **Logs** dans Brevo
2. **Spam** : Demandez au destinataire de vérifier ses spams
3. **Domaine vérifié** : Assurez-vous que votre domaine est vérifié (SPF/DKIM)
4. **Expéditeur validé** : L'email expéditeur doit être vérifié

### SMS non envoyé

1. **Crédits** : Vérifiez qu'il vous reste des crédits SMS
2. **Format** : Le numéro doit être en format E.164 (+227...)
3. **Pays autorisé** : Certains pays peuvent être bloqués
4. **Logs** : Consultez les logs SMS dans Brevo

### Erreur "API Key invalide"

1. Vérifiez que vous avez copié toute la clé (très longue)
2. Assurez-vous qu'il n'y a pas d'espace avant/après
3. Vérifiez que la clé n'a pas été révoquée dans Brevo
4. Créez une nouvelle clé si nécessaire

### Limite quotidienne atteinte

```
Error: Daily limit exceeded
```

**Solutions** :
1. Attendez minuit (UTC) pour réinitialisation
2. Upgradez vers un plan payant
3. Implémentez une queue pour étaler les envois

## Support

### Documentation officielle
- [Brevo Developers](https://developers.brevo.com/)
- [API Reference](https://developers.brevo.com/reference)
- [Guide SMS](https://help.brevo.com/hc/fr/articles/360000946299)

### Contact Brevo
- Email : support@brevo.com
- Chat : Depuis l'interface Brevo (coin inférieur droit)
- Téléphone : Support disponible pour plans payants

## Alternative : Continuer avec SMTP

Si vous ne souhaitez pas utiliser Brevo, vous pouvez rester sur SMTP :

```env
EMAIL_PROVIDER="smtp"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="votre-email@gmail.com"
SMTP_PASS="votre-mot-de-passe-application"
```

L'application basculera automatiquement sur le service SMTP.
