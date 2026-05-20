# Lot L1 — Bootstrap & design system

> **Statut** : base livrée, auth/backend réel non branchés.
> **Date** : 2026-05-01

## Ce qui est livré

- Entrée mobile migrée vers Expo Router (`apps/mobile/index.ts` -> `expo-router/entry`).
- Routes natives :
  - `/onboarding`
  - `/inbox-empty`
  - `/spikes`
  - `/spikes/glass-reply`
  - `/spikes/inbox-breathing`
  - `/spikes/compose-morph`
  - `/spikes/apple-signin`
  - `/spikes/voice-waveform`
- Root providers dans `apps/mobile/app/_layout.tsx` :
  - `GestureHandlerRootView`
  - `SafeAreaProvider`
  - `KeyboardAvoidingView`
  - i18n
  - Convex provider optionnel via `EXPO_PUBLIC_CONVEX_URL`
  - consentement RGPD runtime
- Nouveau package `@jokko/i18n` :
  - catalogues FR/EN
  - sélection de locale
  - helpers `translate`, `getMessage`, `toI18nextResources`
- Nouveau package `@jokko/ui-mobile` :
  - primitives `ScreenSurface`, `PrimaryAction`, `SecondaryAction`, `EmptyState`, `ConsentModal`
- Nouveau package `@jokko/convex-client` :
  - validation URL Convex
  - séquence `switchOrg()`
  - purge cache par préfixe `jokko.<orgId>.`
  - préservation des clés globales `jokko.global.*`
  - mutex anti-switch concurrent
- Consentement RGPD :
  - modal first launch
  - crash reporting activé par défaut
  - analytics produit désactivés par défaut
  - persistance dans `expo-secure-store` sous `jokko.global.privacyConsent.v1`
- Lint i18n ciblé :
  - règle locale `jokko/no-ui-literal-string`
  - active sur `apps/mobile/app/**/*.tsx` et `src/PrivacyConsentGate.tsx`

## Ce qui reste hors L1

- Auth réelle mobile (Password + Google + Apple) : L2.
- Création organisation Convex depuis l'onboarding : L2.
- Demande native push et token Expo/APNs : L2/L6.
- Deep link Meta WhatsApp réel : L2.
- Settings pour modifier/révoquer les choix RGPD : L2 quand l'écran Settings existe.
- Installation effective Sentry/PostHog : à faire avec le branchement observabilité, en gardant la config S6.
- i18n complet des anciens composants de spike : non requis, ils restent des POC dev.

## Vérification

Commandes passantes au moment de livraison :

```bash
pnpm exec vitest run packages/i18n/src/index.test.ts packages/convex-client/src/multitenant.test.ts apps/mobile/src/lib/privacy-consent.test.ts apps/mobile/src/lib/no-console-pii-rule.test.ts apps/mobile/src/lib/multitenant.test.ts
pnpm --filter @jokko/i18n typecheck
pnpm --filter @jokko/convex-client typecheck
pnpm --filter @jokko/ui-mobile typecheck
pnpm --filter @jokko/mobile typecheck
pnpm --filter @jokko/mobile lint
pnpm exec vitest run
pnpm -r typecheck
pnpm --filter @jokko/mobile exec expo export --platform ios --output-dir ../../.context/l1-ios-export --clear
```

Résultat :

- Suite Vitest complète : 30 fichiers, 283 tests passants.
- Typecheck workspace : OK.
- Lint mobile : OK.
- Export iOS Expo Router : OK, bundle Hermes 5.41 MB.
