# ADR-0004 — Cache, offline et politique realtime

- **Statut** : Accepté
- **Date** : 2026-05-02
- **Source décisionnelle** : `architecture.md` décisions #7, #14, #20, #21 + spike S8
- **Implémentation liée** : `convex-connection-policy.ts`, `convex-connection-policy.test.ts`, `packages/convex-client`

## Contexte

Jokko est une app de messagerie business. Les agents doivent pouvoir lire le dernier contexte et préparer des réponses quand la connexion est lente, mais le produit ne peut pas promettre un offline-first complet sans gérer conflits, pièces jointes, fenêtres WhatsApp 24h, assignments et permissions en local.

Le spike S8 fixe aussi une contrainte batterie : les subscriptions Convex ne doivent pas rester en mode live agressif si l'app passe en arrière-plan, si le mode économie d'énergie est actif ou si la consommation devient trop élevée.

## Décision

**v1.0 adopte un mode "online-first avec cache lecture et queue d'envoi limitée", pas un offline-first complet.**

Concrètement :

1. Convex realtime reste le mode normal en foreground.
2. En connexion lente, l'UI affiche un banner non bloquant et autorise la lecture depuis cache.
3. En offline/disconnected, l'UI autorise la lecture depuis cache et place les envois texte en attente quand la queue sera implémentée.
4. Les mutations admin sensibles restent online-only : contacts critiques, assignments, team, billing, intégrations.
5. Les pièces jointes lourdes ne partent pas en queue offline v1.0.
6. Les clés de cache sont org-scoped et purgées au changement d'organisation.
7. Le realtime passe en `throttled` ou `paused` selon visibilité app, low power mode, charge et drain batterie.
8. Après 15 secondes en background/inactive, les subscriptions doivent être considérées pausable.

## Conséquences positives

- Expérience mobile robuste sans sur-promesse produit.
- Moins de surface de conflit avec les règles WhatsApp.
- Consommation batterie contrôlée.
- Implémentation compatible solo dev.

## Contraintes acceptées

- Pas de garantie d'envoi offline des médias.
- Pas de création/modification complète de contacts hors ligne.
- La queue d'envoi doit être visible à l'utilisateur et retry explicitement.
- Les messages en attente doivent être bloqués si la fenêtre WhatsApp 24h expire avant sync.

## Politique UX

- `slow` : message "Connexion lente", actions possibles.
- `offline` : lecture cache, envois marqués "en attente".
- `degraded` : proposer lien status page, retry en arrière-plan.
- `connected` : aucun banner.

## Politique technique

- Backoff retry : 1s, 2s, 5s, 10s, 30s.
- Seuil slow : 10s sans connexion stable.
- Seuil disconnected : 30s.
- Seuil drain batterie à surveiller : 8% / heure.
- Background pause : 15s.

## Vérification

- `pnpm exec vitest run apps/mobile/src/lib/convex-connection-policy.test.ts`
- Test device L6 : mesurer batterie avec subscriptions production.
- Tests manuels : mode avion, réseau lent, app background/foreground.

## Triggers de ré-évaluation

- Demande client forte pour offline-first complet.
- Ajout de queue médias.
- Changement du modèle de connexion Convex mobile.
