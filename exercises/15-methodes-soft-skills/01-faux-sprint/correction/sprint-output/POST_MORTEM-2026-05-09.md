# Post-mortem — Incident 2026-05-09 — OAuth GitHub down 35 min

> Blameless. On parle système, pas individus.

**Date** : 2026-05-09, 14:23 → 14:58 UTC (35 min)
**Sévérité** : SEV2 (perte ~10 % des tentatives de login pendant la fenêtre)
**Auteurs** : @bob, @alice
**Statut** : final, actions en cours

## Résumé

Suite au déploiement de la PR #42 (TASK-101 — OAuth GitHub), `/auth/github/callback` a renvoyé 500 pour 100 % des utilisateurs entrants pendant 35 min. Cause : variable d'environnement `ENCRYPTION_KEY` non poussée sur l'environnement de prod (présente uniquement en staging). Détecté par alerte `auth-error-rate > 5%`. Mitigation : poussée du secret via `flyctl secrets set` puis redéploiement. Aucune donnée corrompue.

## Impact

- **Tentatives de login GitHub échouées** : 142 sur 35 min (~10 % du trafic auth)
- **Inscriptions perdues** : ~ 8 (utilisateurs qui n'ont pas réessayé)
- **Tickets support** : 3
- **CA impacté** : aucun (login pré-paiement)

## Timeline (UTC)

| Heure | Événement |
|-------|-----------|
| 14:18 | Merge PR #42 sur main |
| 14:21 | Déploiement Fly auto-déclenché |
| 14:23 | Premier callback OAuth → 500 « ENCRYPTION_KEY undefined » |
| 14:25 | Alerte Better Stack `auth-error-rate > 5%` → Slack #oncall |
| 14:27 | @bob prend l'astreinte |
| 14:35 | Diagnostic : variable env manquante en prod |
| 14:42 | `flyctl secrets set ENCRYPTION_KEY=...` |
| 14:48 | Redéploiement Fly |
| 14:55 | Premiers callbacks redeviennent 200 |
| 14:58 | Erreurs revenues à zéro, alerte clôturée |

## Cause racine (5 pourquoi)

1. Pourquoi 500 en prod ? `ENCRYPTION_KEY` était `undefined`, donc `crypto.createCipheriv` plante.
2. Pourquoi `undefined` ? La clé n'avait pas été poussée comme secret Fly en environnement prod.
3. Pourquoi pas poussée ? Le checklist de déploiement de la PR mentionnait l'ajout du secret en staging, mais pas en prod.
4. Pourquoi pas en prod ? La process actuel de déploiement n'oblige pas à confirmer la parité staging/prod sur les secrets.
5. **Cause système** : aucun garde-fou empêche de déployer un service avec une variable d'env manquante. Le service boot et plante seulement à la première requête.

## Détection

- Délai cause → détection : **2 min** (alerte Better Stack)
- Pourrait-on détecter plus tôt ? Oui :
  - Validation env au boot (échec immédiat = pod KO immédiat) — au lieu d'attendre la première requête.
  - Check de parité staging/prod automatique en CI.

## Réponse

### Ce qui a marché

- Détection rapide (2 min) grâce à l'alerte de symptôme (taux d'erreur).
- L'on-call a su lire les logs Fly et identifier la cause en ~10 min.
- Mitigation simple (push de secret + redeploy) — RTO réel : 35 min.
- Aucune donnée corrompue, pas de rollback DB nécessaire.

### Ce qui n'a pas marché

- Le déploiement a réussi malgré une variable manquante critique → faux signal de succès.
- Pas de runbook spécifique pour « variable env manquante » → diagnostic ralenti.
- L'on-call de backup n'a pas été notifié pendant les 10 min où @bob diagnostiquait.

## Actions correctives

| # | Action | Owner | Échéance | Statut |
|---|--------|-------|----------|--------|
| 1 | Ajouter `env.ts` Zod validation au boot — échec immédiat si var manquante | @bob | 2026-05-12 | open |
| 2 | Workflow CI qui compare les secrets staging/prod et alerte sur les diff | @alice | 2026-05-23 | open |
| 3 | Runbook « env vars missing » avec commandes Fly | @bob | 2026-05-12 | open |
| 4 | Déploiement bloquant si `/health` ne renvoie pas 200 dans les 60 s post-deploy | @alice | 2026-05-30 | open |
| 5 | Présenter ce post-mortem en all-hands sprint review | @cto | 2026-05-15 | open |

## Leçons apprises

- **Une variable d'env critique manquante doit faire échouer le boot, pas la première requête.** Validation Zod au démarrage = défense de base.
- **Le succès d'un déploiement Fly n'implique pas que l'app fonctionne.** Healthcheck strict post-deploy avec rollback automatique est la prochaine étape.
- **Parité staging/prod sur les secrets** mérite d'être automatisée — la liste mentale ne tient pas face à 50+ déploiements/mois.
