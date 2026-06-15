# Spike S6 — PII scrubbing technique

> **Statut** : Termine cote code. DPA Sentry/PostHog = action owner hors repo avant release.
> **Date** : 2026-05-01
> **Objectif** : empecher que des donnees personnelles quittent l'app via Sentry, breadcrumbs, logs console ou analytics/debug accidentels.

---

## 1. Objectif du spike

S6 leve le risque RGPD identifie dans `architecture.md §17.2` :

- Les crashes mobile peuvent contenir des emails, numeros de telephone, contenus de messages WhatsApp, tokens ou payloads HTTP.
- Les breadcrumbs console peuvent persister des logs crees avant le crash.
- Les devs peuvent accidentellement ajouter `console.log(customerPhone)` ou `console.log({ text })`.

Le resultat attendu est un garde-fou en trois couches :

1. scrubber Sentry `beforeSend` / `beforeBreadcrumb` ;
2. configuration Sentry privacy baseline ;
3. regle ESLint locale `jokko/no-console-pii`.

---

## 2. Implementation livree

### 2.1 Scrubber Sentry

Fichier : `apps/mobile/src/lib/pii-scrubber.ts`

Le scrubber redige :

- emails ;
- numeros de telephone FR/internationaux ;
- IDs WhatsApp `wamid.*` ;
- `user.email`, `user.username`, `user.ip_address` ;
- headers `Authorization`, `Cookie`, `X-Api-Key` ;
- cles sensibles `password`, `secret`, `token`, `authorization`, `cookie` ;
- corps de messages via cles `body`, `text`, `message_body`, `content` ;
- `request.url`, `request.data`, breadcrumbs, `extra`, `tags`, `contexts`, `exception.values`.

Le scrubber preserve les ids techniques utiles (`user.id`, `conversationId`, `orgId`) pour debugger sans contenu personnel.

### 2.2 Config Sentry privacy

Fichier : `apps/mobile/src/lib/sentry-privacy.ts`

`buildSentryPrivacyConfig()` retourne une config prete a passer a `Sentry.init` en L1 :

```ts
Sentry.init(buildSentryPrivacyConfig({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.EXPO_PUBLIC_ENV,
  release: Constants.expoConfig?.version,
}));
```

Parametres verrouilles :

- `sendDefaultPii: false`
- `beforeSend: scrubPii`
- `beforeBreadcrumb: scrubBreadcrumb`
- Sentry desactive par defaut si aucun DSN n'est fourni
- `tracesSampleRate` par defaut a `0.05`

Le fichier ne depend pas encore de `@sentry/react-native` pour ne pas forcer l'installation native avant L1.

### 2.3 Regle ESLint custom

Fichiers :

- `apps/mobile/eslint-rules/no-console-pii.cjs`
- `apps/mobile/eslint.config.mjs`
- script `pnpm --filter @jokko/mobile lint`

La regle bloque les `console.log/info/warn/error/debug/trace` si un argument ressemble a de la PII :

- string literal avec email / telephone / `wamid.*` ;
- variable sensible (`customerPhone`, `recipientEmail`, `authToken`, `messageBody`, `content`, etc.) ;
- object literal avec cles sensibles (`{ text }`, `{ content }`, `{ token }`) ;
- template literal avec expression sensible ;
- spread object dans un log (`console.log({ ...contact })`).

Les ids techniques restent autorises : `conversationId`, `messageId`, `organizationId`, `retryCount`, `status`.

---

## 3. DPA Sentry / PostHog

Le code ne peut pas signer les DPA a la place du owner.

Decision S6 :

- les DPA Sentry et PostHog sont un **release gate L12** ;
- la preuve de signature doit vivre hors repo (ex : Drive/Notion juridique), pas dans Git ;
- tant que les DPA ne sont pas signes, Sentry/PostHog peuvent etre configures techniquement mais la release publique reste bloquee.

Checklist owner avant beta publique :

1. Signer le DPA Sentry pour l'organisation Jokko.
2. Signer le DPA PostHog ou confirmer le mode EU/self-hosted retenu.
3. Stocker les preuves hors repo.
4. Renseigner App Store Privacy Nutrition Label avec les donnees réellement collectees.

---

## 4. Verification

Commandes executees :

```bash
pnpm exec vitest run apps/mobile/src/lib/pii-scrubber.test.ts apps/mobile/src/lib/sentry-privacy.test.ts apps/mobile/src/lib/no-console-pii-rule.test.ts
pnpm --filter @jokko/mobile lint
pnpm --filter @jokko/mobile typecheck
pnpm exec vitest run
pnpm -r typecheck
```

Resultat :

- S6 tests cibles : 27 tests passants.
- Suite Vitest complete : 251 tests passants.
- Lint mobile : OK.
- Typecheck mobile : OK.
- Typecheck workspace : OK.

---

## 5. Decisions ajoutees

| # | Decision | Impact |
|---|---|---|
| 85 | Scrubber Sentry unique `scrubPii` + `scrubBreadcrumb`, utilise en `beforeSend` et `beforeBreadcrumb`. | L1 |
| 86 | `sendDefaultPii: false` est non-negociable ; Sentry reste desactive sans DSN. | Privacy |
| 87 | Les corps de messages (`body`, `text`, `content`, `message_body`) sont redactes en entier, pas seulement par regex. | RGPD |
| 88 | Regle `jokko/no-console-pii` active dans `apps/mobile/eslint.config.mjs`. | Dev safety |
| 89 | Les ids techniques (`conversationId`, `messageId`, `organizationId`) restent loggables si necessaire. | Debuggability |
| 90 | DPA Sentry/PostHog = release gate owner hors repo, pas un artefact Git. | Compliance |

---

## 6. Conclusion

✅ **Spike S6 reussi cote technique** — scrubber, config Sentry privacy, lint rule et tests sont en place.

⚠️ **Action owner restante** — signer/stocker les DPA Sentry et PostHog avant beta publique / App Store.
