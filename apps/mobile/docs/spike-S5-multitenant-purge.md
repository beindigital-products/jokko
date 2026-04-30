# Spike S5 — Multi-tenant cache purge sequence

> **Statut** : ✅ Algorithme validé en TypeScript pur (10/10 tests passants), wiring production prévu en L1.
> **Date** : 2026-04-30
> **Effort réel** : ~1h (vs 3 jours estimés dans `architecture.md §17.2`)
> **Verdict** : ✅ Faisable, séquence robuste. Risque RGPD n°1 (Arbiter §18.5) maîtrisé conceptuellement.

---

## 1. Objectif

Démontrer qu'un `switchOrg(fromOrgId, toOrgId)` purge **intégralement** :
- Cache MMKV (snapshot inbox, drafts, prefs locales)
- Stores Zustand (in-memory + persistance)
- Subscriptions Convex actives (déconnexion + clear auth)
- Token de session dans `expo-secure-store` (Keychain)

Sans laisser **aucune trace** de l'org A accessible quand l'utilisateur est sur l'org B. Critique RGPD : multi-tenant SaaS B2B où les conversations / contacts / docs d'une org NE doivent JAMAIS apparaître dans une autre.

## 2. Algorithme livré

`apps/mobile/src/lib/multitenant.ts` : fonction `switchOrg()` avec des **interfaces abstraites** pour le storage (KeyValueStorage, SecureTokenStorage, ConvexClientLike, PersistedStore). Production peut injecter MMKV / expo-secure-store / ConvexReactClient sans toucher l'algorithme.

### Séquence canonique (8 étapes)

```
1. Si fromOrgId === toOrgId → no-op (return early)
2. Si hasInflightQueue → demander confirmation utilisateur
   - User refuse → return { success: false, reason: 'user_cancelled' }
3. Snapshot des keys MMKV avant purge (audit / breadcrumb Sentry)
4. cacheStorage.clearAll()       — MMKV vidé
5. Pour chaque store Zustand :
   - persist?.clearStorage()      — vide la persistance MMKV/AsyncStorage
   - setState({})                 — reset in-memory
6. convexClient.clearAuth()       — déconnexion auth
   convexClient.close()           — ferme websocket + cancel subscriptions
7. secureStorage.deleteItemAsync('jokko.session_token')
8. Si toOrgToken fourni :
   - secureStorage.setItemAsync('jokko.session_token', toOrgToken)
   - convexClient.setAuth(toOrgToken)
9. Vérification finale : cacheStorage.getAllKeys() === [] sinon return purge_incomplete
```

### Audit anti-leak

Helper `detectOrgLeak(cacheStorage, secureSnapshot, forbiddenOrgId)` qui scanne **toutes** les valeurs et retourne `{ leaked: true, foundIn: [...] }` si un identifiant d'org "interdit" apparaît quelque part.

→ **Production** : à appeler après chaque `switchOrg()` et envoyer breadcrumb Sentry. Si `leaked === true`, alerter immédiatement (incident sécurité).

## 3. Tests livrés (10/10 passants)

`apps/mobile/src/lib/multitenant.test.ts` :

| # | Test | Vérifie |
|---|---|---|
| 1 | Happy path — full purge + new token | Cache vidé, stores reset, Convex reauth, secure store mis à jour |
| 2 | User cancel sur in-flight queue | Aucune purge, état préservé entièrement |
| 3 | User confirme flush sur in-flight queue | Purge complète déclenchée |
| 4 | No-op si `fromOrgId === toOrgId` | Aucune action |
| 5 | Pas de toOrgToken fourni | Secure store cleared, pas de nouveau token |
| 6 | `detectOrgLeak` trouve résidu cache | Détection positive sur key partielle |
| 7 | `detectOrgLeak` clean après switch | Audit OK quand seules données toOrg restent |
| 8 | `detectOrgLeak` trouve résidu secure store | Détection positive cross-storage |
| 9 | **Régression — full switch + audit** | Switch puis audit : zero leak (test critique RGPD) |
| 10 | Store reset failure → purge_incomplete | Erreur remontée avec détails utilisables |

## 4. Findings techniques importants

### 4.1 Confirmer-flush sur in-flight queue : pourquoi c'est critique

Si l'utilisateur a tapé un message qui n'est pas encore parti (offline ou réseau lent), la queue contient un payload **lié à org A**. Switcher vers org B sans confirmation = perte silencieuse du message + risque que le message parte plus tard sur le mauvais channel.

→ Décision verrouillée (#43 architecture.md) : **toujours demander confirmation** avant purge si queue non vide. Implémenté tel quel.

### 4.2 Ordre des étapes — pourquoi cet ordre

L'ordre **MMKV → Zustand → Convex → SecureStore → setNew** est volontaire :

- **MMKV en premier** : la persistance est sur disque, prioritaire (visible si app crash).
- **Zustand après** : in-memory state qui peut référencer des keys MMKV.
- **Convex avant secure** : déconnexion HTTP/WS d'abord pour éviter qu'un callback tardif réécrive en cache.
- **SecureStore en dernier des "purges"** : contient le token, signal final d'invalidation.
- **setNew tout à la fin** : on ne pose le nouveau token QUE si toutes les purges ont réussi.

Inverser cet ordre risque des **race conditions** où un callback Convex écrit en MMKV juste après le `clearAll()`.

### 4.3 Pourquoi un `close()` Convex client n'est pas suffisant

`ConvexReactClient` n'expose pas de `close()` explicite. Il faut :
1. Appeler `setAuth(null)` ou `clearAuth()` (déclenche unsubscribe des queries authentifiées)
2. Détacher le provider React (re-mount de l'arbre `<ConvexProvider>` avec un nouveau client)

→ **Implication production (L1)** : l'app racine re-monte le ConvexProvider à chaque switchOrg via une `key` qui change. Pattern :

```tsx
<ConvexProvider client={convexClient} key={currentOrgId}>
  <App />
</ConvexProvider>
```

Ce pattern force React à démonter/remonter tout le sous-arbre, garantissant zero subscription résiduelle. Coût : un flash de loading state au switch — acceptable pour la sécurité.

### 4.4 Limites de l'audit `detectOrgLeak`

Il détecte les **strings explicites** contenant l'orgId. Limites :
- Si une donnée est encodée différemment (hash, base64) ou ne contient pas l'orgId mais est contextuellement liée → non détecté.
- Données dans `expo-file-system` (cache disque médias) → non scannées par cet helper.

→ **Mitigation production (L1)** :
- Préfixer **toutes** les keys MMKV par `jokko.<orgId>.<...>` pour permettre un scan exhaustif.
- Vider `expo-file-system/cache/` au `switchOrg` (à ajouter à la séquence).
- ADR à créer : "Convention de naming des keys MMKV — orgId préfixé obligatoire".

### 4.5 Ce qui n'est PAS testé en spike

- **Vrai MMKV** : utilise mmap natif iOS, non testable en vitest node env. À tester via Maestro E2E ou tests Jest/Detox sur device.
- **Vrai expo-secure-store** : Keychain natif iOS. Idem.
- **Vrai ConvexReactClient** : nécessite environnement React Native + websocket. À tester via test E2E.
- **Race conditions concurrentes** : 2 switchOrg() lancés en parallèle. À ajouter en L1 (lock mutex).

## 5. Plan d'intégration production (L1)

### 5.1 Création package `packages/convex-client`

Dossier à créer en L1 (Decision #15 + #61 architecture.md) :

```
packages/convex-client/
  src/
    index.ts                 # exports publics
    multitenant.ts           # switchOrg() (refactor depuis apps/mobile/src/lib/)
    multitenant.test.ts      # tests (déplacés)
    providers/
      MMKVStorage.ts         # adaptateur KeyValueStorage → MMKV
      SecureStorage.ts       # adaptateur SecureTokenStorage → expo-secure-store
      ConvexClient.ts        # adaptateur ConvexClientLike → ConvexReactClient
    hooks/
      useCurrentOrg.ts       # hook React Native (port du web)
      useSwitchOrg.ts        # hook qui wrappe switchOrg + UI confirmation
  package.json
  tsconfig.json
```

### 5.2 Maestro E2E test obligatoire

Decision #54 architecture.md prescrit `org_switch_isolation_test.yaml`. Scénario :

```yaml
appId: com.jokko.spike
---
# 1. Login org A
- launchApp
- tapOn: "Sign in with Apple"
- # ... auth flow
- waitFor: "Inbox"

# 2. Open conversation, type draft, kill keyboard (in queue offline)
- tapOn: "Conv with @client_orgA"
- tapOn:
    id: "composer-input"
- inputText: "Brouillon org A"
- # network off (simulate)

# 3. Switch to org B
- tapOn:
    id: "org-switcher"
- tapOn: "org_B"
- tapOn: "Confirmer (perdre brouillon)"

# 4. Verify NO trace of org A
- waitFor: "Inbox org B"
- assertNotVisible:
    text: "Brouillon org A"
- assertNotVisible:
    text: "Conv with @client_orgA"
```

### 5.3 Convention de naming des keys MMKV

ADR à créer en L1 :

```
jokko.<orgId>.<scope>.<key>

Exemples :
  jokko.org_A.inbox.snapshot
  jokko.org_A.draft.conv1
  jokko.org_A.queue.pending
  jokko.global.prefs.lang     # global, non lié à une org (préservé au switch)
```

Pattern de purge : `getAllKeys().filter(k => k.startsWith('jokko.${orgId}.')).forEach(delete)`. Ce pattern remplace `clearAll()` qui purge **tout**, y compris `jokko.global.*` (langue, theme, etc. — devraient survivre au switch).

→ **Decision à ajouter** : `clearAll()` en spike est trop agressif. Production = purge sélective par préfixe orgId.

## 6. Fichiers livrés

- `apps/mobile/src/lib/multitenant.ts` — algorithme + interfaces + `detectOrgLeak`
- `apps/mobile/src/lib/multitenant.test.ts` — 10 tests vitest
- `vitest.config.ts` — modifié pour inclure `apps/mobile/src/lib/**/*.test.ts`

## 7. Verdict & next step

✅ **Spike S5 réussi** — algorithme robuste, séquence en 9 étapes documentée, anti-leak audit fourni, 10 tests passants y compris régression critique RGPD.

**Risque résiduel** : production-wiring sur vrai MMKV / Keychain non testé. À couvrir en L1 + Maestro E2E.

→ **Recommandation** : passer à **S6 (PII scrubbing technique)** ou **S8 (Convex websocket fallback)**. S6 a déjà été partiellement esquissé dans ADR-0001 (Sentry config).

## 8. Décisions Decision Log à ajouter dans `architecture.md §17.3`

| # | Nouvelle décision | Source | Impact |
|---|---|---|---|
| 72 | **`switchOrg()` séquence canonique 9 étapes** : confirm queue → purge cache → reset stores → close Convex → clear secure → set new token → audit | Spike S5 §2 | L1 |
| 73 | **Re-mount `<ConvexProvider key={orgId}>`** au switch, pour forcer le démontage de toutes les subscriptions (pattern React) | Spike S5 §4.3 | L1 |
| 74 | **Convention naming MMKV** : `jokko.<orgId>.<scope>.<key>` — purge sélective par préfixe au lieu de `clearAll()` | Spike S5 §5.3 | L1 + ADR |
| 75 | **Vider `expo-file-system/cache/`** au switchOrg (médias téléchargés) | Spike S5 §4.4 | L1 |
| 76 | **`detectOrgLeak()` en breadcrumb Sentry** après chaque switch — alerte si leak détecté | Spike S5 §2 + production | L1 + observability |
| 77 | **Lock mutex sur switchOrg()** pour éviter 2 switches concurrents | Spike S5 §4.5 | L1 |
| 78 | **Maestro `org_switch_isolation_test.yaml`** obligatoire avant beta | Spike S5 §5.2 + Decision #54 | L12 |
