# Jokko — Exploitation & déploiement

Configuration, variables d'environnement, déploiement et mise en place des intégrations. Architecture : voir [ARCHITECTURE.md](./ARCHITECTURE.md).

> 🔐 **Ne jamais committer de secrets.** Les valeurs vivent dans Convex (`pnpx convex env set`) et Vercel (variables d'environnement). Ce document liste les **noms** et leur rôle uniquement.

---

## 1. Commandes

```bash
# Développement
pnpm dev                      # Next.js (HTTPS, port 1000)
pnpx convex dev               # Backend Convex (terminal séparé) — DEPUIS LA RACINE

# Build / typecheck / lint
pnpm build                    # Build prod Next.js
pnpx convex typecheck         # tsc --noEmit sur convex/
pnpm --filter @jokko/web run typecheck
pnpm --filter @jokko/web run lint

# Tests
pnpm exec vitest run convex/                    # tests backend
pnpm --filter @jokko/web exec vitest run        # tests web (unitaire)
pnpm --filter @jokko/web exec playwright test   # e2e (serveur auto sur :1000)

# Déploiement Convex (schéma + fonctions) — TOUJOURS depuis la racine
pnpx convex deploy            # prod
pnpx convex dev --once        # push ponctuel vers le déploiement de dev
```

> ⚠️ **Lancer Convex depuis la racine du repo.** Le faire depuis `apps/web` pousse un set vide et casse le déploiement partagé (perte d'index, démontage du rate-limiter).

---

## 2. Variables d'environnement (Convex)

| Variable | Rôle |
|---|---|
| `AUTH_SECRET`, `JWT_PRIVATE_KEY`, `JWKS` | Auth (`@convex-dev/auth`), signature des jetons |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | OAuth Google (connexion) |
| `APPLE_BUNDLE_ID` | Sign in with Apple (mobile) |
| `ENCRYPTION_KEY` | AES-256-GCM — chiffrement des tokens au repos (WhatsApp/CRM) |
| `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID` | Fallback Cloud API (niveau env) |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Vérification du webhook WhatsApp (GET) |
| `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` | Signature HMAC du webhook WhatsApp + Embedded Signup |
| `OPENAI_API_KEY` | Brouillon IA (Copilot), génération de flux, routage IA |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SES_FROM_EMAIL` | Email SES (invitations, mentions, reset). Sans `AWS_SES_FROM_EMAIL` → no-op gracieux |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe (abonnements + crédits) |
| `STRIPE_PRICE_{STARTER,BUSINESS,PRO}[_YEARLY]` | IDs de prix Stripe mappés aux clés de plan |
| `WAVE_API_KEY`, `WAVE_WEBHOOK_SECRET` | Wave (paiement crédits) |
| `HUBSPOT_CLIENT_ID/SECRET`, `PIPEDRIVE_*`, `SALESFORCE_*`, `SELLSY_*` | OAuth CRM (providers actifs) |
| `{HUBSPOT,PIPEDRIVE,SELLSY,AXONAUT}_WEBHOOK_SECRET` | Vérification des webhooks CRM entrants |
| `OAUTH_STATE_HMAC_SECRET` | Signature anti-CSRF du `state` OAuth (connexion CRM) |
| `APP_URL`, `NEXT_PUBLIC_APP_URL`, `SITE_URL`, `ROOT_DOMAIN` | URLs publiques (invitations, redirections, multi-tenant) |
| `CONVEX_SITE_URL` / `CONVEX_CLOUD_URL` | Hôtes Convex (auto ; allow-list média anti-SSRF) |

Côté **Vercel** (frontend, build + runtime) :
- `NEXT_PUBLIC_CONVEX_URL` (URL du déploiement Convex **prod**) + `CONVEX_DEPLOY_KEY` (déploie Convex au build)
- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ROOT_DOMAIN`
- `NEXT_PUBLIC_FACEBOOK_APP_ID` (Embedded Signup) ; optionnels : `NEXT_PUBLIC_GOOGLE_MAPS_KEY` (adresses), `NEXT_PUBLIC_SENTRY_DSN` (monitoring)
- `NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING` — laisser **off** sauf config sous-domaines explicite (cookie d'auth scopé au domaine)

> Ne PAS définir en prod : `DEMO_REVIEW_PASSWORD`, `DEMO_SEED_TOKEN` (seed de démo uniquement).

```bash
pnpx convex env set KEY "valeur"     # définir
pnpx convex env list                 # lister (⚠️ affiche les valeurs)
```

---

## 3. Webhooks (à enregistrer côté providers)

Tous servis par Convex sur `https://<deployment>.convex.site` :

| Endpoint | Provider | Sécurité |
|---|---|---|
| `/api/whatsapp/webhook` | Meta WhatsApp (messages, statuses, **calls**) | GET verify-token + POST HMAC-SHA256 |
| `/api/stripe/webhook` | Stripe | Signature Stripe + anti-replay 5 min |
| `/api/wave/webhook` | Wave | Signature + anti-replay |
| `/webhooks/crm/{hubspot,pipedrive,sellsy,axonaut}` | CRM | Signature par provider |
| `/api/facebook/data-deletion` | Meta (RGPD) | `signed_request` |

Pour WhatsApp : dans l'app Meta, abonner le **champ `calls`** (en plus de `messages`) pour activer les appels entrants.

---

## 4. Mise en place des intégrations

### WhatsApp Business
1. Connecter un numéro via Embedded Signup (catalogue Paramètres → Canaux) ou config env.
2. Token Meta valide avec le scope messagerie **+ appels** ; activer le calling sur le numéro (`calling.status: ENABLED`).
3. Vérifier l'abonnement webhook au champ `calls`. Graph API : **v24.0** (requis pour le calling).

### CRM
- **Actifs** : HubSpot, Pipedrive, Salesforce, Sellsy → OAuth (renseigner `*_CLIENT_ID/SECRET`).
- **« Bientôt »** : Axonaut, noCRM (désactivés via `availability: "coming_soon"`).
- Connexion : Intégrations → choisir le provider → OAuth (ou clé API) → préférences de synchro (push / pull / bidirectionnel). Plan-gating : **Pro+**.

### Paiement
- Stripe : produits/prix mappés serveur (`lib/stripePlans.ts`), portail client activé.
- Crédits : achetés via Stripe/Wave, débités à l'usage (appels à la minute, campagnes par conversation).

---

## 5. Crons (`convex/crons.ts`)

| Job | Fréquence | Rôle |
|---|---|---|
| `check-presence-timeouts` | 1 min | Statut de présence des agents |
| `process-scheduled-broadcasts` | 1 min | Lance les campagnes planifiées |
| `expire-payment-sessions` | 5 min | Nettoie les sessions de paiement |
| `crm-dispatcher-tick` | 20 s | Push Jokko → CRM (queue) |
| `crm-poller-tick` | 1 min | Pull CRM → Jokko (delta) |
| `expire-missed-calls` | 1 min | Passe les appels non répondus en MISSED |

---

## 6. Comptes de test

- Compte QA : `momoseck8@gmail.com` (org « Be in Digital », plan PRO). Surchargeable via `E2E_EMAIL`/`E2E_PASSWORD` pour Playwright.
- Numéro de test (envois réels) : à fournir au cas par cas.
- Provisioning dev : `pnpx convex run access:provisionTestAccountDev '{"email":"…","plan":"PRO"}'` (depuis la racine).

---

## 7. Checklist pré-production

- [ ] Tous les secrets définis dans Convex prod + Vercel (aucun en clair dans le repo).
- [ ] Webhooks enregistrés (WhatsApp `calls` inclus, Stripe, Wave, CRM).
- [ ] `pnpx convex deploy` (racine) + `pnpm build` verts.
- [ ] Suites Vitest + Playwright vertes ; `convex typecheck` + `web typecheck` OK.
- [ ] Token Meta valide + calling activé sur le(s) numéro(s).
- [ ] Plans Stripe configurés ; crédits testés (achat + débit).
- [ ] Arbitrer `updateOrgPlan` (octroi de plan hors paiement) — voir section 10.

---

## 8. Séquence de mise en production (ordonnée)

1. **Convex prod** : `pnpx convex deploy` (depuis la racine) crée/met à jour le déploiement de production. Noter ses URLs (`https://<prod>.convex.cloud` et `.convex.site`).
2. **Secrets Convex** : `pnpx convex env set KEY "valeur" --prod` pour tous les noms de la section 2.
3. **Meta WhatsApp** : numéro connecté, token valide (scope messagerie **+ appels**), calling activé (`calling.status: ENABLED`), webhook `…convex.site/api/whatsapp/webhook` (verify-token + champs `messages` **+ `calls`**).
4. **Stripe** : produits/prix créés (IDs = `STRIPE_PRICE_*`), webhook `…/api/stripe/webhook` (secret), portail client activé.
5. **AWS SES** : adresse/domaine `AWS_SES_FROM_EMAIL` vérifié, compte sorti du sandbox.
6. **CRM actifs** : `*_CLIENT_ID/SECRET` + webhooks `…/webhooks/crm/<provider>`.
7. **Vercel** : variables `NEXT_PUBLIC_*` + `CONVEX_DEPLOY_KEY` pointant vers le Convex **prod**, domaine de prod, déploiement.
8. **Vérification** : smoke test (section 9).

## 9. Smoke test post-déploiement

- [ ] Inscription → onboarding → dashboard (création d'org OK).
- [ ] Envoyer/recevoir un message WhatsApp réel (webhook entrant + envoi sortant).
- [ ] Passer/recevoir un appel (sonnerie, audio bidirectionnel, raccrochage, débit crédit).
- [ ] Créer + envoyer une campagne **par tags** (vérifier le ciblage) avec variables de modèle.
- [ ] Inviter un membre (email reçu) ; vérifier qu'un AGENT ne peut PAS inviter.
- [ ] Connecter un CRM (HubSpot) → import des contacts + push d'un événement de conversation.
- [ ] Achat de crédits Stripe → solde mis à jour (webhook).

## 10. Décision à arbitrer — octroi de plan (`updateOrgPlan`)

`organizations.updateOrgPlan` (owner-only, utilisé à l'onboarding) **fixe `org.plan`** sans vérifier Stripe. Pendant les **14 jours d'essai**, toutes les features sont déverrouillées (aucune exposition). **Après l'essai**, `planFeatures` accorde l'accès selon `org.plan` — un propriétaire pourrait donc s'octroyer un plan payant sans paiement.

**Recommandation** selon le modèle économique :
- **Trial → Stripe strict** (recommandé pour facturer) : ne pas accorder BUSINESS/PRO via `updateOrgPlan` ; router la sélection payante vers Stripe Checkout, l'octroi réel se faisant à `checkout.session.completed`. L'onboarding garde la sélection comme « intention » (features déjà ouvertes par l'essai).
- **Facturation manuelle autorisée** (grands comptes) : garder `updateOrgPlan` réservé aux OWNER **et** journaliser tout octroi payant hors Stripe (audit).

Tant que l'essai protège la mise en route, ce n'est pas bloquant ; à trancher avant de facturer réellement.
