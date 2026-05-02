# Rétrospective — Sprint 1

**Date** : 2026-05-10
**Présents** : @alice, @bob, @carol
**Animateur** : @alice (rotation chaque sprint)

## Météo

- @alice : ⛅ — sprint réussi mais l'incident vendredi a fatigué
- @bob : 🌤️ — content du chiffrement propre, l'oubli env est mortifiant mais bénéfique
- @carol : ☀️ — les 4 PR front sont passées sans friction, premier sprint que je termine sans dette ouverte

## Start / Stop / Continue

### Start (à commencer)

- **Validation env au boot** : Zod sur process.env, fail-fast (action ADR-007 confirmée par l'incident).
- **PR template avec checklist secrets** : « As-tu ajouté la variable en prod ? Sur staging ? Validé en local ? ».
- **Daily async par défaut** : passer de 15 min sync à un thread Slack 9h-9h30 (gain de focus le matin).

### Stop (à arrêter)

- **Mergerie le vendredi après-midi** : l'incident OAuth est tombé un vendredi 14h. Politique : pas de merge sensible après jeudi 16h.
- **Estimation à la louche sur le front** : Carol a donné « S » sur TASK-103 alors qu'elle ne savait pas encore comment serait servi `/user/orgs`. À l'avenir, refinement plus poussé avant estimation.

### Continue (à conserver)

- **ADR pour les décisions structurantes** — ADR-007 a clarifié + servi de référence pendant l'incident.
- **Conventional Comments** — feedback PR #42 a été dense mais pas blessant. À continuer.
- **Sprint goal en 1 phrase** — l'équipe s'est ralliée dessus, focus clair.

## Actions concrètes

| # | Action | Owner | Échéance | Mesure de succès |
|---|--------|-------|----------|------------------|
| 1 | `env.ts` Zod fail-fast au boot | @bob | 2026-05-12 | App refuse de démarrer si var manque, vu en CI |
| 2 | PR template avec checklist secrets | @alice | 2026-05-15 | Toute PR future vue avec la checklist remplie |

## Suivi de la rétro précédente

(Sprint 0 — onboarding, pas de rétro précédente.)

## Métriques du sprint

- Tickets prévus : 8 · livrés : 7 · pourcent atteint : 87,5 %
  - TASK-108 (« Bouton déconnexion ») reporté au sprint 2.
- Lead time moyen : 3,2 j
- Throughput : 7 tickets / 2 sem
- Incidents post-déploiement : 1 (SEV2, 35 min RTO)
- Couverture tests `auth/` : 0 % → 78 %

## Note de fin (animateur)

Sprint sain dans l'ensemble. L'incident OAuth a été un bon test du processus :
détection rapide, mitigation correcte, post-mortem productif. Les 2 actions de
rétro découlent directement de l'incident, ce qui est un bon signe. À suivre
au sprint 2 si elles sont vraiment livrées (sinon, signal d'alerte).
