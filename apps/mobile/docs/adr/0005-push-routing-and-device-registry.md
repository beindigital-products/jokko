# ADR-0005 — Push routing et registre devices

- **Statut** : Accepté
- **Date** : 2026-05-02
- **Source décisionnelle** : `architecture.md` décisions #6, #23, #24
- **Implémentation liée** : `convex/notifications.ts`, tables `devices`, `notificationPreferences`, `pushDeliveryAttempts`, `mobile-permissions.ts`

## Contexte

Les notifications sont critiques pour une inbox WhatsApp mobile : nouveaux messages, assignments, mentions et alertes système. En même temps, Jokko est multi-tenant et doit respecter les préférences utilisateur, les conversations/canaux mutés et le DND.

v1.0 cible iOS via Expo. Une Notification Service Extension native ou de l'inline reply silencieux augmente fortement la complexité et sort du périmètre solo dev initial.

## Décision

**v1.0 utilise Expo Push Service avec routing serveur Convex et registre devices par utilisateur.**

Concrètement :

1. Le device mobile génère un `deviceId` durable en `expo-secure-store`.
2. `expo-notifications` demande la permission push pendant l'onboarding.
3. Le token Expo est enregistré dans `devices` avec user, organization, platform, appVersion, buildVersion et permission status.
4. Les préférences sont stockées dans `notificationPreferences`.
5. `createNotification` crée la notification web/backend puis planifie l'action interne push.
6. L'action interne envoie à `https://exp.host/--/api/v2/push/send` par chunks de 100.
7. Chaque tentative est enregistrée dans `pushDeliveryAttempts`.
8. `DeviceNotRegistered` désactive automatiquement le device.
9. Le tap push ouvre l'app via `link`; l'inline reply lock screen est reporté.

## Routing

Une push n'est envoyée que si :

- Le type est activé dans les préférences.
- La conversation ou le canal WhatsApp n'est pas muté.
- Le DND ne bloque pas le créneau.
- Le device est encore activé.
- L'organisation du device correspond à la notification quand elle est renseignée.

## Conséquences positives

- Pas de secret APNs à gérer directement dans l'app.
- Modèle backend testable et auditable.
- Nettoyage automatique des devices invalides.
- Compatibilité iOS maintenant, Android plus tard.

## Contraintes acceptées

- Dépendance à Expo Push Service v1.0.
- Pas d'inline reply depuis lock screen.
- Pas de Notification Service Extension pour enrichir/déchiffrer localement.
- Les payloads doivent rester courts et éviter toute PII inutile.

## Règles de contenu

- Le payload peut contenir `notificationId`, `organizationId`, `type` et `link`.
- Ne pas mettre de corps complet de conversation WhatsApp dans `data`.
- Les previews visibles doivent être décidées produit/privacy avant TestFlight.
- Les préférences utilisateur priment sur les besoins internes.

## Vérification

- Tests Convex notifications.
- Test device iOS : permission grant/deny, token Expo, réception push, tap deep link.
- Test de désactivation : simuler `DeviceNotRegistered` et vérifier `notificationsEnabled=false`.

## Triggers de ré-évaluation

- Besoin d'inline reply.
- Besoin de chiffrement ou redaction locale du contenu push.
- Volume push qui rend Expo Push insuffisant.
