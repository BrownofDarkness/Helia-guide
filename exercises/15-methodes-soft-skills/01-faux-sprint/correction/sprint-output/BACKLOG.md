# Backlog — Sprint 1 (Taskly)

Sprint goal : *« Permettre l'authentification GitHub OAuth + page profil utilisable »*.

## Capacité

| Personne | Disponibilité | Capacité (j-h) |
|----------|----------------|----------------|
| Alice (lead) | 80 % (revue + 1 ticket) | 8 |
| Bob (full-stack) | 100 % | 10 |
| Carol (front) | 100 % | 10 |
| **Total** | | **28 j-h** |

## Tickets

| ID | Titre | Type | Priorité MoSCoW | Estimation | Owner |
|----|-------|------|-----------------|------------|-------|
| TASK-101 | Ajouter route OAuth GitHub côté API | feature | Must | M (2 j) | Bob |
| TASK-102 | Stocker le token GitHub chiffré en DB | chore | Must | S (1 j) | Bob |
| TASK-103 | Page `/profile` qui affiche les infos GitHub | feature | Must | M (2 j) | Carol |
| TASK-104 | Bouton « Se connecter avec GitHub » | feature | Must | XS (0,5 j) | Carol |
| TASK-105 | Tests e2e du flow OAuth (Playwright) | chore | Should | S (1 j) | Bob |
| TASK-106 | Refactor `auth-utils.ts` pour supporter providers multiples | chore | Should | S (1 j) | Alice |
| TASK-107 | Mettre à jour la doc OpenAPI | doc | Should | XS (0,5 j) | Alice |
| TASK-108 | Bouton « Déconnexion » + clear cookie | feature | Could | XS (0,5 j) | Carol |

**Total estimé** : ~8,5 j-h sur 28 → confortable, marge pour les imprévus.

## Hors scope (V2)

- Multi-provider (Google, GitLab) — TASK-106 prépare le terrain.
- Avatar upload custom.
- Lier un compte GitHub à un compte email pré-existant.

## Bonus si reste du temps

- Sentry source maps upload.
- Lighthouse CI sur la PR.
