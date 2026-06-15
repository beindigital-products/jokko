# Routing par sous-domaine tenant (`{slug}.jokko.co`)

Statut : **opt-in, désactivé par défaut.** Le code est prêt ; l'activation
est purement config + infra (aucune modif de code requise).

## Contexte

Le tenant (organisation) est résolu **par la session**
(`userSessions.currentOrganizationId`), pas par l'URL. Le sous-domaine est
donc **cosmétique / branding** : `atelier-bracquet.jokko.co/dashboard` au lieu
de `jokko.co/dashboard`.

Historique : un redirect sous-domaine automatique cassait l'auth (le token
cookie était perdu en traversant l'origine), provoquant une boucle de
re-connexion. Il est désormais gaté derrière un flag et désactivé sur
localhost (cf. `app/dashboard/layout.tsx` effet #3).

## Comment ça marche une fois activé

1. Login sur l'apex `jokko.co` → `ConvexClientProvider` pose 3 cookies avec
   `domain=.jokko.co` (donc partagés sur tous les sous-domaines) :
   - token Convex (lisible JS)
   - `__jokko_auth=1` (présence, lue par `proxy.ts`)
   - `__Secure-jokko-session` (HttpOnly miroir, via `POST /api/auth/session`)
2. `app/dashboard/layout.tsx` redirige vers `{slug}.jokko.co/dashboard`.
3. Sur le sous-domaine, les 3 cookies sont envoyés (domaine `.jokko.co`) →
   `proxy.ts` voit l'auth + le client Convex lit le token → user authentifié.
   **Pas de rebond.**

Le redirect ne se déclenche que depuis l'apex (`jokko.co`) ou `www.jokko.co`,
**jamais sur localhost** (cookies host-only + le cert dev `--experimental-https`
ne couvre que `localhost`).

## Activation en production

### 1. Variables d'environnement (plateforme de déploiement, ex. Vercel — env Production)

```
NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=true
NEXT_PUBLIC_ROOT_DOMAIN=jokko.co
```

> `NEXT_PUBLIC_ROOT_DOMAIN` pilote À LA FOIS le domaine du cookie auth, la
> cible du redirect, et l'URL affichée à l'onboarding (`lib/root-domain.ts`).
> Le mettre explicitement évite toute dérive (le défaut code est `jokko.co`).
> Ne PAS l'activer en Preview/Local (pas de DNS/cert wildcard là-bas).

### 2. DNS

Enregistrement wildcard : `*.jokko.co` → la même cible que l'apex (CNAME
vers l'hébergeur, ou A/ALIAS selon le provider).

### 3. TLS

Certificat **wildcard** `*.jokko.co` (en plus de l'apex `jokko.co`). Sur
Vercel : ajouter `*.jokko.co` comme domaine du projet (génère le cert
automatiquement). Vérifier que l'hébergeur sert bien les sous-domaines
arbitraires vers la même app.

### 4. Vérification post-activation

- Login sur `jokko.co` → arrive sur `{slug}.jokko.co/dashboard` sans rebond.
- Recharger la page sur le sous-domaine → reste connecté.
- Se déconnecter → cookies effacés sur `.jokko.co` (pas de session fantôme).

## Limites connues (acceptables pour du branding)

- Être sur le « mauvais » sous-domaine (`orgB.jokko.co` avec une session orgA)
  affiche quand même l'org de la session — le sous-domaine ne change pas le
  tenant. Pas de correction auto (hors scope du branding cosmétique).
- Pour faire du sous-domaine un vrai discriminant de tenant (résolution par
  host, liens partagés par org), il faudrait un chantier backend dédié.

## Désactivation

Retirer / mettre à `false` `NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING`. Le login
retombe sur `jokko.co/dashboard` (path-based), tout continue de marcher.
