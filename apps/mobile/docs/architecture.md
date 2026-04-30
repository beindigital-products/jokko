# Jokko Mobile — Architecture & Design Document

> **Statut** : Design validé (brainstorming + multi-agent review + L0 spikes exécutés). **78 décisions verrouillées**.
> **Date** : 2026-04-30 (dernière mise à jour §17.3 : 2026-04-30)
> **Owner** : @doums85 (solo dev)
> **Disposition Arbiter** : APPROVED (voir §18).
>
> ⚠️ **Important** : Ce doc a été révisé en 3 passes :
> 1. **§1-16** : design original single-agent (brainstorming skill)
> 2. **§17 (Décisions 31-60)** : revisions après review multi-agents (72 objections)
> 3. **§17.3 (Décisions 61-78)** : findings des spikes L0 exécutés (S1, S2+S3, S5)
>
> **Lire la §17 avant d'implémenter.**

---

## 1. Understanding Summary

### 1.1 Quoi
Application mobile native iOS (puis Android en v1.1+) pour **Jokko** offrant la **parité fonctionnelle complète** avec le dashboard web — conversations, contacts, flows, broadcasts, automatisations, modèles, assignments, team, analytics, billing, integrations, notifications, settings, help.

### 1.2 Pourquoi
Permettre aux utilisateurs (OWNER, ADMIN, AGENT) de gérer leur compte WhatsApp Business multi-numéros depuis leur téléphone, avec une expérience **native premium** — pas une webview rétrécie.

### 1.3 Pour qui
Les 3 rôles (OWNER / ADMIN / AGENT) à terme. v1.0 focalisée AGENT. Usage majoritairement en mobilité (agents support / sales en déplacement) avec capacité full-admin progressive.

### 1.4 Identité visuelle
- Design mobile-natif (HIG iOS) + palette du web (`@jokko/tokens` + variables OKLch).
- **Moments signature animés** re-codés depuis les 3 spikes existants : `InboxBreathing`, `ComposeMorph`, `GlassReply`.
- Accent principal : violet electric `oklch(0.58 0.22 285)`.
- Iconographie : **Lucide React Native** uniquement, aucun emoji dans l'UI chrome (les emojis user content dans les messages/réactions WhatsApp restent des emojis).

### 1.5 Contraintes
- **1 dev solo**, pas de deadline dure → livraison itérative en lots de 2-3 semaines.
- iOS 16+ uniquement v1.0 (couverture ~95% devices actifs).

### 1.6 Non-goals v1.0
- Pas d'Android.
- Pas de flows builder, broadcasts, billing, integrations sur mobile (reportés v1.1/v1.2).
- Pas d'offline-first complet (cache lecture + queue envoi seulement).
- Pas de Storybook, Detox, certificate pinning, biométrique.
- Pas d'inline reply silencieux depuis lock screen (compromis pragmatique, ouvre l'app).

---

## 2. Stratégie de release (staged, full-parity goal)

```
v1.0 — AGENT-focused (~6-7 mois solo)
  Inbox premium, médias complets, push, contacts, modèles, profile/settings.
  TestFlight beta puis App Store.
        │
        ▼
v1.1 — ADMIN (~4-6 mois)
  Flow builder mobile, broadcasts, team, analytics, automatisations, assignments.
        │
        ▼
v1.2 — OWNER (~2-3 mois)
  Billing, integrations, config WhatsApp avancée.
        │
        ▼
PARITÉ TOTALE atteinte (~12-16 mois total).
```

---

## 3. Décisions verrouillées (Decision Log v1.0)

| # | Décision | Alternatives écartées | Raison |
|---|---|---|---|
| 1 | Parité fonctionnelle complète web ↔ mobile (objectif final) | Companion app / agent-only / progressif uniquement | Vision long terme |
| 2 | iOS v1.0, Android v1.1+ | iOS-only, dual-launch, Android-first | Maîtriser une plateforme avant l'autre |
| 3 | Mobile-native + moments signature animés | Pure native / pure premium / port web | Conserver investissement R&D des spikes sans surcharger les écrans informationnels |
| 4 | 3 rôles supportés à terme, staged par release | Agent only, Agent+Admin | Parité totale visée mais réaliste solo |
| 5 | Auth = Password + Google OAuth + Sign in with Apple | Password seul, magic link/OTP | Parité web + obligation App Store |
| 6 | Push riches + smart routing par rôle/préférences | Push basiques, pas de push | Standard messaging pro 2026 |
| 7 | Mode offline = cache lecture + queue envoi messages | Online-only, offline-first complet | Sweet spot coût/valeur pour usage mobilité |
| 8 | Spikes re-codés dans `packages/ui-mobile` | Intégration directe / re-validation / trash | Garder signature visuelle, propre pour scaler |
| 9 | Tous types de messages v1.0 (text/photo/vidéo/voice/doc/location/sticker/reaction/reply) | Lecture seule, staged | Voice notes & médias = différenciateur clé |
| 10 | i18n FR + EN dès v1.0 | FR-only, multi-langue, EN best-effort | Coût setup identique, débloque marché international |
| 11 | Solo, sans deadline, releases itératives | Deadline dure, équipe | Réalité actuelle |
| 12 | Welcome carousel marketing + onboarding org wizard | Onboarding org seul, welcome seul | Standard B2B premium 2026 |
| 13 | Stratégie staged : v1.0 AGENT → v1.1 ADMIN → v1.2 OWNER | Big-bang v1.0 parité totale | Seule voie réaliste solo |
| 14 | Stack : Expo Router + Zustand + Convex direct + MMKV + expo-secure-store | React Navigation, Redux, SQLite cache | Cohérence avec web + standards 2026 |
| 15 | Nouveaux packages : `ui-mobile`, `convex-client`, `i18n` | Code dans `apps/mobile` direct | Réutilisabilité, cleanlines monorepo |
| 16 | Extension `@jokko/tokens` pour OKLch ↔ hex | Migration web vers hex | Zéro coût pour le web |
| 17 | IA : 5 tabs (Inbox / Contacts / Notifs / Hub / Plus) | 3 tabs + drawer, hub+spoke | Meilleur compromis découverte/encombrement |
| 18 | **Lucide React Native** pour toute l'UI chrome | SF Symbols, Phosphor, custom | Cohérence avec web Jokko |
| 19 | Stroke 1.75, tailles 16/20/24, label sous icône en tab bar | Stroke 2, icônes seules | Look premium + HIG iOS |
| 20 | FlashList pour listes (inbox, contacts, messages) | FlatList, SectionList | Perf 10k+ rows |
| 21 | 24h window WhatsApp respectée (composer désactivé hors fenêtre + CTA modèle) | Ignorer la limite | Compliance API WhatsApp |
| 22 | Voice notes : Skia waveform + hold-to-record + slide-cancel/lock | Bouton tap + recording screen | Standard WhatsApp/Telegram |
| 23 | Tables Convex à créer : `devices`, `notificationPreferences` | Stocker dans `users` | Modélisation propre, indexation |
| 24 | "Répondre depuis lock screen" v1.0 = ouvre l'app | Inline reply silencieux | Pas de Notification Service Extension v1.0 |
| 25 | 12 lots de 2-3 semaines pour v1.0, ~6-7 mois total | Big-bang, lots plus longs | Itération rapide, démo possible chaque lot |
| 26 | Tests : Vitest + RN Testing Library + Maestro | Detox, Appium | Maintenance solo |
| 27 | A11y WCAG 2.1 AA dès v1.0 | Reporter | Engagement qualité produit |
| 28 | Dark mode dès v1.0 | Reporter v1.1 | Tokens OKLch déjà compatibles |
| 29 | Crash reporting Sentry + analytics PostHog | Datadog, Firebase | Cohérence stack web |
| 30 | iOS 16+ minimum supporté | iOS 15, iOS 17 | Couverture ~95% devices |

---

## 4. Architecture & monorepo

### 4.1 Cible structurelle

```
apps/
  ├── mobile/                    → Expo SDK 54 + Expo Router v3
  └── web/                       → inchangé (Next.js 16)
packages/
  ├── core/                      → étendu (helpers mobile)
  ├── tokens/                    → étendu (alias OKLch ↔ hex pour native + theme.dark)
  ├── ui-mobile/        [NEW]    → composants natifs (MessageBubble, ConversationRow, ComposerInput, GlassMenu, etc.)
  ├── convex-client/    [NEW]    → wrapper Convex partagé (auth, hooks, types)
  └── i18n/             [NEW]    → keys + traductions FR/EN partagées web ↔ mobile
convex/                          → ajouts : notificationPreferences, devices, expoPushTokens
```

### 4.2 Stack technique verrouillé

| Domaine | Choix |
|---|---|
| Runtime | Expo SDK 54 + React Native 0.81 |
| Navigation | Expo Router v3 (file-based, modal stack natif, deep linking) |
| State | Zustand + middleware `persist` |
| Data | Convex `useQuery`/`useMutation` direct (pas de fork mobile) |
| Animation | Reanimated v3 + Skia + Gesture Handler v2 |
| Auth | `@convex-dev/auth` (Password) + `expo-auth-session` (Google) + `expo-apple-authentication` |
| Storage | `react-native-mmkv` (cache, prefs) + `expo-secure-store` (Keychain) |
| Listes | `@shopify/flash-list` |
| i18n | `i18next` + `react-i18next` + `expo-localization` |
| Push | `expo-notifications` (Expo Push Service) |
| Médias | `expo-camera`, `expo-image-picker`, `expo-document-picker`, `expo-av` (audio), `expo-location`, `expo-image-manipulator` |
| Crash | Sentry React Native |
| Analytics | PostHog React Native |
| Tests | Vitest + RN Testing Library + Maestro |
| CI/CD | EAS Build + GitHub Actions |

---

## 5. Information Architecture

### 5.1 Tab bar v1.0 (5 entrées, AGENT-focused)

| Tab | Icône Lucide | Contenu v1.0 | Contenu v1.1+ |
|---|---|---|---|
| Inbox | `<MessageCircle />` | Liste conversations + thread + médias + composer | Filtres avancés, segmentation |
| Contacts | `<Users />` | Liste, recherche, fiche contact, historique | Import, segments, custom fields |
| Notifs | `<Bell />` | Centre notifications (assignments, mentions) | Smart routing UI, DND fines |
| Hub | `<LayoutGrid />` | Modèles WhatsApp (lecture+envoi) | + Broadcasts, Flows, Analytics, Automations, Assignments |
| Plus | `<Settings />` | Profil, équipe (lecture), paramètres app, langue, déconnexion | + Billing (OWNER), Integrations (ADMIN), Config WhatsApp (OWNER) |

### 5.2 Stack de navigation Expo Router

```
app/
├── (welcome)/                # Lot 1 - hors auth
│   ├── intro.tsx             # carousel marketing animé (3 slides)
│   └── _layout.tsx
├── (auth)/                   # Lot 2
│   ├── sign-in.tsx
│   ├── sign-up.tsx
│   ├── forgot-password.tsx
│   └── _layout.tsx
├── (onboarding-org)/         # Lot 2
│   ├── name.tsx
│   ├── whatsapp-connect.tsx  # deeplink vers web pour la config Meta
│   ├── invite-team.tsx
│   └── _layout.tsx
├── (tabs)/                   # Lot 3+
│   ├── inbox/
│   │   ├── index.tsx
│   │   ├── [conversationId].tsx
│   │   └── _layout.tsx
│   ├── contacts/
│   ├── notifications/
│   ├── hub/
│   └── settings/
└── _layout.tsx               # root: AuthGuard + i18n + theme + Sentry
```

### 5.3 Deep linking

- `jokko://conversation/:id` → ouvre directement le thread
- `jokko://notifications` → onglet notifs
- `https://app.jokko.io/c/:id` → universal link iOS
- Push notification tap → resolved via deep link

---

## 6. Auth & Onboarding flow

### 6.1 Flow complet du premier lancement

1. **Splash** — Logo Jokko + glow violet 600ms
2. **Welcome carousel** (first launch only) — 3 slides animées (Skia + Reanimated)
3. **Auth screen** — Apple (top, HIG) > Google > Password
4a. **Existing user** → `(tabs)/inbox`
4b. **New user** → `(onboarding-org)`
5. **Org wizard** — Nommer / Connecter WhatsApp (deeplink web) / Inviter équipe (skippable)
6. **Permissions iOS** — Push (essentiel), Camera/Mic (différés au moment d'utiliser)
7. **`(tabs)/inbox`** — l'app commence vraiment

### 6.2 Auth tech

- **Apple** : `expo-apple-authentication` → token JWT envoyé à mutation Convex `auth.signInWithApple` (custom provider à créer).
- **Google** : `expo-auth-session` avec config OAuth client iOS.
- **Password** : `@convex-dev/auth` Password provider, mêmes règles que web (10+ chars, validation FR).
- **Tokens** : stockés en `expo-secure-store` (Keychain).
- **Auto-login** : cold start lit token → `getMe()` → directement inbox si OK.

### 6.3 Edge cases auth

- User créé Google web puis tente Apple mobile → linking via email.
- User invité sans compte → magic link → ouvre l'app si installée.
- Connexion WhatsApp Business → deeplink vers web v1.0 (Facebook Business Manager requiert desktop).

---

## 7. Inbox + Thread (cœur premium)

### 7.1 Inbox

- **FlashList** virtualisé pour 10k+ rows
- Filter segmented : Tous / Non lus / Assignés / Snooze (persisté MMKV)
- **Pull-to-refresh** → re-sync Convex
- **Swipe-left** → assigner / archiver (haptic medium)
- **Swipe-right** → marquer lu/non lu (haptic light)
- **Long-press** → quick actions sheet
- **Live update** : nouveau message → row remonte + `InboxBreathing` animation 800ms + haptic subtle

### 7.2 Thread

- Header avatar + nom + statut présence
- Bulles inbound (gauche, surface raised) / outbound (droite, accent primary)
- Statut delivery : `<CheckCheck />` Lucide (gris = SENT, bleu = READ)
- Composer en bas (`ComposeMorph` re-codé)
- Pagination par fenêtre 50 messages, scroll-to-load-older
- Typing indicator (3 points animés) si présence active

### 7.3 Moments signature

| Spike | Intégration | Lot |
|---|---|---|
| `InboxBreathing` | Row qui pulse Skia gradient sur new msg | L3 |
| `ComposeMorph` | Input qui morphe quand on tape (placeholder fade + send btn naît Skia path) | L3 |
| `GlassReply` | Long-press bulle → blur full-screen + bulle qui lève + 6 réactions + actions | L5 |

### 7.4 24h window WhatsApp

Hors fenêtre 24h → composer désactivé + CTA "Envoyer un modèle" + badge orange dans inbox.

### 7.5 Edge cases

- Message en queue offline → statut "En attente"
- Message échoué → statut rouge + tap-to-retry
- Conversation 5000+ msg → pagination, lazy load older
- Message édité côté WhatsApp → non supporté API, ignoré

---

## 8. Médias & composer avancé

### 8.1 Machine à états composer

```
IDLE → MEDIA_SHEET / RECORDING / TYPING → PREVIEW → SEND → SENDING (optimistic) → SENT/FAILED
```

### 8.2 Photo & vidéo

- `expo-camera` v17+ : tap = photo, hold = vidéo (max 30s)
- `expo-image-picker` : multi-select max 10 (limite WhatsApp)
- Crop léger v1.0 : ratios libre / 1:1 / 4:3 / 9:16
- Trim vidéo : timeline scrubbable Reanimated
- Compression auto si > 16 MB

### 8.3 Voice notes (signature WhatsApp-style)

1. Hold sur `<Mic />` → haptic medium → record démarre
2. Composer transformé : waveform Skia live 60fps + timer + "Slide to cancel ←"
3. Slide-up → lock mode (mains libres)
4. Slide-left → cancel
5. Release → preview re-écoutable + Annuler / Envoyer
6. Format AAC 64kbps mono → M4A → upload WhatsApp Media API
7. Transcription Whisper en v1.1 (opt-in)

### 8.4 Documents & location

- `expo-document-picker` → bulle DOCUMENT avec icône Lucide selon mimetype
- `expo-location` → bottom sheet mini-map (`react-native-maps`)

### 8.5 Stickers & réactions

- v1.0 : stickers WhatsApp built-in (250 packs Meta)
- Réactions : tap bulle → GlassReply menu → emoji → mutation Convex `messages.react`

### 8.6 Reply threadé

Swipe-right sur bulle → quote remonte composer, `replyToMessageId` envoyé.

### 8.7 Pipeline upload

```
Mobile → Convex action ("use node") → WhatsApp Cloud Media API
  blob → /media → media_id → /messages → wamid → Convex DB → optimistic UI confirm
```

### 8.8 Permissions iOS (FR + EN)

- `NSCameraUsageDescription` : "Pour envoyer des photos et vidéos dans vos conversations"
- `NSMicrophoneUsageDescription` : "Pour enregistrer des messages vocaux"
- `NSPhotoLibraryUsageDescription` : "Pour partager des photos depuis votre galerie"
- `NSLocationWhenInUseUsageDescription` : "Pour partager votre position dans une conversation"

### 8.9 Edge cases

- Réseau lent → barre progression dans bulle
- App killed pendant upload → reprise via `expo-task-manager`
- Fichier > limite → message clair + suggestion compression
- Pas de connexion → queue + auto-retry au retour réseau
- Format non supporté → conversion auto si possible (HEIC → JPEG)

---

## 9. Push notifications & smart routing

### 9.1 Tables Convex à créer

```typescript
devices: defineTable({
  userId: v.id("users"),
  organizationId: v.id("organizations"),
  expoPushToken: v.string(),
  platform: v.union(v.literal("ios"), v.literal("android")),
  appVersion: v.string(),
  lastActiveAt: v.number(),
  notificationsEnabled: v.boolean(),
}).index("by_user", ["userId"])
  .index("by_token", ["expoPushToken"]);

notificationPreferences: defineTable({
  userId: v.id("users"),
  organizationId: v.id("organizations"),
  newMessages: v.boolean(),
  assignments: v.boolean(),
  mentions: v.boolean(),
  systemAlerts: v.boolean(),
  mutedConversationIds: v.array(v.id("conversations")),
  mutedChannelIds: v.array(v.id("channels")),
  dndEnabled: v.boolean(),
  dndStartHour: v.number(),
  dndEndHour: v.number(),
  dndWeekendsOnly: v.boolean(),
  dndTimezone: v.string(),
}).index("by_user", ["userId"]);
```

### 9.2 Smart routing (helper Convex)

`shouldNotifyUser(userId, event)` vérifie dans l'ordre :
1. Catégorie globale activée
2. Conversation/canal pas muté
3. Rôle pertinent pour ce type d'event
4. Si AGENT + NEW_MESSAGE : conversation lui est assignée
5. Pas en window DND

### 9.3 Catégories iOS riches (Expo)

- `MESSAGE` : Répondre (textInput) / Marquer lu / Mettre en sourdine
- `ASSIGNMENT` : Accepter / Décliner

⚠️ "Répondre depuis lock screen" v1.0 → ouvre l'app pré-remplie (pas inline reply silencieux, requiert Notification Service Extension non supportée par Expo SDK pur).

### 9.4 Badge count

Calcul Convex `unreadConversations + unreadNotifications` → envoyé avec chaque push → reset partiel à l'ouverture inbox.

### 9.5 Page préférences (Settings tab)

UI iOS Settings-style : toggles catégories, range DND, week-ends only, conversations en sourdine.

### 9.6 Edge cases

- Plusieurs devices → push à tous tokens actifs (lastActiveAt < 30j)
- Token Expo invalide → cleanup auto via cron Convex
- App désinstallée → APNs "Unregistered" → token marqué inactif
- Push reçu app foreground → pas de notif système, haptic + toast in-app

---

## 10. Offline, cache & state management

### 10.1 Stack persistance mobile

```
React Components
      │ useQuery / useMutation
ConvexProvider (réactif)
      │
Zustand stores (UI state, drafts, queues)
      │ persist middleware
MMKV (cache lecture, drafts, queue, prefs)

expo-secure-store (Keychain) — auth tokens
expo-file-system (cache disque) — médias
```

### 10.2 Cache lecture

- Snapshot light en MMKV (50 dernières conversations + 50 derniers messages par conv visitée)
- Hook `useInbox()` retourne `live ?? cache.conversations`
- Eviction LRU si > 100 MB

### 10.3 Queue d'envoi

- Store Zustand persisté `useSendQueue`
- Worker hook au root layout : NetInfo détecte reconnexion → itère queue → mutation Convex
- Backoff exponentiel : 1s → 5s → 30s → 5min → 30min → abandon
- Statut visible dans bulle (PENDING horloge / FAILED rouge tap-to-retry)

### 10.4 Optimistic UI

- Mutation Convex avec `optimisticUpdate`
- Idempotency key = local UUID (pas de doublon)

### 10.5 Multi-tenant

- `useCurrentOrg()` portable mobile sans modif
- Switch d'org → invalidation cache local

### 10.6 Indicateurs réseau

- Bandeau discret "Hors ligne — vos messages partiront au retour" après 3s sans réseau
- Composer reste actif (queue prend le relais)
- Actions risquées (suppression, archivage) désactivées avec toast info

### 10.7 Edge cases

- App killed en cours d'envoi → reprise queue persistée
- Token expiré offline → queue bloquée → refresh auto à la reconnexion
- Org switch offline → purge queue ancienne org avec avertissement

---

## 11. Découpage en lots v1.0 (AGENT)

| Lot | Durée | Contenu | Livrable |
|---|---|---|---|
| L1 — Bootstrap & design system | 2-3 sem. | Expo Router, packages init, tokens extension, base components, splash + welcome carousel, EAS + Sentry + PostHog | App lance, carousel, TestFlight interne OK |
| L2 — Auth & onboarding org | 2-3 sem. | Apple + Google + Password, wizard org, deeplink WA, permissions | User crée org, atterrit inbox vide |
| L3 — Inbox + thread (signature) | 3 sem. | FlashList, filters, thread text, MessageBubble, ComposerInput, **InboxBreathing** + **ComposeMorph** | Convs temps réel + envoi/réception texte fluide |
| L4 — Médias complets | 3 sem. | Caméra, galerie, voice notes, docs, location, stickers, pipeline upload, bulles médias | Tous types de messages OK |
| L5 — Réactions, replies, GlassReply | 2 sem. | Long-press → **GlassReply**, réactions emoji, swipe-right reply, quote composer | Interactions premium complètes |
| L6 — Push & smart routing | 2-3 sem. | Tables Convex, Expo Push, catégories iOS, smart routing, page préfs | Notifs riches + actions + réglages |
| L7 — Contacts | 2 sem. | Liste FlashList, recherche, fiche détail, historique conv, tags lecture | Tab Contacts complète |
| L8 — Notifs tab + Modèles (Hub) | 2 sem. | Centre notifs, modèles WA lecture+envoi | Tabs Notifs et Hub fonctionnelles |
| L9 — Profil & Settings | 1-2 sem. | Tab Plus, profil édit, langue switch, thème, logout, about | Tab Plus complète |
| L10 — Offline robustness | 2-3 sem. | Send queue worker, MMKV cache, NetInfo, bandeau, optimistic UI partout | App utilisable en métro/avion |
| L11 — i18n EN complet | 1-2 sem. | Audit chaînes, traduction EN, permissions, dates | App entièrement bilingue |
| L12 — Beta TestFlight + polish | 1-2 sem. | Recrutement testeurs, monitoring, fixes, copie App Store, screenshots, icon | Submission App Store |

**Total estimé : ~6-7 mois solo (avec marge 20%).**

### Definition of Done par lot

- ✅ Tests Maestro happy path
- ✅ Zéro warning TS / ESLint
- ✅ Sentry monitoring actif
- ✅ Build EAS TestFlight OK
- ✅ Démo perso 24h sans bug bloquant
- ✅ Documentation interne à jour

### Jalons

- **Mois 2** : fin L3 → "wow moment" interne (inbox premium temps réel)
- **Mois 4** : fin L6 → utilisable au quotidien
- **Mois 5-6** : L10-L11 → bêta privée
- **Mois 6-7** : L12 → App Store

---

## 12. Qualité, tests, performance, a11y

### 12.1 Pyramide de tests

- **Vitest** : Convex + `@jokko/core` + `@jokko/i18n` + `@jokko/ui-mobile/utils`
- **RN Testing Library** : composants `ui-mobile`
- **Maestro** : 10-15 flows critiques (login, envoi texte/photo/voice, push, switch org, logout)
- Pas de Detox ni Storybook v1.0

### 12.2 Performance budgets

| Métrique | Budget |
|---|---|
| Cold start | < 2s sur iPhone 13 |
| Inbox initial render (50 rows) | < 300ms |
| Thread initial render (50 msg) | < 400ms |
| Tap → conversation ouverte | < 200ms |
| Scroll inbox | 60fps mini, 120fps ProMotion |
| Animation signature | 60fps stable |
| Bundle JS | < 8 MB |
| Mémoire steady-state | < 250 MB |

### 12.3 Accessibilité (WCAG 2.1 AA)

- VoiceOver : labels explicites partout
- Contraste : ≥ 4.5:1 clair et sombre
- Dynamic Type : 200%
- Reduce Motion : désactive animations signature → fade simple
- Tactile : ≥ 44pt × 44pt
- Couleur seule : jamais l'unique signal (statut = couleur + icône)

### 12.4 Dark mode

- Détection système + override Settings
- `theme.dark` exporté depuis `@jokko/tokens`
- Tests visuels manuels par lot

### 12.5 Crash & analytics

- **Sentry** : crashes JS + native, source maps EAS
- **PostHog** : événements produit (login, conversation_opened, message_sent, push_received)
- **Privacy** : aucun contenu de message en télémetry, métadonnées only

### 12.6 CI/CD

- **EAS Build** : profils development / preview / production
- **GitHub Actions** sur PR : typecheck, lint, vitest, EAS preview sur tag `mobile-preview`
- **Maestro** : workflow séparé nightly + manuel

### 12.7 Sécurité

- Auth tokens : Keychain only
- App Transport Security strict (HTTPS only)
- Lint rule `no-console-pii`
- Biométrique optionnel : v1.1
- Screenshot blocker écrans token : lot polish

---

## 13. Risques & mitigations

| Risque | Lot | Probabilité | Mitigation |
|---|---|---|---|
| Apple Sign In + custom Convex provider | L2 | Moyenne | Spike 2-3j avant L2, fallback Password+Google si bloqué |
| Voice notes Skia waveform performante | L4 | Moyenne | Spikes existants prouvent faisabilité, buffer 2j |
| Smart routing latence push < 2s | L6 | Faible | Indexation Convex + batching Expo Push |
| FlashList scroll perf 5k+ rows | L3, L7 | Moyenne | Profile dès L3, memoize, pas de re-render |
| WhatsApp Cloud API rate limits upload | L4 | Faible | Backoff Convex action + queue serveur |
| Maestro flaky en CI | L12 | Forte | Retry strategy, tests par lots de 5 max |
| Solo dev burnout sur projet 12-16 mois | Tous | Moyenne | Lots courts, démo continue, jalons clairs |

---

## 14. Open questions / hypothèses non validées

- Budget Convex tier suffisant pour x users mobile (à vérifier avant beta)
- PostHog vs autre solution analytics (hypothèse, à confirmer définitivement)
- Transcription voice notes Whisper v1.1 : coût API OpenAI vs Convex action vs alternatives
- Notification Service Extension iOS native pour inline reply silencieux : ROI vs effort en v1.1+
- Branding final : logo, splash exact, App Store assets

---

## 15. Annexes

### 15.1 Tokens couleurs ciblés

```typescript
// packages/tokens/src/index.ts (extension)
export const theme = {
  // ... existing
  light: { /* current */ },
  dark: {
    ink: { 100: "#1A1814", 300: "#3F3B35", 500: "#8A847C", 700: "#D7D3CC", 900: "#F5F4F1" },
    surface: { default: "#0F0E0C", raised: "#1A1814", sunken: "#08070D" },
    accent: { primary: "#7A8CFF" },
    // ...
  },
  // OKLch aliases pour compatibilité web
  oklch: {
    accent: { primary: "oklch(0.58 0.22 285)" },
  },
};
```

### 15.2 Références utiles

- `convex/_generated/ai/guidelines.md` — règles Convex (lecture obligatoire avant impl)
- `apps/web/app/globals.css` — palette OKLch source
- `packages/tokens/src/index.ts` — palette mobile actuelle
- `apps/mobile/src/GlassReply.tsx`, `InboxBreathing.tsx`, `ComposeMorph.tsx` — spikes à re-coder

---

## 16. Validation initiale

✅ Understanding Lock confirmé
✅ Approche A (Vertical slice premium) explicitement acceptée
✅ Hypothèses non-fonctionnelles documentées et validées
✅ Risques majeurs identifiés et mitigés
✅ Decision Log v1 complet (30 décisions verrouillées)

➡️ **Étape suivante effectuée** : revue `multi-agent-brainstorming` (§17).

---

## 17. Multi-Agent Review — Réponses & révisions

### 17.1 Process & disposition

3 reviewers invoqués séquentiellement sur le doc v1 (§1-16) :

| Reviewer | Rôle | Objections |
|---|---|---|
| Skeptic / Challenger | "Ce design va échouer en production. Pourquoi ?" | 25 |
| Constraint Guardian | Perf / scale / reliability / sécurité / coût / compliance | 25 |
| User Advocate | Cognitive load / clarity / friction / accessibility réelle | 22 |
| **Total** | | **72** |

Disposition après réponses Primary Designer :

| Catégorie | Nombre |
|---|---|
| ✅ Acceptées + révisées (architecture changée, voir §17.3) | 28 |
| 🔧 Acceptées + spike pré-L1 obligatoire (voir §17.2) | 8 |
| 📅 Acceptées + déférées v1.1+ (voir §17.6) | 14 |
| ❌ Rejetées avec rationale (voir §17.5) | 12 |
| 📝 Acceptées + clarification doc only | 10 |

### 17.2 L0 — Spikes obligatoires AVANT L1 (~3-4 sem.)

Liste finale des spikes qui doivent être validés avec preuve fonctionnelle avant tout démarrage L1. Aucune décision ne peut être considérée comme verrouillée tant que ces spikes ne sont pas terminés.

| Spike | Effort estimé | Bloquant si échec | Référence |
|---|---|---|---|
| **S1** — Sign in with Apple → custom Convex provider (verify JWT + nonce + private email relay) | 1-2 sem. | Oui — Apple guideline 4.8 | Skeptic #2, Guardian #1 |
| **S2** — App Store Privacy Manifest agrégé (PrivacyInfo.xcprivacy) listant chaque SDK + Required Reason API codes | 2 j | Oui — submission rejetée sans | Guardian #3 |
| **S3** — Décision ATT/IDFA : `disableIdfa: true` PostHog + Sentry, no cross-app tracking, no ATT prompt v1.0 | 1 j décision + config | Oui — App Store + CNIL | Guardian #4 |
| **S4** — Demo account fonctionnel (org seed, numéro WhatsApp test, conversations factices) pour App Store + Meta WABA Review | 3 j | Oui — App Review | Guardian #9 |
| **S5** — Multi-tenant cache purge sequence : test E2E Maestro `switchOrg()` (purge MMKV + Zustand + invalidation Convex + reset listeners) | 3 j | Oui — RGPD / fuite cross-org | Guardian #10 |
| **S6** — PII scrubbing technique : `Sentry.beforeSend` impl + ESLint custom rule `no-pii-in-logs` + DPA Sentry/PostHog | 2 j | Oui — RGPD | Guardian #12 |
| **S7** — Voice notes : POC waveform (sample polling `expo-av` ou module natif) sur iPhone faible (SE3) avec mesure FPS p95 | 3 j | Non bloquant — fallback waveform statique acceptable | Skeptic #7, Guardian #14 |
| **S8** — Convex websocket battery profile + politique fallback (timeout, banner, status page) | 3 j | Non bloquant — fallback acceptable | Guardian #6 |

**Total L0** : ~3-4 semaines avant que L1 commence.

### 17.3 Révisions architecture acceptées (Décisions 31 à 78)

**Décisions 31-60** : issues directement de la review multi-agents (Skeptic / Guardian / User Advocate / Arbiter, voir §18).

**Décisions 61-78** : issues des **L0 spikes exécutés après l'Arbiter** (S1 Apple SignIn, S2+S3 Privacy/ATT, S5 multi-tenant purge). Chaque décision référence le findings doc du spike correspondant.

| # | Nouvelle décision | Source | Impact |
|---|---|---|---|
| 31 | **Welcome carousel skippé** pour les utilisateurs invités (sign-up via invite token) | UA #3 | L1 |
| 32 | Tab "Hub" **renommée "Modèles"** v1.0 (rename à "Hub" en v1.1 quand broadcasts/flows ajoutés) | UA #6 | L8 |
| 33 | **Search global v1.0** (cross conv/contacts/messages) — déplacé au L8 puis fusion Notifs+Search | UA #5 | nouveau L8 |
| 34 | **Drafts persistés** par conversation en MMKV (auto-save 500ms après dernière frappe) | UA #11 | L3 |
| 35 | **Snooze avec retour** : durée explicite (1h, 4h, demain matin, custom) + notification au retour de la conversation | UA #12 | L3 |
| 36 | **Undo systématique** sur actions destructives (toast 5s "Annuler" pour archiver, mute, delete) | UA #13 | L3, L7 |
| 37 | **Statut delivery** : icône variante + couleur — `<Check />` simple = SENT, `<CheckCheck />` = DELIVERED, `<CheckCheck />` bleu = READ. Couleur n'est jamais l'unique signal | UA #14 | L3 |
| 38 | **Bandeau hors-ligne après 1s** (au lieu de 3s) | UA #15 | L10 |
| 39 | **Permissions Info.plist localisées** via `InfoPlist.strings` (FR + EN) | UA #16 | L1 |
| 40 | **24h window WhatsApp** : enforcement **côté serveur** (mutation `messages.send` rejette + lance template suggestion) + UI explicative pédagogique ("La fenêtre 24h Meta empêche un message libre. Envoyez un modèle pour relancer.") | Skeptic #15, UA #1 | L3 + Convex |
| 41 | **WhatsApp connect persistant** : si org sans WABA configuré, banner CTA permanent dans inbox + écran vide explicite | UA #18 | L2 |
| 42 | **Notification defaults explicites** : newMessages=on, mentions=on, assignments=on (AGENT only), system=off ; DND off mais suggéré au prompt push initial | UA #9 | L6 |
| 43 | **Switch org online** : flush in-flight queue avec confirm utilisateur si messages en attente | UA #22 | L10 |
| 44 | **Lint i18n actif dès L1** : règle ESLint `i18next/no-literal-string` empêche chaînes hardcodées dès le premier code | Guardian #23 | L1 |
| 45 | **Performance budgets révisés** : cold start `<3s` (au lieu de 2s), bundle JS `<12 MB` (au lieu de 8) | Guardian #5, #15 | §12.2 |
| 46 | **Marge planning révisée** : 40% (au lieu de 20%) sur chaque lot | Guardian #25, Skeptic #1 | §11 |
| 47 | **L4 Médias splitté** : L4a Caméra/Galerie (2 sem.), L4b Voice notes (2 sem.), L4c Docs/Location/Stickers (2 sem.). **Total L4 : 6 sem.** au lieu de 3 | Skeptic #17 | §11 |
| 48 | **L12 reseasoned** : 3-4 sem. (au lieu de 1-2) — App Store review + rejets fréquents (4.2 minimum functionality, demo account, Sign in with Apple) | Skeptic #22 | §11 |
| 49 | **Convex websocket fallback policy** : timeout 10s → banner "Connexion lente" + retry, queue d'envoi non bloquée | Guardian #6 | §10 |
| 50 | **Expo Push fallback documenté** : plan migration APNs direct si Expo Push outage > 4h, via Convex action `"use node"` | Guardian #7 | §9 |
| 51 | **Privacy Manifest agrégé Jokko** : section dédiée listant Sentry / PostHog / MMKV / expo-secure-store + Required Reason API codes | Guardian #3 | §12.7 |
| 52 | **ATT decision verrouillée** : `disableIdfa: true` PostHog, no cross-app tracking, no ATT prompt v1.0 | Guardian #4 | §12.7 |
| 53 | **Demo account fourni** pour App Store + Meta WABA Review (credentials dans App Store Connect) | Guardian #9 | §11 L12 |
| 54 | **Multi-tenant switch séquence documentée** + test Maestro E2E `org_switch_isolation_test.yaml` | Guardian #10 | §10.5, §12.1 |
| 55 | **PII scrubbing implémenté** : `Sentry.beforeSend` scrubber + ESLint custom rule `no-console-pii` + DPA signés | Guardian #12 | §12.5, §12.7 |
| 56 | **RGPD consent runtime** : modal first-launch (granulaire : analytics opt-in, crash mandatory) + révocation depuis Settings | Guardian #13 | L1 |
| 57 | **Idempotency Convex** : index unique `(organizationId, idempotencyKey)` sur `messages` + TTL 7j + test E2E "kill app pendant envoi" | Guardian #20 | §10.4, Convex schema |
| 58 | **Reply lock screen v1.0** : copie explicite "Tap pour ouvrir et répondre" (pas inline reply silencieux). NSE planifiée v1.1 avec spike effort | UA #10 | §9.3 |
| 59 | **Coûts opérationnels chiffrés** : tableau Convex / Apple Dev / EAS / Sentry / PostHog / OAuth Google à 100/1000/10000 users | Guardian #8 | §14 |
| 60 | **iOS 16+ justifié + comportement device non supporté** : copie d'erreur explicite + lien d'upgrade. Source Apple Developer datée. | Guardian #2 | §1.5 |

#### Décisions issues des L0 spikes

| # | Nouvelle décision | Spike source | Impact |
|---|---|---|---|
| 61 | **`packages/convex-client` indispensable dès L1** : sans isolation, l'import de `convex/_generated/api` côté mobile cause un type-check transitif sur tout le backend Convex (incompatible TS lib mobile, ex. `convex/http.ts` `FormData.get`) | S1 §4.2 | L1 |
| 62 | **Apple `sub` claim** = clé d'identité (pas l'email). Schema Convex à étendre : `users.appleUserId: v.optional(v.string())` indexé. Idem `googleSub` | S1 §4.4 | L2, schema Convex |
| 63 | **Pin Expo packages manuellement** : `pnpm add` retourne SDK 55 par défaut (`expo-apple-authentication@^55.x` ≠ SDK 54 attendu `~8.x`). Documenter dans `apps/mobile/README.md` | S1 §4.1 | L1 process |
| 64 | **`fullName` Apple capturé impérativement au premier signup** : Apple ne le re-fournit pas aux signins suivants. Save dans `users` à l'inscription | S1 §4.6 | L2 |
| 65 | **Privacy Manifest déclaratif via `app.json`** (pas de XML manuel) — Expo SDK 54+ génère le `PrivacyInfo.xcprivacy` au prebuild. Source de vérité = `ios.privacyManifests` | S2 §2.1 | L1 + ongoing |
| 66 | **Audit SDK obligatoire à chaque `pnpm add`** : vérifier que le SDK fournit son privacy manifest. SDKs sans manifest = refus à l'installation. Liste interdite : AppsFlyer, Branch, Adjust, Singular, Firebase Analytics, Meta SDK | S2 §2.3, §4.3 | Process / lint rule |
| 67 | **PostHog config `disableIdfa: true`** + `captureDeepLinks: false` + `enableSessionReplay: false` (perf + privacy v1.0) | ADR-0001 | L1 |
| 68 | **Sentry config `sendDefaultPii: false`** + `beforeSend` scrubber strip emails / phone / message bodies | ADR-0001 | L1 |
| 69 | **Consent runtime granulaire** : Crash reporting = legitimate interest (default on, opt-out possible). Analytics PostHog = opt-in (default off). Modal au first launch + Settings page | ADR-0001 + Decision #56 | L1 |
| 70 | **Charles Proxy audit en L12** : valider 0 call vers domaines de tracking publicitaires (doubleclick, facebook, branch.io, adjust, singular) avant submission App Store | S3 §3.3 | L12 |
| 71 | **`NSPrivacyTracking: false`** verrouillé v1.0. Ré-évaluation requise si acquisition payante mobile devient un canal stratégique (créer ADR-0002 si déclenché) | ADR-0001 §Trigger | Stratégie |
| 72 | **`switchOrg()` séquence canonique 9 étapes** : confirm queue → snapshot keys → purge cache → reset stores → close Convex → clear secure → set new token → audit. Pas de raccourci | S5 §2 | L1 |
| 73 | **Re-mount `<ConvexProvider key={orgId}>`** au switch, pour forcer le démontage de toutes les subscriptions React (impossible autrement à fond) | S5 §4.3 | L1 |
| 74 | **Convention naming MMKV** : `jokko.<orgId>.<scope>.<key>` — purge sélective par préfixe au switch au lieu de `clearAll()` qui détruirait `jokko.global.*` (langue, theme, etc.) | S5 §5.3 | L1 + ADR-0002 |
| 75 | **Vider `expo-file-system/cache/`** au switchOrg (médias téléchargés en cache disque) — étape supplémentaire à ajouter à la séquence | S5 §4.4 | L1 |
| 76 | **`detectOrgLeak()` en breadcrumb Sentry** après chaque switch — alerte si leak détecté en prod | S5 §2 + production | L1 + observability |
| 77 | **Lock mutex sur `switchOrg()`** pour éviter 2 switches concurrents (race condition possible via UI multi-tap rapide) | S5 §4.5 | L1 |
| 78 | **Maestro E2E `org_switch_isolation_test.yaml`** obligatoire avant beta — scénario draft offline + switch + assertions no-leak | S5 §5.2 + Decision #54 | L12 |

### 17.4 Planning révisé (avec marge 40% + L0 spikes)

```
L0 — Spikes pré-L1 (S1-S8)            ~3-4 sem.
L1 — Bootstrap & design system        ~3-4 sem.   (+RGPD modal, lint i18n)
L2 — Auth & onboarding org            ~3-4 sem.   (+banner WA persistant)
L3 — Inbox + thread + signature       ~4 sem.     (+drafts, snooze, undo, 24h window)
L4a — Caméra / Galerie                ~2 sem.
L4b — Voice notes                     ~2 sem.
L4c — Docs / Location / Stickers      ~2 sem.
L5 — Réactions, replies, GlassReply   ~3 sem.
L6 — Push & smart routing             ~3-4 sem.
L7 — Contacts                         ~3 sem.
L8 — Search global + Notifs + Modèles ~3 sem.     (élargi vs original)
L9 — Profil & Settings                ~2 sem.
L10 — Offline robustness              ~3-4 sem.   (+1s banner, switch flush)
L11 — i18n EN audit                   ~1-2 sem.   (allégé car lint actif L1)
L12 — Beta + App Store submission     ~3-4 sem.   (+demo account, rejets prévus)

Total v1.0 : ~10-11 mois solo (au lieu de 6-7).
```

**Implication** : la parité totale (v1.0 + v1.1 + v1.2) est repoussée à **~16-20 mois** au total. Décision : on assume cette nouvelle estimation, le projet reste sans deadline dure.

### 17.5 Objections rejetées avec rationale

| # | Objection | Rationale du rejet |
|---|---|---|
| Skeptic #11 | FlashList "10k+ rows" inutile | **Rejet partiel** : on garde FlashList (gratuit en effort, future-proof v1.1+ quand orgs B2B grandissent). On ne sur-optimise pas v1.0. |
| Skeptic #18 | Animations signature = motion sickness Apple Review | Reduce Motion fallback déjà spécifié (Decision #28 v1). Rejet : risque non démontré. |
| Skeptic #25 | Spikes inexistants (faisabilité non prouvée) | Les fichiers existent : `apps/mobile/src/GlassReply.tsx`, `InboxBreathing.tsx`, `ComposeMorph.tsx` (vérifié par Explore agent en phase 1 brainstorming). Rejet de l'objection. |
| Skeptic #21 | Stratégie migration v1.0 → v1.1 absente | **Rejet partiel** : tab "Hub" sera renommée et ré-organisée à v1.1 (Decision #32). Pas de feature flag complexe car solo dev. ADR pour documenter. |
| UA #20 | Voice transcription en v1.0 | Coût Whisper API + complexité hors scope v1.0. Reportée v1.1 (ADR à créer). |
| UA #21 | Quick replies / canned responses v1.0 | Modèles WhatsApp officiels couvrent le hors-fenêtre. Quick replies personnels = nice-to-have v1.1. |
| UA #17 | Présence/typing indicator opt-out | Toggle dans Settings → reportable v1.1. v1.0 : présence on par défaut, conforme attentes WhatsApp natif. |
| UA #19 | Reduce Motion alternative tactile/sonore | Out of scope v1.0 — fade simple + haptics existants suffisent WCAG AA. |
| Guardian #11 | Politique rotation tokens auth | Convex auth handle déjà refresh. Documenter la politique (TTL session 30j) suffit. |
| Guardian #17 | Storybook v1.0 obligatoire | **Rejet** : maintenance solo trop lourde. Snapshot tests RN Testing Library couvrent visual regressions. ADR. |
| Guardian #18 | ADRs avant L1 | **Rejet partiel** : 5 ADRs critiques avant L2 (auth, state, cache, push, monorepo) au lieu de avant L1. |
| Guardian #21 | Cache MMKV 100 MB OOM | Mesure ajoutée à L10 plutôt qu'avant. Risque tolérable v1.0. |

### 17.6 Déférées v1.1+ (documentées)

- Notification Service Extension (inline reply silencieux)
- Voice transcription Whisper (opt-in)
- Quick replies / canned responses personnels
- Biometric lock (FaceID/TouchID)
- Certificate pinning
- Custom sticker packs
- Recherche avancée avec filtres
- Stickers custom organisation
- Présence/typing indicator opt-out
- ATT prompt si tracking ajouté
- ADRs complets (5 critiques avant L2, le reste au fil de l'eau)

### 17.7 Decision Log final — version 3 (post-multi-agent + post-spikes L0)

Total décisions verrouillées : **78** (30 v1 + 30 review multi-agent + 18 spikes L0).

L'intégralité des 78 décisions vit dans ce document (Decision Log §3 pour 1-30, §17.3 pour 31-78).

---

## 18. Disposition Arbiter

### 18.1 Verdict

**`APPROVED`** — avec conditions de monitoring sérieuses pendant L0.

### 18.2 Rationale

Le Primary Designer a traité de manière sérieuse et structurée les 72 objections soulevées par les 3 reviewers. Le passage de 6-7 mois à 10-11 mois avec marge 40% montre une honnêteté intellectuelle absente du design v1. Les 8 spikes L0 couvrent correctement les risques bloquants compliance/légaux (Apple, RGPD, App Store) qui auraient rendu v1.0 non-livrable. Les rejets sont argumentés. Aucune contradiction interne fondamentale. Le design est implémentable en l'état.

### 18.3 Forces du design (post-révision)

- **Spikes L0 prioritaires bien ciblés** (S1-S6 bloquants Apple/RGPD/App Store ; S7-S8 fallback acceptable)
- **Honnêteté du planning** : marge 40%, L4 splitté, L12 doublé. 10-11 mois solo crédible
- **Compliance multi-tenant explicitée** : Decision #54 + #55 + #57 forment un trio cohérent
- **Server-side enforcement WhatsApp 24h** (Decision #40) : défense en profondeur
- **UX rationalisée** : drafts (#34), undo (#36), snooze avec retour (#35), bandeau 1s (#38)

### 18.4 Faiblesses résiduelles acceptées

- **Reply lock screen v1.0 = ouvre l'app** : dégrade vs concurrents, NSE reportée v1.1 explicitement
- **Pas de Storybook ni Detox** : maintenance solo justifie ; snapshot tests + Maestro suffisent
- **Cache 100 MB OOM mesure tardive** (L10) : tolérable car volumes v1.0 modérés
- **iOS 16+ uniquement** : exclut frange pro, comportement de fallback documenté (#60)
- **Spike S7 voice notes "non bloquant"** : waveform statique acceptable comme fallback

### 18.5 Risques clés à surveiller pendant l'implémentation

1. **Spike S1 (Apple Sign In + Convex custom provider)** : si > 2 sem., ré-arbitrer (fallback Apple-only `@convex-dev/auth` extension ou demander support Convex). Guideline 4.8 = blocage submission.
2. **Dérive planning L4** : voice notes (L4b) à risque si capture audio native pose problème. Burndown lot par lot dès L4a.
3. **Multi-tenant fuite cross-org** : `useCurrentOrg()` portage à valider par audit code dès L1. Test E2E dans CI dès L2.
4. **Coûts Convex à scale** : websocket persistant mobile peut exploser compute. Budget-check fin L6.
5. **App Store rejets en cascade** : 4.2 + Sign in with Apple + demo account peuvent enchaîner 3-4 cycles de 5-10 jours. Préparer la réponse Apple Review en avance.

### 18.6 Recommandations finales

- **Ne pas démarrer L1 avant la fin des 6 spikes bloquants S1-S6** (S7, S8 en parallèle OK).
- **Créer les 5 ADRs critiques avant L2** (auth, state, cache, push, monorepo).
- **Démos hebdomadaires perso** ; absence de démo une semaine = signal rouge burnout.
- **Spike S5 cache purge à 100% avant beta** : risque CNIL = arrêt entreprise.
- **Open questions §14 à clore avant L6** : Convex budget, Whisper coût, NSE ROI.
- **Consigner les rejets dans ADRs** (Storybook, transcription, quick replies, présence opt-out).

---

## 19. Validation finale (post-Arbiter)

- ✅ Toutes objections (72) résolues ou explicitement rejetées avec rationale
- ✅ Decision Log v3 complet (78 décisions verrouillées — 30 v1 + 30 review + 18 spikes L0)
- ✅ L0 spikes listés et chiffrés (S1-S8, ~3-4 sem.)
- ✅ Disposition Arbiter : **APPROVED**
- ✅ Planning révisé avec marge 40% (~10-11 mois v1.0, ~16-20 mois parité totale)
- ✅ Risques et recommandations consignés (§18.5, §18.6)

**Le design passe à l'implémentation. Le projet peut démarrer L0 (spikes pré-L1).**
