# Canevas — Audit de ton portfolio (& kit recherche d'emploi)

> **Aucun code à écrire.** Tu vas regarder ton portfolio, ton CV, ta présence en ligne **comme un recruteur** — avec un peu d'humilité — et produire **6 artefacts** qui élèvent ton profil au standard 2026.
>
> C'est l'exercice qui transforme « j'ai fait des projets » en « j'ai un dossier de candidature qui passe le filtre des recruteurs ». Et le moins enseigné de tous les axes.

## Ce que tu vas faire

Livrer **6 artefacts** sur 1–2 semaines (8–16 h de travail) :

| # | Artefact | Quoi | Durée |
|---|----------|------|-------|
| 1 | `AUDIT.md` | Auto-audit honnête sur 8 axes (note /10 + actions) | 1–2 h |
| 2 | `README-PROJET-VITRINE.md` | README pro pour ton meilleur projet | 2–3 h |
| 3 | `CV.md` (+ PDF) | CV 1 page avec **réalisations chiffrées** | 2–4 h |
| 4 | `STAR.md` | 5–7 stories STAR pour entretiens (≥ 1 échec assumé) | 2–3 h |
| 5 | `TJM.md` | Calcul TJM si freelance envisagé (hypothèses chiffrées) | 1 h |
| 6 | `LEAN-CANVAS.md` | Mini-Lean Canvas pour un side-project (réel ou hypothétique) | 1–2 h |

À la fin, tu sauras :
- **Te noter sans complaisance** sur LinkedIn, GitHub, README, CV, démo, captures, présence pro, entretien.
- **Chiffrer tes réalisations** (avant/après mesurés, pas du blabla).
- **Préparer un entretien comportemental** — la partie qui plante 70 % des candidats techniques.
- **Justifier un TJM** ou une fourchette de salaire avec hypothèses chiffrées.
- **Cadrer un side-project** sans tomber dans l'enthousiasme stérile.

## Pré-requis

- **Au moins 1 projet déployé** (axe 14.1 ou un side-project perso).
- **De l'humilité** — l'exercice fonctionne uniquement si tu te juges honnêtement.

### Outils suggérés (tous gratuits)

| Outil | Pour |
|-------|------|
| **Loom** ou **Tella** | Pitch vidéo 60 s du projet vitrine |
| **Canva** ou **Figma** | Captures soignées |
| **resume.dev** ou Markdown → PDF | CV propre |
| **GitHub Profile README** | Profil GitHub avec sommaire pinné |

## Démarche en 7 étapes

```
J0–J1   AUDIT.md         → score honnête
J2–J3   README projet    → réécriture du meilleur projet
J3–J4   CV.md            → 1 page chiffrée
J5–J6   STAR.md          → 5–7 stories
J7      TJM.md           → calcul justifié
J8      LEAN-CANVAS.md   → cadrage side-project
J9–J10  Mise à jour réelle GitHub / LinkedIn / site perso
J10+    (bonus) Pitch 60 s + 3 candidatures test
```

### 1. AUDIT.md — la note honnête (1–2 h)

Note-toi de 0 à 10 sur :

| Axe | Question test |
|-----|---------------|
| **LinkedIn** | Photo pro ? Title clair ? Réalisations chiffrées ? |
| **GitHub** | Profil README ? Pinned repos pertinents ? Commits récents ? |
| **README projets** | Démo accessible ? Captures ? Stack visible ? Métriques ? |
| **CV** | 1 page ? Réalisations chiffrées ? Pas de bullshit bingo ? |
| **Démo en ligne** | Lien qui marche ? Latence < 1 s ? Fonctionnel sans bug ? |
| **Captures / vidéos** | Visuels en phase ? Pas de blabla, démo immédiate ? |
| **Présence pro** | Twitter / dev.to / Bluesky avec contenu utile (pas spam) ? |
| **Entretien** | Tu peux raconter une story par axe en 90 s ? |

> ⚠️ **Le piège classique** : tu te notes 7-8/10 partout par confort. **Sois dur.** Si moi-même j'étais recruteur, je me classerais dans le top 25 % des candidats sur ce point ? Si non → note ≤ 6.

### 2. README-PROJET-VITRINE.md — réécrire ton meilleur projet (2–3 h)

Structure 2026 (cf. template canevas) :

1. **Tagline** en 1 ligne
2. **Pourquoi** (problème résolu)
3. **Démo** (live + Loom + login test)
4. **Stack** (tableau techno + raison du choix)
5. **Métriques** (LCP, bundle, coverage, uptime…)
6. **Démarrer en local** (`git clone` + 4 lignes, ça doit marcher)
7. **Tests + CI**
8. **Architecture** (diagramme ASCII OK)
9. **Limites assumées** (signe de maturité)
10. **Roadmap** publique
11. **Contact**

### 3. CV.md — 1 page chiffrée (2–4 h)

**Réalisations chiffrées** > responsabilités. Mauvais : « j'étais responsable de la perf ». Bon : « LCP de 3.4 s à 1.2 s mobile bridé, bounce −22 % ».

Où trouver les chiffres :

| Source | Métrique |
|--------|----------|
| GitHub | PR mergées, lignes, contributions |
| Lighthouse / WebPageTest | LCP, CLS, INP avant/après |
| Sentry / PostHog | Taux d'erreur, latence p95, conversion |
| Bundle analyzer | Bytes avant/après refactor |
| Vitest / Playwright | Couverture |
| Incidents | MTTR, fréquence |

Si **vraiment aucun chiffre** : impact qualitatif crédible. « Refonte stack auth qui a permis l'intégration SSO en V2. »

### 4. STAR.md — 5–7 stories pour les entretiens (2–3 h)

Format **S-T-A-R** :
- **S**ituation (contexte)
- **T**âche (ce qu'on attendait de toi)
- **A**ction (ce que tu as fait)
- **R**ésultat (chiffré)

Couvre les questions classiques :
- Conflit avec un collègue
- Décision technique difficile
- **Échec assumé** (au moins 1 — c'est ce qui distingue les sénior)
- Mentorat / collaboration cross-équipe
- Migration ou refacto importante
- Time-to-market sous pression

> 💡 **L'échec assumé** : si tu n'en as **vraiment** aucun, c'est probablement que tu n'as pas pris assez de risques. Note-le, et **prends-en** dans ton prochain projet.

### 5. TJM.md — calcul justifié (1 h)

Hypothèses à expliciter :

```markdown
- Salaire cible annuel net : 60 000 €
- Charges (URSSAF + impôts + retraite + mutuelle) : ×1.65 → brut 99 000 €
- Frais pro (matériel, formation, comptable) : 6 000 €/an
- Total à facturer : 105 000 €/an
- Jours facturables : 220 j × taux d'occupation 75 % = 165 j
- TJM cible = 105 000 / 165 = 636 € → arrondi à 650 €/j

→ Marché 2026 : Mid-level Frontend FR = 400-600. Mon TJM 650 = haut de fourchette.
   Justifié par : spécialisation perf (Lighthouse CI en CI), 5 ans XP, projets vitrine déployés.
```

Fourchettes 2026 indicatives :

| Profil | TJM FR |
|--------|--------|
| Junior (1–2 ans) | 250–400 € (déconseillé) |
| Mid (3–5 ans) | 400–600 € |
| Mid spécialisé (perf / sécu / IA) | 600–900 € |
| Senior (5–10 ans) | 600–900 € |
| Senior + niche | 900–1300 € |
| Lead / advisor | 1000–1800 € |

US / Suisse / UK / Singapour : ×1.5 à ×3.

### 6. LEAN-CANVAS.md — side-project cadré (1–2 h)

9 cases à remplir, ordre conseillé :

```
1. Problème → 2. Segments → 3. Proposition de valeur unique →
4. Solution → 5. Canaux → 6. Sources de revenus →
7. Coûts → 8. Métriques → 9. Avantage déloyal
```

**L'avantage déloyal** = ce qu'un concurrent ne peut PAS copier en 6 mois. Si tu n'en as pas, **note-le honnêtement** comme un point à construire.

❌ Faux avantages : « notre tech est meilleure », « on est first-mover ».
✅ Vrais avantages : réseau exclusif, donnée propriétaire, marque installée, effet réseau, brevet, connaissance domaine rare.

### 7. Mise à jour effective (1–2 h)

**Le piège** : produire 6 docs et ne **rien mettre à jour** dans la vraie vie. Pour valider l'exercice :

- [ ] LinkedIn updated (title, about, expériences chiffrées)
- [ ] GitHub Profile README mis à jour avec pinned repos
- [ ] Au moins 1 projet vitrine sur GitHub avec son nouveau README
- [ ] Site perso (s'il existe) à jour
- [ ] CV PDF généré et accessible

## Tester

Pas de test automatisé. Mais **3 tests humains** :

1. **Auto-test 24 h** : laisse reposer 24 h après écriture. Relis. Si tu trouves > 3 phrases creuses, réécris.
2. **Test pair** : envoie tes 6 artefacts à un dev de ton réseau (idéalement senior). Critique honnête.
3. **Test marché** : postule **3 fois** avec ton nouveau CV. Si tu n'as pas 1 réponse positive sur 3, retravaille (le CV ou le ciblage).

## Bloqué ?

- **Je ne sais pas comment me noter sur l'AUDIT** → règle simple : si tu hésites entre 7 et 8, note 6. Si tu hésites entre 5 et 6, note 4. La sous-évaluation est plus utile que la surévaluation.
- **Je n'ai aucune réalisation chiffrée à mettre dans le CV** → c'est un signal. Reviens à l'axe 13 et fais-toi un Lighthouse avant/après sur ton projet existant. Tu auras tes premiers chiffres en 2 h.
- **Je n'ai aucun échec à mettre dans STAR** → invente-le pas. Mais reconnais : tu n'as probablement pas pris assez de risques. Note-le dans l'AUDIT comme action prioritaire.
- **Mon TJM calculé semble trop élevé** → vérifie tes hypothèses (taux d'occupation, charges). 75 % d'occupation est optimiste pour un junior. Refait avec 65 % pour la 1ère année.
- **Mon Lean Canvas n'a pas d'avantage déloyal crédible** → assume-le explicitement. **Mieux vaut un Lean Canvas honnête sans avantage qu'un faux avantage**. Stratégie de compensation : qualité produit + prix + vitesse d'exécution.
- **Je n'ai pas le temps de tout faire en 1-2 semaines** → priorité : AUDIT.md (1 h) puis CV.md (2–4 h). Ça te donne déjà 80 % de la valeur. Le reste peut s'étaler sur un mois.

## Ne commit pas

`*.pdf` (génère localement, pas en repo public). `MON-AUDIT.md` (privé, garde-le ou anonymise avant de partager). Le CV peut être public — c'est même un signal positif sur GitHub.

## Comparer avec la correction

`../correction/` fournit **6 exemples remplis** par un dev fictif (Alice Dupont, 5 ans XP, mid → senior front, envisage le freelance) :
- `AUDIT-rempli.md` — auto-audit honnête avec scores et plan d'action
- `CV-rempli.md` — CV avec réalisations chiffrées
- `STAR-rempli.md` — 5 stories STAR (1 échec, 1 conflit, 3 succès)
- `TJM-rempli.md` — TJM 850 €/j justifié sur 8 hypothèses
- `LEAN-CANVAS-rempli.md` — side-SaaS Tasky Pro avec **avantage déloyal honnêtement faible**
- `README-PROJET-rempli.md` — TaskMaster Pro, README pro avec métriques mesurées

Compare **point par point**. Identifie 2–3 améliorations à appliquer aux tiens. Re-itère.

> 💡 **Re-faire le `AUDIT.md` dans 6 mois** te donne la mesure objective de ta progression. Plus utile que n'importe quel certificat.
