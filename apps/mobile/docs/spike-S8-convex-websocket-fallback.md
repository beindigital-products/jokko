# Spike S8 — Convex websocket fallback policy

> **Statut** : Termine cote code/politique. Mesure batterie physique a refaire pendant L6.
> **Date** : 2026-05-01
> **Objectif** : verrouiller le comportement mobile si la websocket Convex est lente, offline, degradee, ou trop couteuse batterie.

---

## 1. Objectif du spike

S8 adresse le risque `Guardian #6` documente dans `architecture.md §17.2` :

- une websocket mobile peut rester bloquee en reconnexion ;
- les agents doivent pouvoir continuer a saisir/envoyer, meme si la synchro temps reel est lente ;
- l'app doit distinguer probleme reseau local et service Convex/Jokko degrade ;
- le mode background/low power ne doit pas garder des subscriptions non critiques indefiniment.

Le spike livre donc :

1. une machine d'etat pure et testee ;
2. une politique de banner + retry/backoff ;
3. une strategie batterie/realtime pour L1/L6 ;
4. une checklist de validation device et Convex dashboard.

---

## 2. Implementation livree

### 2.1 Machine d'etat connexion

Fichier : `apps/mobile/src/lib/convex-connection-policy.ts`

`decideConvexConnection()` prend un snapshot de connexion :

- phase Convex : `connected`, `connecting`, `reconnecting`, `disconnected` ;
- timestamp actuel + debut de phase ;
- etat reseau local ;
- etat status page/service ;
- nombre de mutations en attente.

Elle retourne :

- type de banner : `none`, `slow`, `offline`, `degraded` ;
- titre/message utilisateur ;
- `queueWrites` ;
- `allowReadOnlyCache` ;
- action status page ;
- prochain delay de retry.

### 2.2 Timeouts et UX

Decisions verrouillees :

- `< 10s` en connexion/reconnexion : pas de banner, lecture cache autorisee ;
- `>= 10s` : banner `Connexion lente` ;
- `>= 30s` ou `disconnected` : banner `Reconnexion impossible` ;
- reseau local offline : banner `Hors ligne`, pas de lien status page ;
- status page/service degrade : banner `Service instable` + action status page ;
- les envois restent possibles via queue locale (`queueWrites: true`) des qu'il y a degradation.

Copie v1.0 recommandee :

- lente : `Connexion lente — Les actions continuent, la synchro peut prendre du retard.`
- offline : `Hors ligne — Les messages restent en file locale.`
- degrade : `Service instable — Jokko réessaie en arrière-plan.`

### 2.3 Retry/backoff

`getConvexRetryDelayMs()` applique un backoff borne :

| Tentative | Delay |
|---|---:|
| 1 | 1s |
| 2 | 2s |
| 3 | 5s |
| 4 | 10s |
| 5+ | 30s |

Objectif : eviter les boucles agressives qui vident la batterie et augmentent le cout Convex.

### 2.4 Batterie / realtime mode

Fichier : `apps/mobile/src/lib/convex-connection-policy.ts`

`summarizeBatteryDrain()` calcule un drain `%/h` sur samples unplugged.

`decideConvexRealtimeMode()` retourne :

- `live` : app active, batterie OK, pas de low power ;
- `throttled` : inactive courte, low power, ou drain >= 8%/h ;
- `paused` : background ou inactive > 15s.

Politique L1 :

- conserver la websocket seulement quand l'app est active/authentifiee ;
- pauser les subscriptions non critiques en background ;
- compter sur push notifications pour les updates background ;
- ne jamais bloquer la queue d'envoi locale a cause du realtime.

Politique L6 :

- mesurer drain batterie sur device physique avec session 30 min ;
- comparer Convex dashboard compute/ws avant/apres throttling ;
- reouvrir si drain > 8%/h sur device bas de gamme.

---

## 3. Verification

Commandes executees :

```bash
pnpm exec vitest run apps/mobile/src/lib/convex-connection-policy.test.ts
pnpm --filter @jokko/mobile typecheck
pnpm exec vitest run
pnpm --filter @jokko/mobile lint
pnpm -r typecheck
pnpm exec tsc -p convex/tsconfig.json --noEmit --pretty false
```

Resultat :

- Tests S8 cibles : 8 tests passants.
- Suite Vitest complete : 266 tests passants.
- Lint mobile : OK.
- Typecheck mobile : OK.
- Typecheck workspace : OK.
- Typecheck Convex : OK.

---

## 4. Decisions ajoutees

| # | Decision | Impact |
|---|---|---|
| 97 | Politique Convex mobile centralisee dans `convex-connection-policy.ts`, pure et testee avant l'integration React. | L1 |
| 98 | Timeout 10s = banner `Connexion lente`; les envois restent en queue locale, non bloques par la websocket. | L3/L10 |
| 99 | Offline local et service degrade sont deux etats UX distincts ; status page seulement pour degradation service. | UX + support |
| 100 | Retry websocket borne : 1s, 2s, 5s, 10s, puis 30s max. | Battery + cost |
| 101 | Background/low power/high drain degradent le realtime : `throttled` ou `paused`, push prend le relais. | Battery |
| 102 | Mesure batterie physique reste un gate L6 : si drain > 8%/h, reduire subscriptions et polling avant beta. | Perf gate |

---

## 5. Conclusion

✅ **Spike S8 reussi cote politique/code** — timeout, banner, retry/backoff, queue locale et mode batterie sont formalises et testes.

⚠️ **Action L6 restante** — refaire une mesure batterie reelle sur device physique + dashboard Convex quand les subscriptions production existeront.
