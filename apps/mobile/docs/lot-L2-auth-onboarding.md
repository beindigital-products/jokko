# Lot L2 — Auth + onboarding réel

> **Statut** : tranche password auth + création org livrée. Google OAuth préparé. Apple Convex Auth branché côté code, validation réelle à faire avec credentials/provisioning Apple.
> **Date** : 2026-05-02

## Ce qui est livré

- `ConvexAuthProvider` branché côté Expo avec `expo-secure-store`.
- Routes de boot/auth :
  - `/boot`
  - `/inbox`
  - `/conversations/[id]`
  - `/auth/sign-in`
  - `/auth/sign-up`
  - `/auth/callback`
  - `/invite/[token]`
- Password auth réel via `@convex-dev/auth` :
  - sign in
  - sign up
  - forgot password mobile via `flow: "reset"` puis `flow: "reset-verification"`
  - route `/auth/forgot-password`
  - route `/auth/reset-password`
  - validation locale des règles password backend
  - `users.ensureUser()` après auth
- Google OAuth mobile préparé :
  - `signIn("google")`
  - ouverture `expo-web-browser`
  - retour `jokko://auth/callback`
  - consommation du `code` par Convex Auth
- Apple Sign In :
  - bouton natif iOS
  - provider Auth.js Apple ajouté à Convex Auth
  - ouverture du flux OAuth Apple via `expo-web-browser`
  - retour `jokko://auth/callback`
  - consommation du `code` par Convex Auth pour créer la session
  - le spike S1 `spike_apple.verifyAppleToken` reste disponible pour validation JWT native/debug.
- Onboarding org connecté :
  - `organizations.create`
  - `users.completeOnboarding`
  - persistance `firstLaunchSeen`
  - demande native de permission push via `expo-notifications`
  - sauvegarde des préférences notification dans `notificationPreferences`
  - enregistrement du device Expo Push Token dans `devices` quand Expo fournit un token
  - ouverture de la configuration WhatsApp web via `EXPO_PUBLIC_WEB_APP_URL` / fallback `https://app.jokko.io/dashboard/settings?tab=whatsapp`
- Notifications push backend :
  - helper unique `createNotification`
  - routing par préférences, conversations/canaux mutés et DND
  - envoi Expo Push via action interne planifiée
  - suivi des tentatives dans `pushDeliveryAttempts`
  - désactivation automatique des devices `DeviceNotRegistered`
- Settings privacy :
  - route `/settings`
  - route `/settings/privacy`
  - modification du consentement crash reporting / analytics
  - révocation des choix optionnels sans supprimer la décision locale
- Invitation mobile :
  - route `/invite/[token]`
  - création/connexion password puis `invitations.acceptLink`
- Inbox mobile réelle :
  - liste des conversations Convex par organisation active
  - filtres toutes / non lues / assignées à moi
  - recherche locale contact / numéro / preview
  - fil de messages paginé
  - réponse texte via `messages.send`

## Ce qui reste

- Validation Google OAuth sur device réel avec credentials Google iOS configurés.
- Validation Apple OAuth sur device réel avec `AUTH_APPLE_ID` / `AUTH_APPLE_SECRET` configurés côté Convex et callback Apple autorisé.
- Retour deep link Meta WhatsApp complet après connexion web.

## Prérequis runtime

- Le reset password utilise le provider Email de Convex Auth et `sendPasswordResetEmail`.
- Les variables AWS SES existantes doivent être configurées en environnement Convex pour envoyer les e-mails.
- Apple OAuth requiert `AUTH_APPLE_ID` et `AUTH_APPLE_SECRET` dans l'environnement Convex, avec callback HTTPS Apple pointant vers `/api/auth/callback/apple`.

## Vérification

Commandes passantes au moment de livraison :

```bash
pnpm --filter @jokko/mobile typecheck
pnpm --filter @jokko/mobile lint
pnpx convex typecheck
pnpm exec vitest run apps/mobile/src/lib/first-launch.test.ts apps/mobile/src/lib/mobile-onboarding.test.ts packages/i18n/src/index.test.ts
pnpm exec vitest run
pnpm -r typecheck
pnpm --filter @jokko/mobile exec expo export --platform ios --output-dir ../../.context/l2-ios-export --clear
```

Résultat :

- Suite Vitest complète : 32 fichiers, 292 tests passants.
- Typecheck Convex : OK.
- Typecheck workspace : OK.
- Lint mobile : OK.
- Export iOS : OK, bundle Hermes 5.74 MB.
