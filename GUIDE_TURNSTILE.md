# 🔐 Configuration hCaptcha

## Vue d'ensemble

hCaptcha a été intégré pour protéger la page de connexion contre les attaques par force brute et les bots malveillants. hCaptcha est une alternative respectueuse de la vie privée qui permet de monétiser votre trafic tout en protégeant votre application.

## 🚀 Mise en place

### 1. Créer un compte hCaptcha

1. Créez un compte sur [hCaptcha Dashboard](https://dashboard.hcaptcha.com/signup)
2. Confirmez votre email
3. Connectez-vous au dashboard

### 2. Ajouter un site

1. Allez dans **Sites** dans le menu latéral
2. Cliquez sur **New Site**
3. Configurez votre site :
   - **Hostname**: Votre domaine (ex: `attestations.example.com`)
   - **Difficulty**: Normal (recommandé)
   - Cochez **Pass on a percentage of users** (optionnel, améliore l'UX)

### 3. Récupérer les clés

Après création, vous obtiendrez :
- **Site Key** (publique) : À utiliser côté client
- **Secret Key** (privée) : À utiliser côté serveur uniquement

### 4. Configurer les variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` (développement) ou `.env.production` (production) :

```env
# hCaptcha
NEXT_PUBLIC_HCAPTCHA_SITE_KEY="10000000-ffff-ffff-ffff-000000000001"
HCAPTCHA_SECRET_KEY="0x0000000000000000000000000000000000000000"
```

⚠️ **Important** : 
- La clé publique commence par `NEXT_PUBLIC_` pour être accessible côté client
- La clé secrète ne doit JAMAIS être exposée côté client
- NE JAMAIS committer ces clés dans Git

### 5. Clés de test

Pour le développement, hCaptcha fournit des clés de test qui valident toujours :

```env
# CLÉS DE TEST - Toujours valides (pour développement uniquement)
NEXT_PUBLIC_HCAPTCHA_SITE_KEY="10000000-ffff-ffff-ffff-000000000001"
HCAPTCHA_SECRET_KEY="0x0000000000000000000000000000000000000000"

# Ces clés montrent le widget mais valident toujours la réponse
```

## 📋 Fonctionnement

### Côté Client

Le composant `HCaptchaWidget` est intégré dans le formulaire de login :

```tsx
<HCaptchaWidget
    onSuccess={(token) => setHCaptchaToken(token)}
    onError={() => console.error('CAPTCHA failed')}
    onExpire={() => setHCaptchaToken(null)}
/>
```

**Comportement** :
- Le widget s'affiche automatiquement au chargement de la page
- L'utilisateur résout le challenge (sélection d'images)
- Le token est valide pendant 2 minutes
- Le widget peut être configuré en mode invisible

### Côté Serveur

La vérification se fait dans `auth.config.ts` :

```typescript
const hcaptchaResult = await verifyHCaptchaToken(hcaptchaToken);
if (!hcaptchaResult.success) {
    return null; // Connexion refusée
}
```

**Sécurité** :
- Le token est vérifié auprès de l'API hCaptcha
- Chaque token ne peut être utilisé qu'une seule fois
- L'IP du client est envoyée pour validation (optionnel)
- En production, la vérification CAPTCHA est obligatoire

## 🧪 Mode Développement

En développement, si les clés hCaptcha ne sont pas configurées :

- Un message d'avertissement s'affiche
- Un bouton "Bypass pour dev" permet de continuer sans CAPTCHA
- Le token `dev-bypass-token` est accepté côté serveur

**⚠️ Ce bypass est automatiquement désactivé en production**

## 🔒 Sécurité

### Bonnes pratiques

1. **Rotation des clés**
   - Changez les clés si elles sont compromises
   - Utilisez des clés différentes par environnement (dev/staging/prod)

2. **Monitoring**
   - Surveillez les statistiques dans le dashboard hCaptcha
   - Vérifiez le taux de réussite et les tentatives suspectes
   - hCaptcha fournit des analytics détaillés

3. **Logs**
   - Les échecs de vérification sont loggués : `[AUTH] Vérification CAPTCHA échouée`
   - Activez les logs d'audit pour tracer les tentatives suspectes

### Protection contre

✅ Attaques par force brute  
✅ Credential stuffing  
✅ Bots automatisés  
✅ Scripts malveillants  
✅ Fermes de clics  
✅ Web scraping

### Avantages de hCaptcha

✅ **Respect de la vie privée** : Pas de tracking Google
✅ **Monétisation** : Gagnez de l'argent pour chaque challenge résolu
✅ **Accessibilité** : Support des lecteurs d'écran
✅ **RGPD compliant** : Conforme aux règlements européens
✅ **Open source** : Code client disponible

## 📊 Configuration avancée

### Personnalisation du widget

Dans `HCaptchaWidget.tsx`, vous pouvez ajuster :

```typescript
<HCaptcha
    sitekey={siteKey}
    size="normal"        // 'normal' | 'compact' | 'invisible'
    theme="light"        // 'light' | 'dark'
    tabindex={0}         // Ordre de tabulation
    languageOverride="fr" // Code langue
    reCaptchaCompat={false} // Compat reCAPTCHA
/>
```

### Modes du widget

- **Normal** (recommandé) : Widget visible standard
- **Compact** : Version plus petite du widget
- **Invisible** : Challenge uniquement si suspect

### Difficulté du challenge

Dans le dashboard hCaptcha, vous pouvez ajuster :
- **Easy** : Challenges simples, UX optimale
- **Moderate** : Équilibre sécurité/UX
- **Difficult** : Maximum de sécurité
- **Always on** : Challenge systématique

### Rate Limiting

Turnstile s'intègre avec votre rate limiting existant :

```typescript
// Rate limiting sur /api/auth déjà configuré
RATE_LIMITS.auth = { windowMs: 15 * 60 * 1000, max: 10 }
```

Le CAPTCHA ajoute une couche supplémentaire de protection.

## 🐛 Dépannage

### Le widget ne s'affiche pas

1. Vérifiez que `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` est défini
2. Vérifiez la console navigateur pour les erreurs
3. Assurez-vous que le domaine est autorisé dans hCaptcha Dashboard
4. Vérifiez que le package `@hcaptcha/react-hcaptcha` est installé

### Erreur "invalid-input-response"

- Le token a expiré (2 minutes max)
- Le token a déjà été utilisé
- Le token est invalide

**Solution** : Le widget se réinitialise automatiquement après une erreur

### Erreur "sitekey-secret-mismatch"

La site key et la secret key ne correspondent pas (clés de sites différents).

**Solution** : Vérifiez que les deux clés proviennent du même site

### Challenge trop difficile

Si les utilisateurs se plaignent de la difficulté :

1. Allez dans le dashboard hCaptcha
2. Sélectionnez votre site
3. Ajustez le niveau de difficulté vers "Easy" ou "Moderate"
4. Activez "Passive mode" pour certains utilisateurs

## 📚 Documentation

- [hCaptcha Documentation](https://docs.hcaptcha.com/)
- [React hCaptcha Component](https://github.com/hCaptcha/react-hcaptcha)
- [Server-side Verification](https://docs.hcaptcha.com/#verify-the-user-response-server-side)
- [Dashboard hCaptcha](https://dashboard.hcaptcha.com/)
- [Privacy Policy](https://www.hcaptcha.com/privacy)

## ✅ Checklist de déploiement

Avant de déployer en production :

- [ ] Créer un compte hCaptcha
- [ ] Ajouter votre site dans le dashboard
- [ ] Configurer le domaine de production
- [ ] Copier les clés de production dans `.env.production`
- [ ] Tester la connexion avec CAPTCHA actif
- [ ] Vérifier les logs de vérification
- [ ] Ajuster la difficulté du challenge si nécessaire
- [ ] Configurer les alertes dans hCaptcha
- [ ] Ne PAS utiliser les clés de test en production
- [ ] Vérifier l'accessibilité (lecteurs d'écran)

## 🎯 Impact

**Avant hCaptcha** :
- Protection : Verrouillage compte après 5 tentatives
- Faiblesse : Bots pouvaient tester 5 mots de passe par compte

**Après hCaptcha** :
- Protection : CAPTCHA + verrouillage compte
- Force : Bots bloqués dès la première tentative
- Bonus : Monétisation possible via hCaptcha Rewards
- Privacy : Respect RGPD, pas de tracking Google

---

*Configuration créée le : 23 Janvier 2026*  
*Version : 1.0 - Migration vers hCaptcha*
- Protection : CAPTCHA + verrouillage compte
- Force : Bots bloqués dès la première tentative
- Bonus : Monétisation possible via hCaptcha Rewards
- Privacy : Respect RGPD, pas de tracking Google

---

*Configuration créée le : 23 Janvier 2026*  
*Version : 1.0*
