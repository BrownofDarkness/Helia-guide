# Post-mortem — Incident YYYY-MM-DD — <titre court>

> Ce post-mortem est **blameless**. Le but est d'apprendre comment renforcer le
> système, pas de désigner un responsable. Toute personne intelligente et
> bien intentionnée placée dans les mêmes conditions pourrait causer le même
> incident.

**Date** : YYYY-MM-DD, HH:MM → HH:MM TZ (durée totale)
**Sévérité** : SEV1 / SEV2 / SEV3
**Auteurs** : @nom1, @nom2
**Status** : draft / final / closed

## Résumé (3-4 lignes)

Pour quelqu'un qui découvre l'incident — ce qui s'est passé, l'impact, la cause
principale, comment on l'a réglé.

## Impact

- Utilisateurs affectés : ~ X
- Requêtes / commandes / transactions impactées : Y
- Revenu perdu / décalé : Z €
- Tickets support reçus : N

## Timeline

Tous les horaires en UTC.

| Heure | Événement |
|-------|-----------|
| 14:23 | Déploiement v1.34.0 sur prod |
| 14:25 | Première alerte critique |
| 14:27 | On-call (alice) prend l'astreinte |
| 14:42 | Cause racine identifiée |
| 14:48 | Mitigation appliquée |
| 14:53 | Déploiement v1.33.7 (rollback) |
| 15:47 | Erreurs revenues à zéro après backfill |

## Cause racine

Description détaillée. Utiliser les **5 pourquoi** pour atteindre la cause système :

1. Pourquoi X est arrivé ? Parce que…
2. Pourquoi cela ? Parce que…
3. Pourquoi cela ? Parce que…
4. Pourquoi cela ? Parce que…
5. Pourquoi cela ? Parce que… ← cause système

## Détection

- Comment on l'a vu : alerte / client / hasard ?
- Délai entre cause et détection : XX min
- Aurait-on pu détecter plus tôt ? Comment ?

## Réponse

- Comment on a réagi : étapes prises, ordre, qui ?
- Ce qui a marché.
- Ce qui n'a pas marché.

## Ce qui a bien fonctionné

- (3-5 points concrets — il faut renforcer ces forces)

## Ce qui n'a pas fonctionné

- (3-5 points concrets — sans nommer de personnes, parler du système)

## Actions correctives

| # | Action | Owner | Échéance | Statut |
|---|--------|-------|----------|--------|
| 1 | … | @alice | YYYY-MM-DD | open |
| 2 | … | @bob | YYYY-MM-DD | open |
| 3 | … | @cto | YYYY-MM-DD | open |

> **Convention** : tout owner sans échéance = action morte. Toute action sans
> follow-up = post-mortem inutile.

## Leçons apprises

Ce que tout le monde dans l'équipe doit retenir, en 2-3 lignes mémorables.

## Annexes

- Liens vers les graphs Grafana / Sentry pertinents
- Captures d'écran du dashboard pendant l'incident
- Slack threads (si publics dans l'org)
