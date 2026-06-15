# ADR-0001 — No IDFA, no cross-app tracking

- **Statut** : Accepté
- **Date** : 2026-04-30
- **Source décisionnelle** : Decision #4 (Constraint Guardian, multi-agent review) + Decision #52 (`architecture.md §17.3`)
- **Spike** : S3 — ATT/IDFA decision (`apps/mobile/docs/spike-S2-S3-privacy-att.md`)

## Contexte

L'app mobile Jokko (B2B WhatsApp Business) doit respecter :
- **App Tracking Transparency (ATT)** d'Apple (iOS 14.5+) : si l'app track les utilisateurs **à travers d'autres apps ou sites web** ou utilise l'**IDFA**, elle doit afficher un prompt ATT à l'utilisateur et obtenir son consentement.
- **App Store Privacy Manifest** (mai 2024) : `NSPrivacyTracking` doit refléter la réalité (true/false), `NSPrivacyTrackingDomains` doit lister les domaines de tracking.
- **RGPD** (UE) : tout traitement de données personnelles non strictement nécessaire requiert consentement.

Les SDKs candidats pour Jokko mobile :
- **Sentry** (crash reporting + performance) : par défaut, n'utilise pas IDFA, ne fait pas de cross-app tracking. ✅ Compatible "no tracking".
- **PostHog** (product analytics) : par défaut, génère un anonymous distinct ID. **Peut** activer IDFA si configuré explicitement (`enableIdfa: true`). ✅ Compatible "no tracking" si on configure `disableIdfa: true`.
- **Convex** (backend) : pas de tracking côté client, juste des websocket calls authentifiés. ✅ Compatible.
- **Pas d'AdMob, pas de Facebook SDK, pas de Google Analytics, pas de tag managers tiers**.

## Décision

**Jokko mobile v1.0 ne fait AUCUN cross-app tracking et n'utilise PAS l'IDFA.**

Concrètement :
1. **`NSPrivacyTracking: false`** dans `apps/mobile/app.json` `ios.privacyManifests`.
2. **`NSPrivacyTrackingDomains: []`** (vide).
3. **Pas de prompt ATT** affiché à l'utilisateur (non requis si `NSPrivacyTracking: false`).
4. **PostHog** configuré avec `disableIdfa: true` (ou équivalent — voir code en §Configuration).
5. **Sentry** configuré sans IDFA (par défaut, mais à vérifier au moment de l'install).
6. Pour chaque event analytics envoyé, **`distinct_id` = userId Convex** (pas un identifiant device persistant).
7. Aucun pixel de tracking publicitaire, aucun retargeting, aucune attribution payante côté client.

## Conséquences positives

- ✅ Pas de prompt ATT intrusif au premier lancement → meilleure UX onboarding (Decision #2 du User Advocate sur le time-to-first-message).
- ✅ Privacy Manifest simple à maintenir (pas de domaines de tracking à mettre à jour).
- ✅ Conformité RGPD facilitée (pas de traitement marketing croisé).
- ✅ Conformité CNIL : analytics PostHog reste "non strictement nécessaire" → consent runtime obligatoire (Decision #56) mais **pas d'ATT en plus**.
- ✅ Risque rejet App Store sur 4.5.4 (privacy/tracking) : minimisé.
- ✅ Si demain on ajoute Stripe in-app purchase : pas de tracking publicitaire requis non plus.

## Conséquences négatives / contraintes acceptées

- ❌ Pas de mesure d'attribution publicitaire (campagnes Apple Search Ads, Meta Ads, Google Ads). Si Jokko fait de l'acquisition payante mobile plus tard, on devra ré-évaluer (et potentiellement ré-ouvrir cet ADR).
- ❌ Pas de cohort cross-device pour les utilisateurs qui se connectent web + mobile depuis le même iPhone. Mitigation : on cohort par `userId` Convex (cross-device authentifié, pas device fingerprinting).
- ❌ Si on intègre un SDK tiers qui track par défaut (ex. Branch.io, Adjust, Singular, Amplitude pré-config), on devra :
  - Soit configurer le SDK en mode "no tracking" (souvent possible)
  - Soit changer cette décision et activer le prompt ATT (lourdeur produit)

## Configuration concrète à appliquer

### `apps/mobile/app.json` (déjà fait dans S2)

```jsonc
"ios": {
  "privacyManifests": {
    "NSPrivacyTracking": false,
    "NSPrivacyTrackingDomains": [],
    "NSPrivacyCollectedDataTypes": [/* voir manifest complet */],
    "NSPrivacyAccessedAPITypes": [/* voir manifest complet */]
  }
}
```

### PostHog (à appliquer au moment de l'install — Lot L1)

```typescript
// apps/mobile/src/lib/analytics.ts (à créer en L1)
import PostHog from "posthog-react-native";

export const posthog = new PostHog(POSTHOG_API_KEY, {
    host: POSTHOG_HOST,
    disableIdfa: true,           // ← critique : pas d'IDFA
    captureAppLifecycleEvents: true,
    captureDeepLinks: false,     // ← pas de tracking de URL externes
    sendFeatureFlagEvent: false, // optionnel
    enableSessionReplay: false,  // ← v1.0 désactivé (privacy + perf)
});
```

### Sentry (à appliquer Lot L1)

```typescript
// apps/mobile/src/lib/sentry.ts (à créer en L1)
import * as Sentry from "@sentry/react-native";

Sentry.init({
    dsn: SENTRY_DSN,
    sendDefaultPii: false,        // ← critique : pas de PII automatique
    tracesSampleRate: 0.1,
    environment: __DEV__ ? "dev" : "prod",
    beforeSend(event) {
        // PII scrubbing — Decision #55
        delete event.user?.email;
        delete event.user?.username;
        if (event.request?.data) {
            // Strip message bodies, phone numbers, etc.
            event.request.data = "[REDACTED]";
        }
        return event;
    },
});
```

### Consent runtime (Decision #56, à appliquer Lot L1)

Au premier lancement de l'app, modal granulaire :

- **Crash reporting (Sentry)** : activé par défaut, mais utilisateur peut désactiver dans Settings. Justifié comme "intérêt légitime" RGPD (debug = nécessaire au service).
- **Product analytics (PostHog)** : opt-in (désactivé par défaut). Activable depuis Settings.

Si user opt-out de PostHog, `posthog.optOut()` est appelé et `disableIdfa: true` reste actif.

## Vérification post-déploiement (à exécuter en L12)

- [ ] Lancer l'app TestFlight + Charles Proxy → confirmer aucun call vers domaines de tracking publicitaires (doubleclick, facebook, branch.io, adjust, etc.)
- [ ] Vérifier que `NSPrivacyTracking: false` apparaît dans le Privacy Nutrition Label App Store Connect
- [ ] Fail-test : tenter de submission avec un mauvais Privacy Manifest → vérifier le rejet App Store

## Trigger de ré-évaluation

Cet ADR doit être ré-ouvert si :
1. Acquisition payante mobile devient un canal stratégique (besoin attribution)
2. Un SDK tiers obligatoire (ex. partenaire B2B) requiert IDFA / tracking
3. Apple change les règles ATT (improbable à court terme)

## Liens

- [Apple — User Privacy and Data Use](https://developer.apple.com/app-store/user-privacy-and-data-use/)
- [Apple — Privacy Manifest Files](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files)
- [Apple — Required Reason API codes](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files/describing_use_of_required_reason_api)
- [PostHog React Native — disableIdfa](https://posthog.com/docs/libraries/react-native#config)
- `architecture.md §17.3` Decision #51, #52, #55, #56
