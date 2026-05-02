# Exercices du guide

Ce dossier contient les **canevas** et **corrections** de tous les exercices du guide. Tu peux le cloner et travailler dans ton IDE local, indépendamment du site.

> 📚 Site complémentaire : voir `/exercises/` sur le site déployé pour la liste interactive avec descriptions et boutons de téléchargement.

## Roadmap des exercices (ordre suggéré)

Ordre **non strictement linéaire** — tu peux zigzaguer selon ton parcours. Les prérequis sont indicatifs (axes du guide à avoir lus).

| # | Exercice | Difficulté | Durée | Prérequis | Tests ? |
|---|----------|-----------|-------|-----------|---------|
| **1.1** | [Tri téléchargements](./01-fondations/01-tri-telechargements/) | 🟢 facile | 30–60 min | Bash basique | ✅ 12/12 |
| **2.1** | [mini-curl Node](./02-web/01-mini-curl/) | 🟡 inter. | 2–4 h | Node ≥ 20 | ✅ 8/8 |
| **3.1** | [Bibliothèque personnelle](./03-analyse-conception/01-bibliotheque-personnelle/) | 🟡 inter. | 4–8 h | Axe 3 | ❌ doc-only |
| **4.1** | [Stack conteneurisée](./04-outils/01-stack-conteneurisee/) | 🟡 inter. | 2–4 h | Docker | ✅ 9/9 |
| **5.1** | [Refonte Lighthouse](./05-frontend-html-css/01-refonte-lighthouse/) | 🟡 inter. | 4–8 h | Node + Chrome | ✅ 4/4 Lighthouse |
| **6.1** | [SPA TypeScript pur](./06-javascript-typescript/01-spa-typescript/) | 🔴 avancé | 6–12 h | Node ≥ 20 + JS solide | ✅ 11/11 |
| **7.1** | [Dashboard Next.js](./07-frameworks-frontend/01-dashboard-nextjs/) | 🔴 avancé | 8–20 h | React + axe 6.4 | ✅ 2/2 |
| **8.1** | [taskly-api Node/TS](./08-backend/01-nodejs-typescript/taskly-api/) | 🔴 avancé | 8–16 h | Node + axe 6 + 9.1 SQL | ✅ 13/13 |
| **8.2** | [taskly-api Python/FastAPI](./08-backend/02-python/fastapi/taskly-api/) | 🔴 avancé | 8–16 h | Python 3.12 + 9.1 SQL | ✅ 3/3 |
| **8.3** | [taskly-api PHP/Laravel](./08-backend/03-php/laravel/taskly-api/) | 🔴 avancé | 8–16 h | PHP 8.3 + 9.1 SQL | ✅ revue statique |
| **9.1** | [E-commerce Postgres](./09-bases-de-donnees/01-ecommerce-postgres/) | 🔴 avancé | 6–12 h | Docker | ✅ 9/10 < 200 ms |
| **10.1** | [SaaS minimal](./10-baas/01-saas-minimal/) | 🔴 avancé | 12–24 h | 6 comptes (Clerk, Stripe…) | ❌ intégration |
| **11.1** | [Refactor + tests](./11-qualite-tests/01-refactor-tests/) | 🟡 inter. | 6–12 h | Node | ✅ 31/31, 100 % cov |
| **12.1** | [Audit OWASP](./12-securite/01-audit-owasp/) | 🟡 inter. | 6–12 h | Axe 8 + curl | ✅ 8/8 régressions |
| **13.1** | [Audit perf+a11y+i18n](./13-performance-a11y/01-audit-perf-a11y-i18n/) | 🔴 avancé | 8–16 h | Chrome | ✅ 99/100/100 Lighthouse |
| **14.1** | [Déploiement complet](./14-devops/01-deploiement-complet/) | 🔴 avancé | 12–30 h | Comptes Fly+Sentry | ⚠️ infra-only |
| **15.1** | [Faux sprint d'équipe](./15-methodes-soft-skills/01-faux-sprint/) | 🟡 inter. | 2 sem. | aucun | ❌ process |
| **16.1** | [Assistant RAG](./16-specialisations/01-assistant-rag/) | 🔴 avancé | 8–16 h | Postgres + clés Anthropic/OpenAI | ⚠️ schéma OK |
| **17.1** | [Audit portfolio](./17-carriere/01-portfolio-audit/) | 🟡 inter. | 8–16 h | aucun | ❌ doc-only |

**Total** : ~140–250 h de pratique (auto-évaluation : tu finiras sans doute 12–14 sur 19 exercices, c'est très bien).

## Parcours conseillés

### Parcours « débutant complet, 6–9 mois plein temps »

Linéaire sauf 9.1 avancé avant 8.1 :

```
1.1 → 2.1 → 3.1 → 4.1 → 5.1 → 6.1 → 7.1
                                       ↓
                                     9.1 (SQL fondamentaux)
                                       ↓
                                    8.1 (au choix : Node OU Python OU PHP)
                                       ↓
                                  10.1 → 11.1 → 12.1 → 13.1 → 14.1 → 15.1 → 16.1 → 17.1
```

### Parcours « reconversion, 4–8 mois »

Skip 1.1, 2.1 (revus rapidement). Commence à 3.1, et fais 17.1 **en parallèle** dès 4.1.

### Parcours « junior consolidant, 2–4 mois »

Cible les axes faibles. Refais 8.1 (au moins) + 11.1 + 12.1 + 14.1 sont les 4 qui élèvent le plus.

### Parcours « senior visant lead/staff »

Skip les exos de fondation. Cible : 14.1 + 16.1 + lectures 8.4 (archis) + 8.5 (protocols) + relecture 12.1 mode B.

## Convention de chaque exercice

Chaque dossier d'exercice contient :

### `README.md` (énoncé)
- 🎯 **Objectifs pédagogiques** : ce que tu dois retenir
- ⚙️ **Pré-requis outils** (Node, Python, Docker, comptes API…)
- 📋 **Énoncé** : le problème, sans guider la solution
- ✅ **Critères d'acceptation** : comment savoir que c'est fini
- ⏱️ **Difficulté & durée estimée**
- 💡 **Indices** (repliés)

### `canevas/` (à compléter)
- Le squelette de code à compléter
- Un `README.md` pédagogique : Ce que tu vas faire / Pré-requis / Démarrer / Structure / TODO / Tester / Bloqué ? / Ne commit pas

### `correction/` (référence)
- Solution complète et commentée
- Un `README.md` en **format 8 sections** : Pré-requis / Vue d'ensemble / Choix techniques / Validation / Pièges réels / Pour aller plus loin

### `tests/` (si applicable)
- Tests automatisés qui valident la solution
- Ton « filet de sécurité » pour t'auto-évaluer sans regarder la correction

## Comment utiliser ce dossier

```bash
# 1. Clone le dépôt complet
git clone <repo-url>
cd web_learning/exercises/01-fondations/01-tri-telechargements/canevas/

# 2. Lis le README.md de l'exercice (situé un dossier au-dessus)
cat ../README.md

# 3. Travaille dans canevas/
# (les commandes exactes dépendent de l'exercice — voir canevas/README.md)

# 4. Bloqué ? Lis la section "Bloqué ?" du README canevas
# 5. Toujours bloqué ? Compare avec ../correction/README.md
```

## Mode auto-évaluation

Pour chaque exercice avec ✅ tests, lance-les après ton implémentation **avant** de regarder la correction. C'est ton signal objectif.

```bash
cd <exercice>/tests/
npm install && npm test    # ou ./run.sh, bash smoke.sh, uv run pytest, etc.
```

## Points de friction connus

| Friction | Solution |
|----------|----------|
| **better-sqlite3 ne build pas sur Windows + Node 24** | Tous les exos migrent vers `@libsql/client` (drop-in async) — voir piège dédié |
| **Vitest 2.x + Node 24 instable** | Tous les exos sont migrés vers Vitest 3.x |
| **`<Diagram>` dans le contenu** | Composant réel basé Mermaid — fonctionne sans install supplémentaire |
| **Comptes API 10.1 (Clerk, Stripe, Supabase, Resend)** | Free tiers généreux — voir README parent pour les liens |
| **Comptes 14.1 (Fly, Sentry, Better Stack)** | Free tiers — ~10 €/mo si tu déploies vraiment |

## État global (mai 2026)

✅ **19 exercices** (1.1 à 17.1, plus 8.2 et 8.3) avec canevas + correction + READMEs en format pédagogique.
✅ **15 exercices avec tests automatisés** validés (smoke tests live confirmés).
✅ **4 exercices doc-only ou config-only** (3.1, 10.1, 15.1, 17.1) — pas de tests possibles, mais critères d'acceptation explicites.
