# Spike S4 — Demo account App Store + Meta WABA Review

> **Statut** : Termine.
> **Date** : 2026-05-01
> **Objectif** : fournir un compte de demonstration fonctionnel, pre-rempli, sans PII reelle, pour App Store Review et Meta WABA Review.

---

## 1. Objectif du spike

S4 devait lever le risque App Review identifie dans `architecture.md §17.2` :

- Apple peut rejeter une app B2B si le compte de demo est vide, bloque par onboarding, ou depend d'une configuration externe impossible a tester.
- Meta WABA Review peut demander des credentials et un parcours clair montrant l'usage WhatsApp.

Le resultat attendu est un seed reproductible avec :

- un compte reviewer connectable via Password auth Convex ;
- une organisation active et onboarding complete ;
- un canal WhatsApp de test visible dans l'app ;
- des conversations factices realistes ;
- des templates et notifications permettant de parcourir les tabs mobiles ;
- aucun appel WhatsApp reel par defaut pendant la review.

---

## 2. Implementation livree

### 2.1 Fonction Convex de seed

Fichier : `convex/demo.ts`

- `demo.seedAppReviewDemo` : action publique gardee par `DEMO_SEED_TOKEN`.
- `demo.seedAppReviewWorkspace` : mutation interne idempotente qui cree/met a jour l'espace demo.

L'action cree le compte Password via `createAccount()` de `@convex-dev/auth/server`, ce qui evite d'inserer a la main un hash compatible Convex Auth.

### 2.2 Donnees creees

Le seed cree ou met a jour :

- Org : `Jokko Demo Review`, slug `jokko-app-review-demo`, `onboardingStep: "COMPLETED"`.
- Demo flag : `organizations.demo = { kind, seedVersion, seededAt, outboundMode }`.
- Reviewer : `Jokko App Review`, role `OWNER`, session active sur l'org demo.
- Deux agents factices : `Awa Support`, `Moussa Sales`.
- Poles + teams : Support, Ventes.
- WABA + canal WhatsApp actif : label `Jokko Demo WhatsApp`, numero issu de `DEMO_WA_DISPLAY_PHONE` ou fallback `+1 555 010 4242`.
- 4 contacts factices sur numeros reserves `+1 555 010 xxxx`.
- 4 conversations ouvertes, 11 messages factices couvrant texte, document, image, location.
- 2 templates WhatsApp `APPROVED`.
- 1 notification `DEMO_REVIEW_READY`.

Le seed est idempotent : le relancer met a jour les memes objets au lieu de dupliquer.

### 2.3 Mode outbound local-only

Fichier : `convex/messages.ts`

Si `organization.demo.outboundMode === "local_only"`, `messages.send` et `messages.retry` :

1. creent ou remettent le message en etat normal ;
2. patchent `status: "SENT"` et `externalId: "demo:local:<messageId>"` ;
3. retournent sans scheduler `internal.whatsapp_actions.sendMessage`.

Effet : Apple/Meta peuvent tester l'envoi dans l'UI sans que Jokko appelle Graph API avec un token factice ou envoie un message a un vrai numero.

---

## 3. Runbook

### 3.1 Variables Convex requises

```bash
pnpx convex env set DEMO_SEED_TOKEN "<token-long-random>"
pnpx convex env set DEMO_REVIEW_PASSWORD "<password-16+-chars-Aa1>"
```

Variables optionnelles :

```bash
pnpx convex env set DEMO_REVIEW_EMAIL "app-review@jokko.example"
pnpx convex env set DEMO_WA_DISPLAY_PHONE "+1 555 010 4242"
pnpx convex env set DEMO_WA_PHONE_NUMBER_ID "demo_phone_number_id"
pnpx convex env set DEMO_WA_BUSINESS_ACCOUNT_ID "demo_waba_id"
pnpx convex env set DEMO_OUTBOUND_MODE "local_only"
```

### 3.2 Seed dev / prod

```bash
pnpx convex run demo:seedAppReviewDemo '{"seedToken":"<token-long-random>"}'
```

Pour une deployment prod, utiliser le deployment cible habituel Convex (`--prod` si c'est le workflow retenu au moment de L12).

### 3.3 Texte App Store Connect

Dans **App Review Information > Sign-in information** :

- Username : valeur `DEMO_REVIEW_EMAIL` ou `app-review@jokko.example`.
- Password : valeur `DEMO_REVIEW_PASSWORD`.
- Notes :
  - "The account opens directly into a preconfigured Jokko demo workspace."
  - "The WhatsApp channel and conversations are seeded test data."
  - "Outbound messages are local-only for review and do not contact real WhatsApp users."

### 3.4 Notes Meta WABA Review

Fournir les memes credentials et preciser :

- Le canal visible `Jokko Demo WhatsApp` represente le numero WhatsApp de test.
- Les conversations montrent les usages WhatsApp Business : support entrant, document, image, location, template.
- Par defaut, le mode App Review n'envoie pas de message reel. Si Meta exige un envoi reel, reseeder une org dediee avec `DEMO_OUTBOUND_MODE=whatsapp_api` et de vrais credentials WABA de test.

---

## 4. Verification

Commandes executees :

```bash
pnpm exec convex codegen
pnpm exec tsc -p convex/tsconfig.json --noEmit --pretty false
pnpm exec vitest run convex/demo.test.ts
pnpm exec vitest run
```

Resultat :

- `convex/demo.test.ts` : 3 tests passants.
- Suite Vitest complete : 244 tests passants.
- TypeScript Convex : OK.
- Codegen Convex : OK.

Tests couverts :

1. Seed idempotent : org, canal, contacts, conversations, messages, templates, notification.
2. Action publique gardee : creation du compte Password Convex Auth via `demo.seedAppReviewDemo`.
3. Envoi local-only : `messages.send` marque le message `SENT` sans credentials WhatsApp.

---

## 5. Decisions ajoutees

| # | Decision | Impact |
|---|---|---|
| 79 | Le compte demo App Review est cree via une action Convex gardee par `DEMO_SEED_TOKEN`, pas via un script local qui bypasserait Convex Auth. | L12 |
| 80 | Les orgs de review portent `organizations.demo` avec `seedVersion` et `outboundMode`. | Schema |
| 81 | Le mode par defaut est `local_only` : les messages sortants sont marques `SENT` localement et ne touchent pas Graph API. | App Review safe |
| 82 | Le seed S4 doit rester idempotent et compose uniquement de donnees factices / numeros reserves. | Compliance |
| 83 | Les credentials reviewer vivent dans Convex env + App Store Connect / Meta notes, jamais dans le repo. | Security |
| 84 | Avant chaque submission L12, reseeder le compte demo et verifier login + inbox + envoi local-only. | Release checklist |

---

## 6. Conclusion

✅ **Spike S4 reussi** — compte demo et workspace review fonctionnels, idempotents, testes, sans dependance a une vraie livraison WhatsApp par defaut.
