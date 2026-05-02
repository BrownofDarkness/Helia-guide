# Correction — Audit portfolio (& kit recherche d'emploi)

> 6 artefacts remplis par un dev fictif : **Alice Dupont**, 5 ans XP, mid → vise senior front, envisage le freelance dans 12 mois. **Pas une vérité unique** — un exemple sérieux à comparer à ton propre travail.
>
> Lis-la **après ton implémentation**. La valeur de cet exercice est dans la **discipline d'auto-évaluation**, pas dans le résultat final.

## Sommaire

1. [Pré-requis et lancement](#1-pré-requis-et-lancement)
2. [Vue d'ensemble — 6 artefacts d'Alice](#2-vue-densemble--6-artefacts-dalice)
3. [Profil d'Alice (contexte)](#3-profil-dalice-contexte)
4. [Ce qui rend ces artefacts « bons »](#4-ce-qui-rend-ces-artefacts--bons-)
5. [Anti-patterns que la correction évite](#5-anti-patterns-que-la-correction-évite)
6. [Comment t'en servir](#6-comment-ten-servir)
7. [Pièges réels rencontrés](#7-pièges-réels-rencontrés)
8. [Pour aller plus loin](#8-pour-aller-plus-loin)

---

## 1. Pré-requis et lancement

Pas de code à exécuter. Juste à **lire** les artefacts et **comparer** aux tiens.

```bash
ls correction/
# AUDIT-rempli.md
# CV-rempli.md
# LEAN-CANVAS-rempli.md
# README-PROJET-rempli.md
# STAR-rempli.md
# TJM-rempli.md
```

## 2. Vue d'ensemble — 6 artefacts d'Alice

| Artefact | Lignes | Quoi |
|----------|--------|------|
| `AUDIT-rempli.md` | 44 | Auto-audit 8 axes (LinkedIn, GitHub, …) avec scores honnêtes (5–8/10) et plan d'action |
| `CV-rempli.md` | 64 | CV 1 page, 8 réalisations chiffrées, lien GitHub + démo + Lighthouse score |
| `STAR-rempli.md` | 85 | 5 stories STAR (1 échec assumé, 1 conflit, 3 succès) |
| `TJM-rempli.md` | 71 | TJM cible 850 €/j justifié sur 8 hypothèses chiffrées |
| `LEAN-CANVAS-rempli.md` | 110 | Tasky Pro (side-SaaS) — 9 cases + **avantage déloyal honnêtement faible** |
| `README-PROJET-rempli.md` | 145 | TaskMaster Pro — README modèle 2026 (badges, stack, métriques, ADR, roadmap publique) |

**Total ~520 lignes de markdown** — soit ~6 h de rédaction sérieuse. Si tu mets 30 h, tu peaufines trop ; si tu mets 1 h, tu bâcles. La fourchette saine = **6–12 h de rédaction effective**.

## 3. Profil d'Alice (contexte)

Pour interpréter les scores et choix :

- **5 ans d'expérience** : Lead Frontend depuis 2 ans, Frontend mid avant.
- **Stack** : React 19 + Next.js 16 + Tailwind v4 + Hono + Postgres.
- **Localisation** : Paris ou remote France.
- **Objectif court terme** : passer de Lead à **Senior** (titre + responsabilités) en 6 mois.
- **Objectif moyen terme** : devenir **freelance** dans 12–18 mois (TJM cible 850 €/j).
- **Side-project** : TaskMaster Pro (axe 14.1 + 8.1 + 13.1 + 12.1 fusionnés).

C'est un profil **mid-senior crédible** — ni junior qui se survend, ni hardcore senior 12 ans. La fourchette où la majorité des lecteurs se trouvent.

## 4. Ce qui rend ces artefacts « bons »

### 4.1 AUDIT honnête (notes 5–8/10, pas 8–10)

```markdown
| Axe | Score | Justification |
|-----|-------|----------------|
| LinkedIn | 6/10 | Photo OK, title clair, mais pas de réalisations chiffrées dans "About" |
| GitHub | 7/10 | Profil README à jour, 3 pinned repos, mais activité commit irrégulière |
| README projets | 5/10 | TaskMaster a un README minimal, les autres sont vides |
| CV | 4/10 | 2 pages au lieu de 1, pas de chiffres, format Word des années 2010 |
| Démo en ligne | 3/10 | TaskMaster down depuis 2 mois (Fly free tier scaled to zero) |
```

**Notes 3 et 4 honnêtes** = signal de maturité. Personne n'est 9/10 partout. Le top 25 % des candidats sont 6–7/10 sur la plupart des axes et 8+ sur 1–2 axes spécialisés.

### 4.2 CV : réalisations chiffrées (pas de bullshit bingo)

```markdown
- Refonte du dashboard React → Next.js 16 + RSC :
  LCP 3.4s → 1.2s (mobile bridé), bounce rate -22 %
- Mise en place CI Lighthouse + axe-core :
  0 régression perf / a11y sur les 80 PR mergées depuis
- Lead refonte design system Tailwind v4 + Radix UI :
  -40 % de duplications CSS, adopté par 3 équipes
- Mentor 2 juniors, 100 % accédés au mid-level en 12 mois
```

**Chaque bullet** : un verbe d'action + un chiffre + un impact mesurable. Pas « j'étais responsable de la perf », mais « j'ai fait passer le LCP de X à Y ».

### 4.3 STAR : 1 échec assumé qui élève le profil

```markdown
## Story 4 — Échec : migration v18 cassée (assumée)

**Situation** : Migration React 17 → 18 sur le dashboard, prévue 1 sprint.

**Tâche** : J'étais lead du projet. Décision de tout migrer d'un coup
(au lieu de feature-flags incrementaux comme conseillé par un sénior).

**Action** : Push de la PR un vendredi soir. Rollback obligatoire dimanche
matin (StrictMode a révélé 4 effets de bord en prod).

**Résultat** : 14 h de downtime du dashboard interne. Refait en 3 sprints
avec feature flags. Coût direct ~1500 € de salaires d'astreinte.

**Leçon** : J'ai sous-estimé les effets de bord StrictMode + j'ai déployé
sans le sénior présent. Depuis : règle perso "pas de migration majeure
sans co-review d'un sénior + déploiement progressif obligatoire".
```

**4 ingrédients** :
1. Tu as **causé** quelque chose qui n'a pas marché.
2. Tu **assumes** ta part (pas « le système m'a forcé »).
3. Tu as **tiré une leçon concrète**.
4. Tu as **changé** quelque chose dans tes habitudes.

Sans ces 4, c'est juste une victimisation. Avec, c'est un signal de maturité que les recruteurs **adorent**.

### 4.4 TJM : 8 hypothèses explicites

```markdown
## Calcul

| Hypothèse | Valeur |
|-----------|--------|
| Salaire net annuel cible | 60 000 € |
| Charges (URSSAF + impôts + retraite) | ×1.65 → 99 000 € brut |
| Frais pro (matériel, formation, mutuelle, comptable) | 6 000 € |
| Total à facturer / an | 105 000 € |
| Jours ouvrés / an | 220 |
| Taux d'occupation (réaliste 1ère année) | 70 % |
| Jours facturables | 154 |
| **TJM = 105 000 / 154** | **682 €** → arrondi **700 €** |

**Marge** : 850 €/j (TJM positionné) couvre :
- Année 2 : taux d'occupation 80 % → revenu net +12 %
- Imprévu (1 mois sans mission) : couvert par marge
- Investissements (formation, hardware) : couverts
```

**8 hypothèses chiffrées explicites** = tu peux **défendre** ton TJM en négociation. « Pourquoi 850 ? » → tu sors le tableau.

### 4.5 Lean Canvas : avantage déloyal honnêtement faible

```markdown
## 9. Avantage déloyal

> ⚠️ **Honnêtement, je n'ai pas d'avantage déloyal solide à ce stade.**

Ce que je n'ai pas :
- Pas de réseau client pré-existant.
- Pas de donnée propriétaire.
- Pas de marque / communauté installée.

Ce que je construis :
- Connaissance domaine : 5 ans dans des équipes de 5–30, douleur vécue.
- Vitesse d'exécution : full-stack solo capable de shipper 1 feature / sem.
- Audience : 1500 followers tech sur Twitter à shipping → ~5K en 6 mois.

À 12 mois si traction : la communauté autour du projet devient l'avantage.
Avant ça, je dois assumer que je suis vulnérable et compenser par la
**qualité du produit** + le **prix imbattable**.
```

**Honnêteté > flatterie**. Mieux vaut un Lean Canvas qui dit « pas d'avantage solide encore, voici ma stratégie de compensation » qu'un faux avantage (« notre tech est meilleure »).

### 4.6 README projet : 11 sections + métriques mesurées

Voir [`README-PROJET-rempli.md`](./README-PROJET-rempli.md). Structure :

```
1. Tagline
2. Pourquoi
3. Démo (live + Loom + login test)
4. Stack (table avec raison du choix)
5. Métriques (LCP 1.2s, bundle 86 KB, coverage 81 %, uptime 99.94 %)
6. Démarrer en local (4 lignes)
7. Tests
8. Architecture (diagramme ASCII)
9. Démarches qualité
10. Limites assumées
11. Roadmap publique
```

**Le « limites assumées »** est le signal qui te fait passer du débutant au senior. Reconnaître ce que ton projet **ne fait pas** est plus crédible que prétendre tout couvrir.

## 5. Anti-patterns que la correction évite

| Anti-pattern | Symptôme dans le portfolio | Comment la correction évite |
|---|---|---|
| **CV en 2+ pages** | Recruteur ne lit que la 1 | 1 page strict, sans paragraphe d'« About » |
| **Bullet points sans chiffres** | « J'étais responsable de la perf » | Chaque bullet a un avant/après mesuré |
| **Stack sans raison du choix** | Liste de buzzwords | Tableau avec colonne « Pourquoi » |
| **Démo cassée** | Lien 404 ou Vercel "deployment failed" | Lighthouse score + login test fournis |
| **Self-audit complaisant** | 9/10 partout | 5/10 et 4/10 honnêtes |
| **Lean Canvas avec faux avantage** | « On est meilleurs que la concurrence » | Reconnaissance honnête de l'absence d'avantage |
| **TJM rond sans justification** | « 800 €/j parce que je le veux » | Calcul à partir du salaire cible + charges |
| **STAR sans échec** | Que des success stories | 1 échec assumé sur 5 stories |
| **README sans métriques** | Capture d'écran + texte | LCP, bundle, coverage, uptime mesurés |

## 6. Comment t'en servir

### Étape 1 — Compare axe par axe (1 h)

Pour chaque artefact : lis le tien, lis celui d'Alice, **note 1–2 différences**.

| Artefact | Le mien | Celui d'Alice | Action |
|----------|---------|---------------|--------|
| AUDIT | 8/10 sur LinkedIn | 6/10 honnête | Re-noter 6 honnêtement |
| CV | « Refacto auth » | « Refacto auth qui a permis SSO V2, +18 % conversion » | Chiffrer mes bullets |
| STAR | 5 success stories | 4 success + 1 échec | Trouver mon échec |

### Étape 2 — Applique 2–3 améliorations (2–3 h)

Pas tout. Choisis **2–3 changements à fort impact** et applique-les.

### Étape 3 — Teste sur le marché (1 mois)

- Postule **3 fois** avec ton nouveau CV.
- Demande feedback à **1 dev senior** de ton réseau.
- Re-fais le `AUDIT.md` dans **6 mois** pour mesurer la progression.

## 7. Pièges réels rencontrés

3 pièges typiques dans cet exercice :

1. **Note de complaisance** sur l'AUDIT → règle : si tu hésites entre 7 et 8, note 6. Si tu hésites entre 5 et 6, note 4.
2. **Échec STAR inventé** → reconnaissable car il manque la part « j'assume ma responsabilité ». Mieux vaut **0 échec qu'1 faux échec**. Si tu n'en as pas, note-le dans AUDIT comme action prioritaire (« prendre plus de risques »).
3. **Avantage déloyal forcé** dans le Lean Canvas → si tu n'en as pas, **dis-le**. Les VC / mentors préfèrent une équipe lucide à une équipe qui se ment.

Aucun nouveau piège global à capturer dans `pieges.ts` — ce sont des spécificités carrière bien documentées sur place.

## 8. Pour aller plus loin

- **Faire relire tes 6 artefacts par un dev senior de ton réseau.** Coût : 30 min de leur temps + 1 café offert. Bénéfice : feedback honnête qu'aucun coéquipier de même niveau ne pourra te donner.

- **Postuler 3 fois avec ton nouveau CV** pour valider. Si 0 réponse positive sur 3 ciblées, retravaille (CV ou ciblage).

- **Mock interview** sur Pramp / Interviewing.io / Tech Mock Interview Discord. Tu identifies tes 2–3 trous en moins de 2 h.

- **Re-faire l'AUDIT dans 6 mois** pour mesurer la progression objective. Plus utile que n'importe quel certificat.

- **Suivre l'évolution de ton GitHub Profile** : nombre de stars sur ton projet vitrine, contributions externes (PR sur des libs), followers. Ces métriques sont publiques et **vérifiables** par les recruteurs.

- **Construire l'audience qui devient ton avantage déloyal** : 1 post technique / semaine sur dev.to / Bluesky / personal blog. À 12–18 mois, tu peux **choisir tes missions** plutôt que candidater.

- **Lire « The Staff Engineer's Path »** (Tanya Reilly) si tu vises Staff/Lead à terme. Le passage Senior → Staff est plus politique que technique.

- **Considérer le format DOOR** (au-delà du STAR) : Decision-making, Observation skills, Open communication, Resilience. Cadre plus moderne pour les entretiens 2026.
