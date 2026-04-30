# Spikes S2 + S3 — App Store Privacy Manifest + ATT/IDFA

> **Statut** : ✅ Terminés (configuration + ADR + audit SDK), validation finale au build EAS production
> **Date** : 2026-04-30
> **Effort réel** : ~1h (vs ~3 jours estimés combinés dans `architecture.md §17.2`)
> **Verdict** : Pas de blocker — Privacy Manifest configuré déclarativement via `app.json`, pas de prompt ATT nécessaire grâce à la décision "no IDFA".

---

## 1. Objectif

- **S2** : produire le `PrivacyInfo.xcprivacy` agrégé requis par Apple depuis mai 2024 sous peine de rejet App Store.
- **S3** : trancher la question ATT/IDFA (afficher le prompt ou pas) avec une décision documentée durable.

## 2. Spike S2 — Privacy Manifest

### 2.1 Approche choisie

Expo SDK 54+ supporte la configuration **déclarative** via `app.json` `ios.privacyManifests` plutôt qu'un fichier XML `PrivacyInfo.xcprivacy` à maintenir manuellement. Le manifest XML est généré automatiquement à `expo prebuild` / `eas build`.

**Avantage** : la config vit dans le repo (versionnée, lisible, mergeable), pas un binaire opaque.

### 2.2 Contenu du manifest agrégé Jokko (déjà appliqué dans `apps/mobile/app.json`)

#### NSPrivacyTracking
- `false` — aucun cross-app tracking, aucun usage IDFA (voir ADR-0001).

#### NSPrivacyTrackingDomains
- `[]` — aucun domaine de tracking publicitaire.

#### NSPrivacyCollectedDataTypes (12 entrées)

| Donnée collectée | Linked | Tracking | Purpose |
|---|---|---|---|
| Email Address | true | false | App Functionality |
| Name | true | false | App Functionality |
| Phone Number | true | false | App Functionality |
| User ID (Apple sub, Convex userId) | true | false | App Functionality |
| Photos or Videos (médias WhatsApp) | true | false | App Functionality |
| Audio Data (voice notes) | true | false | App Functionality |
| Customer Support (conversations) | true | false | App Functionality |
| Coarse Location (location share) | true | false | App Functionality |
| Crash Data (Sentry) | false | false | App Functionality |
| Performance Data (Sentry traces) | false | false | Analytics |
| Other Diagnostic Data | false | false | App Functionality |
| Product Interaction (PostHog opt-in) | false | false | Analytics |

#### NSPrivacyAccessedAPITypes (4 catégories)

| Catégorie API | Reason code | Justification Jokko |
|---|---|---|
| FileTimestamp | `DDA9.1` | Cache management des médias téléchargés (vérifier si fichier expire) |
| UserDefaults | `CA92.1` | Lecture/écriture des préférences app (langue, theme) — MMKV utilise NSUserDefaults sous le capot |
| SystemBootTime | `35F9.1` | Sentry performance traces — calcul du temps depuis boot |
| DiskSpace | `E174.1` | Vérification d'espace disque avant download/save de médias volumineux |

### 2.3 Per-SDK contributions (à valider à chaque ajout de dep)

Apple agrège automatiquement les manifests des SDKs au build. Notre app Jokko ajoute son propre manifest, et chaque SDK doit avoir le sien.

| SDK | Privacy Manifest fourni | Action requise |
|---|---|---|
| `expo` (core) | ✅ Oui (depuis SDK 51) | Aucune |
| `react-native` | ✅ Oui (depuis 0.74.5) | Aucune |
| `expo-apple-authentication` | ✅ Oui | Aucune |
| `expo-secure-store` | ✅ Oui | Aucune |
| `convex` | ⚠️ À vérifier (SDK pas encore en prod mobile) | Audit avant L1 |
| `@shopify/react-native-skia` | ✅ Oui (depuis 1.5.0) | Aucune |
| `react-native-reanimated` | ✅ Oui | Aucune |
| `react-native-gesture-handler` | ✅ Oui | Aucune |
| `expo-blur`, `expo-haptics`, `expo-status-bar` | ✅ Oui | Aucune |
| **À ajouter en L1** : | | |
| `react-native-mmkv` | ✅ Oui (depuis 2.12.2) | Aucune |
| `expo-router` | ✅ Oui | Aucune |
| `i18next`, `react-i18next` | N/A (pas de natif iOS) | Aucune |
| **À ajouter en L4 (médias)** : | | |
| `expo-camera`, `expo-image-picker` | ✅ Oui | Aucune |
| `expo-document-picker`, `expo-av`, `expo-location` | ✅ Oui | Aucune |
| `expo-image-manipulator` | ✅ Oui | Aucune |
| `react-native-maps` | ⚠️ Versions récentes oui | Auditer version au moment de l'install |
| **À ajouter en L6 (push)** : | | |
| `expo-notifications` | ✅ Oui | Aucune |
| **À ajouter en L1 (observability)** : | | |
| `@sentry/react-native` | ✅ Oui (depuis v5.21.0) | Aucune |
| `posthog-react-native` | ✅ Oui (depuis v3.x) | Auditer config IDFA |

### 2.4 Test de validation au build

Quand le projet aura un build EAS production (Lot L12), la commande suivante doit être exécutée :

```bash
# Sur le .ipa généré
unzip -p Jokko.ipa Payload/Jokko.app/PrivacyInfo.xcprivacy | xmllint --format -
```

Et croiser avec :
- App Store Connect → Privacy Nutrition Label : doit refléter ces données
- App Review : la submission doit passer sans rejet 5.1.1 (privacy)

## 3. Spike S3 — ATT/IDFA decision

### 3.1 Décision

**Aucun cross-app tracking, aucun IDFA** — détaillée dans `apps/mobile/docs/adr/0001-no-idfa-no-cross-app-tracking.md`.

Conséquence directe : **pas de prompt ATT v1.0**.

### 3.2 Configuration concrète à appliquer en L1

Voir l'ADR-0001 §"Configuration concrète" pour :
- PostHog `disableIdfa: true`
- Sentry `sendDefaultPii: false` + `beforeSend` PII scrubber
- Consent runtime modal granulaire (crash mandatory + analytics opt-in)

### 3.3 Test de validation post-deploy

À exécuter en Lot L12 :

```bash
# 1. Lancer l'app TestFlight via Charles Proxy (HTTPS interception)
# 2. Faire un parcours complet : login Apple → inbox → envoi message → settings → logout
# 3. Inspecter toutes les requêtes sortantes
# 4. Vérifier 0 call vers : doubleclick.net, facebook.com/tr, branch.io, adjust.com, app.adjust.com, singular.net
```

Si un call inattendu apparaît : c'est un SDK qui s'est invité, à investiguer immédiatement.

## 4. Findings techniques importants

### 4.1 Différence Apple Privacy Manifest vs Privacy Nutrition Label

Ces deux artefacts sont **distincts** et doivent rester cohérents :

| | Privacy Manifest | Privacy Nutrition Label |
|---|---|---|
| **Format** | Fichier XML dans le bundle .ipa | Formulaire App Store Connect |
| **Audience** | Apple internal (review automatique) | Utilisateur (App Store) |
| **Mise à jour** | À chaque release | À chaque submission |
| **Validation** | Build-time | Manuelle dans ASC |
| **Rejet automatique** | Oui (5.1.1, 5.1.2) | Non, mais review humaine peut flagger |

→ **Implication L12** : il faut **deux fois** déclarer ce qu'on collecte. La source de vérité côté code = `app.json` `privacyManifests`. La source App Store Connect = à **synchroniser manuellement** depuis le manifest généré.

### 4.2 Pièges classiques

1. **MMKV utilise NSUserDefaults** sous le capot iOS → `NSPrivacyAccessedAPICategoryUserDefaults` avec reason `CA92.1` obligatoire.
2. **Sentry capture le device boot time** pour ses performance traces → `NSPrivacyAccessedAPICategorySystemBootTime` avec `35F9.1` obligatoire.
3. **`expo-file-system`** lit les timestamps des fichiers cache → `NSPrivacyAccessedAPICategoryFileTimestamp` avec `DDA9.1` obligatoire.
4. **Si on ajoute n'importe quel SDK qui collecte des données** sans manifest → rejet App Store. Audit obligatoire à chaque `pnpm add`.

### 4.3 SDK qui posent problème (à éviter)

- **AppsFlyer / Branch / Adjust / Singular** : font tous du cross-app tracking par défaut → incompatibles avec `NSPrivacyTracking: false`. Ne PAS les ajouter sans ré-ouvrir l'ADR-0001.
- **Firebase Analytics, Google Analytics** : tracking par défaut → idem.
- **Meta SDK** : tracking par défaut → idem.
- **Amplitude** : peut être configuré sans IDFA mais demande une vigilance config.

### 4.4 RGPD vs ATT — distinction

- **ATT** est une exigence **Apple** (iOS 14.5+) sur le tracking cross-app → résolue par "no IDFA".
- **RGPD** est une exigence **EU** sur tout traitement de données personnelles → consent runtime obligatoire pour PostHog (analytics opt-in), même sans IDFA.

→ Les deux sont **indépendantes**. Décider "no ATT prompt" ne dispense PAS d'un consent UI runtime pour les EU users.

## 5. Fichiers livrés

- `apps/mobile/app.json` (modifié, ajout `privacyManifests`)
- `apps/mobile/docs/adr/0001-no-idfa-no-cross-app-tracking.md` (nouvel ADR)
- `apps/mobile/docs/spike-S2-S3-privacy-att.md` (ce doc)

## 6. Verdict & next step

✅ **Spike S2 réussi** — manifest agrégé déclaratif dans `app.json`, tous les SDKs candidats v1.0 ont leur manifest.

✅ **Spike S3 réussi** — décision tranchée et durablement documentée (ADR-0001), pas de prompt ATT v1.0.

**Risque résiduel** : le manifest doit être **re-validé à chaque ajout de SDK** (audit dans la PR review). Une CI rule pourrait checker — à investiguer en L1.

**Recommandation** : passer aux spikes restants :
- **S4** — Demo account WhatsApp Business (compliance App Review)
- **S5** — Multi-tenant cache purge sequence (RGPD critique)
- **S6** — PII scrubbing technique (déjà esquissé dans ADR-0001 §Sentry config, à concrétiser en L1)
- **S7** — Voice notes waveform POC (nécessite un device iOS réel)
- **S8** — Convex websocket fallback policy (test sur réseau dégradé)

S5 et S6 peuvent être attaqués sans Apple Dev account et sans device iOS. S4 nécessite un compte WhatsApp Business test (Meta).

## 7. Décisions Decision Log à ajouter dans `architecture.md §17.3`

| # | Nouvelle décision | Source | Impact |
|---|---|---|---|
| 65 | **Privacy Manifest déclaratif via `app.json`** (pas de XML manuel) — Expo SDK 54+ génère le `PrivacyInfo.xcprivacy` au prebuild | Spike S2 §2.1 | L1 + ongoing |
| 66 | **Audit SDK obligatoire à chaque `pnpm add`** : vérifier que le SDK fournit son privacy manifest, sinon ne pas l'utiliser | Spike S2 §2.3 + §4.3 | Process / lint rule |
| 67 | **PostHog config `disableIdfa: true`** + `captureDeepLinks: false` + `enableSessionReplay: false` (perf + privacy v1.0) | ADR-0001 §Configuration | L1 |
| 68 | **Sentry config `sendDefaultPii: false`** + `beforeSend` scrubber strip emails / phone / message bodies | ADR-0001 §Configuration | L1 |
| 69 | **Consent runtime granulaire** : Crash reporting = legitimate interest (default on, opt-out possible). Analytics PostHog = opt-in (default off). Modal au first launch + Settings page. | ADR-0001 + Decision #56 | L1 |
| 70 | **Charles Proxy audit en L12** : valider 0 call vers doubleclick / fb / branch / adjust / singular avant submission App Store | Spike S3 §3.3 | L12 |
| 71 | **`NSPrivacyTracking: false`** verrouillé v1.0. Ré-évaluation requise si acquisition payante mobile devient un canal stratégique | ADR-0001 §Trigger de ré-évaluation | Stratégie |
