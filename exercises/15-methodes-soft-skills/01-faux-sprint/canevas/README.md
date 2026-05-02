# Canevas — Faux sprint d'équipe

> **Aucun code à écrire** dans cet exercice. Tu vas vivre les **rituels d'un sprint pro** sur 2 semaines (calendrier) — DoR/DoD, backlog priorisé, dailies, PR avec Conventional Comments, ADR, post-mortem, rétro — sur n'importe quel mini-projet existant.
>
> C'est l'exercice le plus inhabituel du guide : il faut accepter que **lire un livre** ne suffit pas pour Scrum/Kanban. Il faut **les pratiquer**. Cet exercice est ton terrain d'entraînement.

## Ce que tu vas faire

| Phase | Quand | Sortie |
|-------|-------|--------|
| **0 — Setup** | J−1 / J0 (1–2 h) | DoR + DoD + 8 tickets + sprint goal |
| **1 — Sprint planning** | J0 (45 min) | Capacité + tickets sélectionnés + owners |
| **2 — Sprint** | J1 → J9 | 3–5 dailies + 3–5 PR + 1 ADR |
| **3 — Fin de sprint** | J10 | Review (démo) + Rétro + Post-mortem incident fictif |
| **4 — Rapport** | J10 + 1 | `SPRINT_REPORT.md` |

À la fin, tu sauras :
- **Écrire un ticket** que quelqu'un d'autre peut prendre sans demander (DoR, AC testables, out of scope explicite).
- **Reviewer une PR** en mode constructif (Conventional Comments : `praise:`, `suggestion:`, `question:`, `issue (blocking):`).
- **Capturer une décision** technique en ADR (Status / Context / Decision / Consequences).
- **Animer une rétro** qui produit **2 actions concrètes** avec owner et deadline (pas un défouloir).
- **Rédiger un post-mortem blameless** qui pointe les **systèmes**, pas les **personnes**.

## Pré-requis

### Format (3 modes possibles)

| Mode | Idéal pour | Difficulté |
|------|------------|------------|
| **Équipe réelle** (2-4 amis ou collègues) | Apprentissage authentique | 🟢 plus facile |
| **Solo split-brain** | Discipliné, pas d'équipe sous la main | 🟡 médian |
| **Asynchrone distribué** | Équipe répartie sur fuseaux différents | 🔴 plus dur |

Le **solo split-brain** consiste à jouer **3 rôles** distincts : PO (qui priorise), dev (qui code), reviewer (qui critique). Tu changes de chapeau pour chaque action. Plus de discipline mais formation excellente.

### Outils

| Outil | Free tier | Pour quoi |
|-------|-----------|-----------|
| **GitHub Projects** | gratuit | Backlog + Kanban — sur ton compte GitHub |
| **Linear** | free pour ≤ 250 issues | Alternative plus rapide à GitHub Projects |
| **Slack ou Discord** | gratuit | Dailies async + comm |

### Repo de support

Choisis **un repo existant** (perso ou un fork) où tu vas livrer une mini-feature. Suggestions :
- `taskly-api` (axe 8.1) — ajouter une feature (ex. tags sur les tâches)
- Ton portfolio — refondre la page contact
- Un projet open-source qui t'intéresse — corriger 3 bugs étiquetés `good first issue`

## Démarrer

```bash
cd canevas/
# Lis STEPS.md pour le déroulé. Les 7 templates sont dans templates/.
ls templates/
# adr.md, dor-dod.md, issue.md, post-mortem.md, pr-template.md, retro.md, sprint-report.md
```

## Phase 0 — Setup (J−1 / J0)

### 1. DoR + DoD

Adapte le template `templates/dor-dod.md` puis affiche-le **dans le repo** (`docs/process.md` par exemple).

- **DoR (Definition of Ready)** : un ticket prêt à être pris a quoi ?
- **DoD (Definition of Done)** : un ticket terminé a quoi ?

Exemples DoR : « titre actionnable », « critères d'acceptation testables », « out of scope explicite ».
Exemples DoD : « PR mergée », « tests verts », « doc mise à jour », « pas de TODO commenté ».

### 2. 8 tickets via le template

```markdown
# [feat] Ajouter le tag à une tâche                     ← titre actionnable

**Contexte** : on veut classifier les tâches.
**Story user** : En tant qu'utilisateur, je veux …
**Critères d'acceptation** :
- [ ] POST /tasks/:id/tags ajoute un tag
- [ ] GET /tasks?tag=foo filtre
**Out of scope** : édition / suppression de tag (ticket suivant).
**Estimation** : M (3 j)
**Priorité MoSCoW** : Must
```

### 3. MoSCoW

Trie : **Must** (3-4) / **Should** (2-3) / **Could** (1-2) / **Won't this sprint** (le reste).
Si tout est `Must`, tu n'as rien priorisé.

### 4. Sprint goal en 1 phrase

> « Un user peut tagger ses tâches et les filtrer par tag. »

Mémorable, vérifiable, livrable en 2 semaines. Si tu n'arrives pas à formuler en 1 phrase, ton sprint est trop éparpillé.

## Phase 1 — Sprint planning (J0, 45 min)

- **Capacité** : « Équipe = 3 dev × 8 j-h × 70 % focus = 16,8 j-h ».
- **Sélection** : ne sélectionne que ce qui rentre dans la capacité, pas plus.
- **Owner par ticket** : qui prend quoi.
- **Sprint goal validé** par tous : si quelqu'un n'y croit pas, on en discute maintenant, pas dans 1 semaine.

## Phase 2 — Sprint (J1 → J9)

### Dailies (15 min max)

Async (thread Slack 9h-9h30) ou sync. Format **3 questions** :
1. Hier : qu'as-tu fait ?
2. Aujourd'hui : que vas-tu faire ?
3. Blocage : as-tu besoin d'aide ?

**Pas de discussion technique** dans le daily — on note les sujets et on les traite après.

### PR + revue

Suis `templates/pr-template.md` :

```markdown
## Quoi
Ajout du tag sur les tâches (closes #101).

## Pourquoi
Cf. [TASK-101.md](./TASK-101.md) — besoin user.

## Comment tester
1. POST /tasks/1/tags { name: "urgent" }
2. GET /tasks?tag=urgent → doit lister la tâche

## Captures / GIF
[…]

## Checklist
- [x] Tests verts
- [x] Doc à jour
- [ ] Migration DB (à venir dans #105)
```

Et la review en **Conventional Comments** :

| Préfixe | Sens |
|---------|------|
| `praise:` | Positif — souligne ce qui est bien fait |
| `suggestion:` | Idée d'amélioration non bloquante |
| `question:` | Vraie question (pas un reproche déguisé) |
| `issue (blocking):` | Vraie objection bloquante |
| `nitpick:` | Détail sans impact (style mineur, etc.) |

Une PR sans `praise:` est probablement passée à côté de quelque chose de bien. Une PR sans `suggestion:` est probablement trop superficiellement reviewed.

### ADR

Pendant le sprint, tu vas faire **un choix technique non-évident** (ex. « hash bcrypt vs argon2 », « Server Components vs Client », « Postgres vs SQLite »). Capture-le dans `templates/adr.md` :

```markdown
# ADR-001 — Stocker les tokens OAuth chiffrés au repos

## Statut
Acceptée — 2026-05-08

## Contexte
[…]

## Décision
[…]

## Conséquences
[…]

## Alternatives considérées
1. Plain text — rejeté car X
2. Vault HashiCorp — rejeté car Y (overkill pour notre taille)
```

L'ADR est court (1 page), daté, **pas mis à jour** (il fige une décision à un instant T). Si la décision change, on crée un ADR-002 qui annule l'ADR-001.

## Phase 3 — Fin de sprint (J10)

### Sprint review (30 min max)

Démo du sprint goal, Q&A. Pas de slides — on montre **ce qui marche**.

### Rétro (45 min)

Format **Start / Stop / Continue** :
- **Start** : qu'est-ce qu'on devrait commencer à faire ?
- **Stop** : qu'est-ce qu'on devrait arrêter ?
- **Continue** : qu'est-ce qui marche bien et qu'on devrait garder ?

**Sortie obligatoire** : **2 actions concrètes** avec owner et deadline. Pas 10 (rien ne sera fait), pas 0 (rétro = défouloir inutile).

### Post-mortem incident fictif

**Invente un incident** crédible :
- Migration DB qui plante 35 min en prod
- Webhook Stripe ignoré pendant 2 h
- Régression CSS qui rend la landing illisible sur Safari
- Quota DB atteint, écritures rejetées

Rédige le post-mortem avec `templates/post-mortem.md`. Format **blameless** :
- **Timeline factuelle** (TZ explicite)
- **Root cause technique** + **contributing factors**
- **5 actions correctives** avec owner et deadline
- **What went well** (souvent oublié — important pour le moral)

## Phase 4 — `SPRINT_REPORT.md`

Bilan chiffré + ressenti :

```markdown
# Sprint Report — Sprint 1 (2026-05-04 → 2026-05-15)

## Objectif
Un user peut tagger ses tâches et les filtrer par tag.

## Résultat
✅ Atteint à 80 % — le filtre est livré, le tag complexe (couleurs) reporté.

## Métriques
- Tickets done : 6 / 8
- Lead time moyen : 2.3 j
- PR moyenne : 180 lignes (1 PR de 600 lignes — à splitter au prochain sprint)

## Ce qui a marché
- Sprint goal mémorable
- Async dailies (gain de temps)

## Ce qui a coincé
- Refinement insuffisant → 2 tickets découverts trop tard

## Actions reportées
- TASK-105 (suppression tag) → Sprint 2
```

## Bloqué ?

- **Je n'ai pas d'équipe** → fais le solo split-brain. Joue PO le J0, dev les J1–J9, reviewer en revenant sur tes propres PR le lendemain (relire à froid expose les biais).
- **Je n'arrive pas à tenir un daily de 15 min** → tu confonds **daily** (sync rapide sur progrès) et **refinement** (préparation des tickets futurs). Le daily ne discute pas la solution, il identifie les blocages. Le refinement, c'est 1×/semaine, 1 h.
- **Mes tickets sont mal écrits** → si quelqu'un a besoin de te poser 3 questions avant de prendre, le ticket n'est pas DoR. Re-rédige avec **contexte + AC testables + out of scope**.
- **Je sèche sur l'incident fictif à inventer** → c'est exactement le but : t'obliger à imaginer un échec crédible. Si tu manques d'inspiration, vole une histoire vue dans une présentation à une conf, ou un post-mortem public (Cloudflare, GitLab, AWS publient régulièrement les leurs).
- **Ma rétro produit 0 action** → l'animateur (toi) doit imposer **2 actions concrètes**, owner et deadline. Sinon la rétro = défouloir → personne n'y croit, et la suivante perd 50 % de participation.
- **Mon post-mortem accuse une personne** → relis et remplace **chaque mention d'un nom** par « le système / l'outil / la doc / le process ». Si l'erreur vient d'une commande dangereuse mal documentée, le fix n'est pas « former la personne », c'est « réduire la dangerosité de la commande ».
- **Mes PR font 1500 lignes** → split. Une PR > 400 lignes est rarement reviewed sérieusement. Stratégies : (1) extraire les helpers en commits préparatoires, (2) merger derrière un feature flag, (3) coder en stacked PRs.

## Ne commit pas

Rien de spécial — c'est un exercice process. Si ton repo de support a des secrets, vérifie ton `.gitignore` avant de pousser.

## Comparer avec la correction

`../correction/` montre un sprint complet réalisé par une équipe fictive de 3 dev (Alice, Bob, Carol) sur `taskly-api`. Tu y trouveras :

- **`BACKLOG.md`** : 8 tickets MoSCoW + capacité + sprint goal
- **`TASK-101.md`** : exemple de ticket bien écrit
- **`PR-42-review.md`** : trace de revue avec Conventional Comments
- **`ADR-007-stockage-token-oauth.md`** : ADR sur le chiffrement des tokens
- **`POST_MORTEM-2026-05-09.md`** : post-mortem blameless complet
- **`RETRO-Sprint-1.md`** : rétro Start/Stop/Continue avec 2 actions
- **`SPRINT_REPORT.md`** : bilan chiffré

**Ce n'est pas une checklist à reproduire mécaniquement.** Adapte à TON contexte (taille d'équipe, type de produit, maturité). Le but est d'avoir vécu **les 7 rituels**, pas d'avoir produit 7 docs identiques.
