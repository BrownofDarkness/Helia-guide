# Post-mortem — Incident YYYY-MM-DD — <titre>

> **Blameless** : on cherche les défauts du système, pas un coupable.

**Date** : YYYY-MM-DD, HH:MM → HH:MM TZ
**Sévérité** : SEV1 / SEV2 / SEV3
**Auteurs** : @nom1, @nom2

## Résumé (3-4 lignes)
...

## Impact
- Utilisateurs affectés : ~ X
- Requêtes / commandes impactées : Y
- Revenu perdu / décalé : Z
- Tickets support reçus : N

## Timeline (UTC)
| Heure | Événement |
|-------|-----------|
| 14:23 | ... |
| 14:25 | Première alerte |
| 14:27 | On-call prend |
| 14:42 | Cause identifiée |
| 14:48 | Mitigation |
| 14:53 | Rollback |
| 15:47 | Erreurs à zéro |

## Cause racine (5 pourquoi)
1. ...
2. ...
3. ...
4. ...
5. ...

## Détection
- Comment on a vu : ...
- Délai cause → détection : N min
- Pourrait-on détecter plus tôt ? Comment ?

## Réponse
- Étapes prises, dans quel ordre, par qui

## Ce qui a marché
- ...

## Ce qui n'a pas marché
- ...

## Actions correctives
| # | Action | Owner | Échéance | Statut |
|---|--------|-------|----------|--------|
| 1 | ... | @ | YYYY-MM-DD | open |

## Leçons apprises
2-3 lignes mémorables à diffuser.
