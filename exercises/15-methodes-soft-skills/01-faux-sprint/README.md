# Exercice 15.1 — Faux sprint d'équipe

> **Axe** : 15 — Méthodes & soft skills
> **Difficulté** : intermédiaire (humain)
> **Durée estimée** : 2 semaines (calendrier) — 8 à 16 h de travail effectif
> **Prérequis** : axe 15 lu, repo Git existant, Linear OU GitHub Projects (au choix), 2-3 coéquipiers (ou solo en jouant les rôles)

## ⚙️ Avant de commencer

### Outils

| Outil | Free tier | Lien |
|-------|-----------|------|
| GitHub Projects | gratuit | déjà sur ton compte |
| Linear | 10 € / seat / mois (free pour ≤ 250 issues) | https://linear.app |
| Slack | gratuit (limité messages) | https://slack.com |

### Format

3 modes possibles :

1. **Équipe réelle** (2-4 amis ou collègues) — l'idéal.
2. **Solo split-brain** — tu joues PO, dev, reviewer. Plus de discipline mais excellente formation.
3. **Asynchrone distribué** — équipe répartie sur fuseaux différents, tout en async.

## 🎯 Objectifs pédagogiques

- **Pratiquer** les rituels Scrum / Kanban en condition réelle.
- **Écrire** des tickets que les autres peuvent prendre sans demander.
- **Reviewer** des PR avec Conventional Comments.
- **Capturer** une décision technique en ADR.
- **Mener** un post-mortem blameless suite à un incident.
- **Animer** une rétrospective qui produit des actions.

## 📋 Énoncé

L'équipe (réelle ou simulée) se donne **2 semaines** pour livrer une mini-feature sur un projet existant (peux être le canevas fourni, ou n'importe quel repo perso).

Tu dois :

1. **Préparer** : DoR / DoD affichées, backlog priorisé MoSCoW, 5-8 tickets bien écrits.
2. **Planifier** le sprint (objectif clair, capacité estimée).
3. **Tenir 3-5 dailies** (15 min max chacun) — async ou sync.
4. **Livrer 3-5 PR** avec revues croisées (Conventional Comments).
5. **Capturer une décision** en ADR.
6. **Faire la review** — démo + feedback stakeholders.
7. **Faire la rétro** — quoi améliorer.
8. **Inventer un incident** (par ex. : "le déploiement a planté en prod 30 min") et en faire le **post-mortem**.

## ✅ Critères d'acceptation

| Critère | Détail |
|---------|--------|
| DoR + DoD écrites et affichées | dans le repo ou dans Linear |
| Backlog avec ≥ 8 tickets | tous suivant le template |
| 3-5 dailies | trace dans Slack ou doc |
| 3-5 PR mergées | toutes avec ≥ 2 commentaires Conventional |
| 1 ADR | format Nygard, dans `docs/adrs/` |
| 1 post-mortem | format blameless, actions correctives nommées |
| 1 rétro produisant ≥ 2 actions concrètes | avec owner et deadline |
| 1 sprint review (démo) | 30 min max |

### Bonus

- **Pair programming** sur 1 ticket (Loom ou témoignage).
- **Mob programming** sur la décision technique de l'ADR.
- **Sprint goal** mémorable.
- **Métriques** : lead time + throughput après le sprint.
- **Sprint #2** : tu améliores ce que la rétro a identifié.

## 🛠 Démarrer

```bash
cd canevas/
# Lis STEPS.md pour le déroulé complet
```

### Phase 0 — Setup (J-1 / J0)

1. Affiche DoR + DoD dans `docs/process.md` (canevas fourni).
2. Crée 8 tickets dans Linear / GitHub Projects via le template `templates/issue.md`.
3. Priorise en MoSCoW.
4. Estime en T-shirt (XS / S / M / L / XL) ou en points (1, 2, 3, 5, 8).

### Phase 1 — Sprint planning (J0)

- Objectif du sprint (1 phrase)
- Tickets sélectionnés
- Owner par ticket
- Capacité connue (ex : « équipe de 2 = ~16 jours-h sur 2 sem »)

### Phase 2 — Sprint (J1 → J9)

- Daily (sync ou async) : « hier / aujourd'hui / blocage »
- PR + revue + merge
- ADR sur la décision technique
- Refinement régulier des tickets futurs

### Phase 3 — Fin de sprint (J10)

- Sprint review (démo + Q&A)
- Rétrospective (quoi a marché, quoi améliorer, ≥ 2 actions)
- Post-mortem sur l'incident fictif (template `templates/post-mortem.md`)

### Phase 4 — Rapport

Rédige `SPRINT_REPORT.md` :

- Objectif tenu / pas tenu, pourquoi
- Métriques : tickets done / pas done, lead time moyen
- Forces et faiblesses du sprint
- Actions reportées au sprint suivant

## 🧪 Vérifier

```bash
# Tickets bien écrits ? Sample 3 au hasard et lis-les avec un nouvel œil :
# - Le titre est-il actionnable ?
# - Les AC sont-ils testables ?
# - Out of scope explicite ?

# PR bien reviewed ? Pour chaque PR :
# - Au moins 1 'praise:'
# - Au moins 1 'suggestion:' ou 'question:'
# - Un 'issue (blocking):' uniquement si nécessaire

# Rétro a produit des actions ? Pour chaque action :
# - Owner ?
# - Deadline ?
# - Suivi prévu ?
```

## 💡 Indices

<details>
<summary>1. Erreurs fréquentes</summary>

- **Daily de 45 min** → coupe à 15 min strict.
- **PR de 1500 lignes** → splitter avant la review.
- **« LGTM »** sans relire → demande au reviewer de citer 1 chose précise.
- **Rétro qui pleure** sans action → impose 2 actions, owner, deadline.
- **Post-mortem qui blâme** → relis, retire les noms accusateurs, parle système.

</details>

<details>
<summary>2. Sprint goal exemples</summary>

- « Ajouter l'auth GitHub OAuth + page profil utilisable »
- « Réduire le LCP de la landing de 4 s à 2 s, mesuré en RUM »
- « Permettre la création d'une commande de bout en bout (sans paiement réel) »
- « Migrer les tests Jest vers Vitest sur le module pricing »

Un sprint goal **clair** rallie l'équipe. Sans, tout est de priorité égale.

</details>

<details>
<summary>3. Incident fictif — idées</summary>

- Migration de schéma Postgres bloquée 35 min en prod.
- Déploiement v1.2.0 avec import circulaire qui crash au boot.
- Régression CSS qui rend la landing illisible sur Safari.
- Webhook Stripe ignoré pendant 2h.
- Quota DB atteint, écritures rejetées.

Le but pédagogique est de **rédiger un post-mortem blameless** et d'identifier 3-5 actions correctives, pas de simuler des heures de débogage.

</details>

## 🔑 Correction

Voir [`correction/`](./correction/) pour un exemple complet de sprint réalisé : tickets remplis, PR avec commentaires, ADR, post-mortem, rétro avec actions.

## 📚 Pour aller plus loin

- Refait un sprint #2 en suivant les actions de la rétro.
- Invite un collègue extérieur en review d'un sprint pour feedback indépendant.
- Mesure ton **lead time** sur 3 sprints et regarde l'évolution.
- Lit *Accelerate* (DORA) et compare ton équipe aux profils.
