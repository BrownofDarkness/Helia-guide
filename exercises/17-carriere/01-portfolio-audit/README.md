# Exercice 17.1 — Audit de ton portfolio (& kit recherche d'emploi)

> **Axe** : 17 — Carrière & parcours
> **Difficulté** : intermédiaire
> **Durée estimée** : 8 à 16 h sur 1-2 semaines
> **Prérequis** : avoir au moins 1 projet déployé, axe 17 lu

## ⚙️ Avant de commencer

Cet exercice ne demande pas d'outils particuliers. Il demande **du temps de réflexion** et un peu d'humilité — tu vas regarder ton portfolio comme si tu étais un recruteur.

Outils suggérés :

- **Loom** ou **Tella** (gratuits) pour enregistrer un pitch vidéo de 60 s.
- **Canva** ou **Figma** pour les captures soignées.
- **resume.dev** ou simple Markdown → PDF pour le CV.

## 🎯 Objectifs pédagogiques

- **Auditer** honnêtement ton portfolio actuel.
- **Réécrire** un README projet selon le standard 2026.
- **Mettre à jour** ton CV avec des réalisations chiffrées.
- **Préparer** 5-7 stories STAR pour les entretiens comportementaux.
- **Calculer** un TJM cohérent si tu envisages le freelance.
- **Cadrer** un side-project avec un mini-Lean Canvas.

## 📋 Énoncé

Tu vas livrer **6 artefacts** :

1. **AUDIT.md** — auto-audit de ton portfolio actuel (notes / 10 par axe).
2. **README-PROJET-VITRINE.md** — README réécrit pour TON meilleur projet.
3. **CV.md** (et CV.pdf) — CV à jour avec réalisations chiffrées.
4. **STAR.md** — 5-7 stories STAR préparées.
5. **TJM.md** — calcul de ton TJM cible si tu envisages le freelance.
6. **LEAN-CANVAS.md** — mini-Lean Canvas pour un side-project (réel ou hypothétique).

## ✅ Critères d'acceptation

| Critère | Détail |
|---------|--------|
| **AUDIT.md** | Note honnête /10 sur 8 axes (cf canevas), au moins 3 actions concrètes |
| **README-PROJET-VITRINE.md** | Pourquoi/Quoi/Comment/Stack/Démo/Tests/Métriques |
| **CV.md** | 1 page max, ≥ 3 réalisations chiffrées, lien GitHub + démo |
| **STAR.md** | ≥ 5 stories, format SBI / STAR, ≥ 1 échec assumé |
| **TJM.md** | Calcul justifié, hypothèses (taux d'occupation, charges) |
| **LEAN-CANVAS.md** | 9 cases remplies, avec 1 « avantage déloyal » crédible |
| **Mise à jour effective** | Portfolio GitHub / LinkedIn / site perso mis à jour réellement |
| **Pitch 60 s** (bonus) | Loom du projet vitrine, démo + valeur livrée |

## 🛠 Démarrer

```bash
cd canevas/

# Copie les templates dans ton repo perso
cp AUDIT.md MON-AUDIT.md
cp CV.md MON-CV.md
# etc.

# Remplis-les sur 1-2 semaines, par 30-60 min de session
```

## 💡 Indices

<details>
<summary>1. Self-audit honnête</summary>

Le piège classique : tu te notes 7-8/10 partout, par confort. **Sois dur**.

Pour chaque axe (LinkedIn, GitHub, README, CV, démo en ligne, captures, présence pro, entretien), demande-toi :

- Si moi-même j'étais recruteur, je me classerais dans le top 25 % des candidats sur ce point ?
- Si non → note ≤ 6.

Mieux vaut une note basse honnête + un plan d'action qu'une note flatteuse stérile.

</details>

<details>
<summary>2. Réalisations chiffrées — comment trouver les chiffres</summary>

Tu n'as pas de chiffres ? Va les chercher :

- **GitHub** : nombre de PR mergées, lignes de code, contributions.
- **Lighthouse** avant / après (perf, a11y).
- **Sentry** / **PostHog** : taux d'erreur, latence p95, conversion.
- **Bundle size** avant / après ton refactor.
- **Time-to-market** : combien de jours pour shipper la feature.
- **Tests** : couverture, nombre de tests.
- **Incidents** : MTTR, fréquence.

Si vraiment aucun chiffre disponible, formule l'**impact qualitatif crédible** : « refonte de la stack auth qui a permis l'intégration de SSO en V2 ».

</details>

<details>
<summary>3. STAR — préparer ses échecs</summary>

L'échec assumé est ce qui distingue les profils sénior :

- Tu as **causé** quelque chose qui n'a pas marché.
- Tu **assumes** ta part de responsabilité (système ET individuelle).
- Tu as **tiré** une leçon concrète.
- Tu as **changé** quelque chose suite à l'échec.

Si tu n'as **vraiment** aucun échec, c'est probablement que tu n'as pas pris assez de risques. Note-le, et **prends-en** dans ton prochain projet.

</details>

<details>
<summary>4. TJM — fourchettes 2026 indicatives</summary>

Junior (1-2 ans) — déconseillé en freelance, mais si :
- 250-400 €/jour

Mid (3-5 ans) :
- 400-600 €/jour FR
- 500-700 €/jour scale-up
- 700-900 €/jour Big Tech-like, niche IA / Three.js / DevOps

Senior (5-10 ans) :
- 600-900 €/jour FR
- 900-1300 €/jour spécialisé

Lead / Tech advisor :
- 1000-1800 €/jour selon réputation

Hors France (US, Suisse, UK, Singapour) : multiplier par 1.5-3.

</details>

<details>
<summary>5. Lean Canvas — l'avantage déloyal</summary>

**Avantage déloyal** = ce qu'un concurrent ne peut PAS copier en 6 mois.

❌ Faux avantages déloyaux :
- « Notre tech est meilleure » (rattrapable).
- « On est first-mover » (peu durable).
- « On code mieux » (subjectif).

✅ Vrais avantages déloyaux :
- Réseau exclusif (clients déjà à toi).
- Donnée propriétaire (training data unique).
- Marque / communauté installée.
- Effet réseau (la valeur croît avec le nombre d'utilisateurs).
- Brevet / exclusivité contractuelle.
- Connaissance domaine rare (tu viens du métier que tu disrupte).

Si tu n'as rien : note-le honnêtement comme un point à construire.

</details>

## 🔑 Correction

Voir [`correction/`](./correction/) pour des exemples remplis (un audit fictif, un README modèle, un CV exemple, des stories STAR exemple).

## 📚 Pour aller plus loin

- Faire **relire** tes 6 artefacts par un dev senior de ton réseau.
- Postuler **3 fois** avec ton nouveau CV pour valider.
- **Passer un mock interview** sur Pramp / Interviewing.io.
- Re-faire le `MON-AUDIT.md` dans **6 mois** pour mesurer ta progression.
