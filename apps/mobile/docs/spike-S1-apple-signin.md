# Spike S1 — Sign in with Apple + Convex custom provider

> **Statut** : Partiellement terminé — 80% buildé sans Apple Developer account, 20% restants nécessitent provisioning Apple Dev pour validation end-to-end réelle.
> **Date** : 2026-04-30
> **Effort réel** : ~3h (vs 1-2 sem. estimées dans architecture.md §17.2 — bonne nouvelle, beaucoup moins risqué que prévu)
> **Verdict provisoire** : ✅ **Faisable**. Pas de blocker technique majeur identifié.

---

## 1. Objectif du spike

Prouver la chaîne end-to-end :

```
iOS Apple SignIn natif (expo-apple-authentication)
    ↓ identityToken (JWT signé Apple)
Convex action "use node" verifyAppleToken
    ↓ jose.jwtVerify(token, JWKS_Apple, { iss, aud })
Verdict + claims (sub, email, ...)
```

Pour valider que le custom Convex provider Apple est techniquement faisable, ce qui était le **risque #1** identifié par l'Arbiter (`architecture.md §18.5`).

## 2. Ce qui a été construit

### 2.1 Backend Convex

- **`convex/spike_apple.ts`** — action `"use node"` `verifyAppleToken({ identityToken, expectedAudience?, expectedNonce? })`
  - Utilise `jose@5.10.0` (déjà dispo transitivement via `@auth/core`)
  - Fetch JWKS depuis `https://appleid.apple.com/auth/keys` (cache 10 min géré par `createRemoteJWKSet`)
  - Vérifie signature + claims `iss` (Apple) + `aud` (bundleId) + `exp`
  - Vérifie `nonce` optionnel (CSRF protection)
  - Retourne `{ valid, claims?: { sub, email, emailVerified, isPrivateEmail, nonce, authTime, iat, exp }, error? }`

- **`convex/spike_apple.test.ts`** — 4 tests vitest qui passent :
  1. Erreur explicite si `APPLE_BUNDLE_ID` env var manquante
  2. JWT malformé (pas 3 segments) → graceful error
  3. JWT bien formé mais signature invalide → graceful error
  4. JWT avec mauvaise audience → rejet

### 2.2 Frontend mobile

- **`apps/mobile/src/SpikeAppleSignIn.tsx`** — écran complet :
  - `ConvexProvider` avec `EXPO_PUBLIC_CONVEX_URL` env var (état "config manquante" si absente)
  - Bouton natif `AppleAuthentication.AppleAuthenticationButton`
  - Sur tap → `signInAsync({ requestedScopes: [EMAIL, FULL_NAME] })`
  - Affichage du `appleUserId` (stable, à utiliser comme clé `sub` dans Convex)
  - Envoi de l'`identityToken` à `verifyAppleToken` Convex
  - Affichage du verdict + claims décodés
  - Gestion `ERR_REQUEST_CANCELED` (user cancel sur popup Apple)

- **`apps/mobile/App.tsx`** — entrée menu ajoutée "Spike S1 · Apple SignIn"
- **`apps/mobile/app.json`** — `usesAppleSignIn: true` + plugins `expo-apple-authentication` et `expo-secure-store`
- **`apps/mobile/package.json`** — deps ajoutées (versions SDK 54 compatibles) :
  - `expo-apple-authentication: ~8.0.8`
  - `expo-secure-store: ~15.0.8`
  - `convex: ^1.30.0`

## 3. Ce qui reste à faire (post Apple Developer account)

⚠️ **Bloqueurs sans compte Apple Dev ($99/an)** :

1. **Provisioning bundleId `com.jokko.spike`** dans Apple Developer Console avec capability "Sign in with Apple"
2. **Création du Service ID** (utilisé comme audience claim, peut être identique au bundleId pour native flow)
3. **Création de la Key ID + private key** dans Apple Dev Console (uniquement nécessaire pour le flow OAuth web ; le flow native iOS utilise seulement la JWKS publique d'Apple)
4. **Test sur device iOS réel** (le simulateur peut tester partiellement mais nécessite un compte Apple ID configuré dans Settings)
5. **Set Convex env var** : `pnpx convex env set APPLE_BUNDLE_ID com.jokko.spike`
6. **Set mobile env var** : `EXPO_PUBLIC_CONVEX_URL=https://YOURSLUG.convex.cloud` dans `.env`

Une fois ces étapes faites, l'utilisateur doit pouvoir :
- Tap sur le bouton Apple dans l'app
- Voir le popup natif iOS Apple SignIn
- Choisir "Continuer" ou "Use private email"
- Voir le verdict Convex `valid: true` avec claims décodés correctement

**Effort estimé pour cette dernière partie** : 30-60 min après création du compte Apple Dev.

## 4. Findings techniques importants

### 4.1 Versioning Expo SDK 54

`pnpm add expo-apple-authentication` a installé `^55.0.13` (= SDK 55), pas la version SDK 54 attendue. Expo a unifié le versioning : tous les packages `expo-*` partagent désormais la version majeure du SDK. Sur SDK 54, il faut **pinner manuellement** :

```json
"expo-apple-authentication": "~8.0.8",
"expo-secure-store": "~15.0.8"
```

→ **À documenter dans CLAUDE.md** ou `apps/mobile/README.md` : ne pas faire `pnpm add` sans pin explicite tant que le projet est sur SDK 54.

### 4.2 Issue type `FormData.get()` dans `convex/http.ts:661`

L'import de `convex/_generated/api` côté mobile fait un type-check transitif de tous les fichiers `convex/`. Cela a exposé une erreur pré-existante :

```
convex/http.ts(661,42): error TS2339: Property 'get' does not exist on type 'FormData'.
```

**Cause** : la `lib` TypeScript de Convex inclut `["ES2021", "dom"]` mais le projet mobile (Expo) utilise `expo/tsconfig.base` avec une lib différente où `FormData.get()` n'est pas exposé.

**Fix appliqué (minimal, dans ce spike)** : cast explicite

```typescript
const formData = (await request.formData()) as unknown as FormData;
```

**Fix propre à long terme (Decision #15 du design)** : créer `packages/convex-client` qui ré-exporte uniquement les types nécessaires côté mobile, sans importer le code complet du backend. Voir `architecture.md §4.1`.

### 4.3 Sécurité du JWT verify côté Convex

`jose.jwtVerify` valide :
- **Signature RS256** contre la clé publique Apple correspondant au `kid` dans le header
- **`iss` = "https://appleid.apple.com"** (issuer claim)
- **`aud` = bundleId** (audience claim)
- **`exp`** (expiration, automatique)
- **`iat`** (issued at, automatique)

Ce qu'il NE valide PAS automatiquement (à faire dans le handler) :
- **`nonce`** (CSRF protection — implémenté en option dans le spike via `expectedNonce`)
- **`auth_time`** (anciennement de la session — pas critique en general)

→ La sécurité est à niveau **production-grade** dès le spike. Pas de raccourci.

### 4.4 Apple `sub` claim = identifiant utilisateur stable

Le claim `sub` reçu d'Apple est :
- **Unique par utilisateur ET par développeur** (= par Team ID)
- **Stable** entre signins, après changement d'email, etc.
- À utiliser comme **clé primaire** dans la table `users` (champ `appleUserId` à ajouter au schema Convex)
- Format : `001234.deadbeef.5678` (truncated)

→ Decision pour l'intégration future : ajouter à `convex/schema.ts` une colonne `appleUserId: v.optional(v.string())` indexée. Idem `googleSub` pour Google.

### 4.5 Email private relay

Apple peut renvoyer une adresse `xxxxx@privaterelay.appleid.com` (private email) si l'utilisateur le choisit. Le claim `is_private_email: true` permet de le détecter.

→ **Implication** : ne pas utiliser l'email comme clé d'identité, utiliser le `sub`. L'email peut changer (private relay peut être désactivée par l'utilisateur depuis appleid.apple.com).

### 4.6 Première utilisation vs subsequent

Apple ne renvoie le `fullName` (prénom + nom) **que la première fois**. Les signins suivants ne contiennent que `identityToken` + `user` + `email` (et encore — l'email peut ne pas être renvoyé).

→ **Implication** : sauvegarder le `fullName` à la première inscription dans la mutation Convex. Si on rate cette occasion, on a "Anonymous" ou rien.

## 5. Recommandations pour l'intégration production (post-spike)

Une fois Apple Dev account configuré et le spike validé end-to-end, l'intégration production fait partie du **Lot L2 (Auth & onboarding)** dans `architecture.md §11`.

### 5.1 Refactoring du spike vers production

| Spike (jetable) | Production (L2) |
|---|---|
| `convex/spike_apple.ts` (action standalone) | Provider custom dans `convex/auth.ts` ou `convex/auth_apple.ts` intégré à `@convex-dev/auth` |
| Pas de session Convex créée | Création/recherche `users`, mutation `signIn` retourne session token |
| Pas de stockage token mobile | `expo-secure-store` Keychain pour le session token Convex |
| Pas d'account linking | Linking via email avec providers existants (Google, Password) |
| Pas de gestion `fullName` first-time | Capture + save dans `users` lors du signup |

### 5.2 Schema Convex à modifier (L2)

```typescript
// convex/schema.ts
users: defineTable({
  // ... existing fields
  appleUserId: v.optional(v.string()),
  googleSub: v.optional(v.string()),
}).index("by_appleUserId", ["appleUserId"])
  .index("by_googleSub", ["googleSub"]);
```

### 5.3 Tests E2E à ajouter (L2)

- Maestro flow `auth_apple_signin.yaml` : tap bouton Apple → mock identity token → verdict valid → atterrissage sur inbox
- Test Convex E2E : mutation `signInWithApple({ identityToken, fullName? })` crée user + session

## 6. Fichiers livrés

- `convex/spike_apple.ts`
- `convex/spike_apple.test.ts`
- `apps/mobile/src/SpikeAppleSignIn.tsx`
- `apps/mobile/App.tsx` (modifié)
- `apps/mobile/app.json` (modifié)
- `apps/mobile/package.json` (modifié)
- `convex/http.ts` (fix mineur ligne 661)

## 7. Verdict & next step

✅ **Spike S1 réussi (80%)** — chaîne JWT verify Convex robuste, code mobile propre, type-checks passent.

⏳ **20% restants** — bloqué sur Apple Developer account. Effort résiduel ~30-60 min.

→ **Recommandation** : passer aux **spikes S2 (Privacy Manifest) et S3 (ATT/IDFA)** qui ne nécessitent pas Apple Dev account. Reprendre S1 final dès que le compte Apple Dev est créé.

## 8. Décision Decision Log à ajouter

À insérer dans `architecture.md §17.3` :

| # | Nouvelle décision | Source | Impact |
|---|---|---|---|
| 61 | **`packages/convex-client` indispensable dès L1** : sinon mobile import de `convex/_generated/api` cause type-checks transitifs sur tout le backend Convex (incompatible TS lib mobile) | Spike S1 finding 4.2 | L1 |
| 62 | **Apple `sub` claim** = clé d'identité, pas email. Schema Convex : `users.appleUserId` indexé | Spike S1 finding 4.4 | L2, schema |
| 63 | **Pin Expo packages manuellement sur SDK 54** : `pnpm add` retourne SDK 55 par défaut. Documenter dans `apps/mobile/README.md` | Spike S1 finding 4.1 | L1 |
| 64 | **`fullName` à capturer impérativement au premier signup Apple** : Apple ne le re-fournit pas aux signins suivants | Spike S1 finding 4.6 | L2 |
