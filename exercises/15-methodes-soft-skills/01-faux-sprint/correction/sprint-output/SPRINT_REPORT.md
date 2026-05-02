# Sprint Report — Sprint 1 (2026-04-28 → 2026-05-09)

## Sprint goal
> Permettre l'authentification GitHub OAuth + page profil utilisable.

**Atteint** : ✅

L'utilisateur peut maintenant se connecter via GitHub. La page `/profile`
affiche les données GitHub. Le bouton « Déconnexion » est reporté au sprint 2.

## Résultats

| Catégorie | Prévu | Livré |
|-----------|-------|-------|
| Tickets MUST | 4 | 4 |
| Tickets SHOULD | 3 | 3 |
| Tickets COULD | 1 | 0 (reporté) |
| Bugs en prod ouverts | — | 0 |
| Incidents | — | 1 (SEV2, post-mortem fait) |

## Métriques

- Lead time moyen : **3,2 jours** (création → done)
- Throughput : **7 tickets / 2 sem**
- Couverture tests `auth/` : **0 % → 78 %**
- Lighthouse perf landing : **94/100** (inchangé)
- Erreurs Sentry : **+0** (l'incident OAuth ne s'est pas reproduit après fix)

## Forces du sprint

- **Sprint goal en 1 phrase** : l'équipe a su quoi prioriser quand 2 imprévus sont arrivés.
- **ADR-007** rédigé en milieu de sprint a évité des allers-retours sur le chiffrement.
- **Conventional Comments** ont fait passer une PR délicate (sécurité) en 2 jours sans friction.
- **Détection rapide** de l'incident OAuth grâce à l'alerte symptôme.

## Faiblesses du sprint

- **Variable d'env critique oubliée en prod** → incident SEV2.
- **Estimation TASK-103** trop optimiste sans refinement complet.
- **Vendredi 14h** = mauvais créneau pour un déploiement sensible.

## Reportées au sprint suivant

- TASK-108 — Bouton déconnexion + clear cookie.
- Action rétro #1 — `env.ts` Zod fail-fast.
- Action rétro #2 — PR template avec checklist secrets.

## Conclusion

Sprint productif et formateur. Le binôme « ADR + post-mortem » a fait monter
l'équipe d'un cran sur la qualité de la décision et la résilience. À reproduire
sur le sprint 2 avec une discipline accrue sur la parité staging/prod.
