# Exercice 5.1 — Refonte Lighthouse

> **Axe** : 5 — Frontend HTML & CSS
> **Difficulté** : intermédiaire
> **Durée estimée** : 4 à 8 heures
> **Prérequis** : axe 5 lu, **Node.js ≥ 20** + **Chrome / Chromium** (voir ci-dessous)

## ⚙️ Avant de commencer — outils nécessaires

### Node.js ≥ 20

Pour servir la page localement et lancer Lighthouse en CI. Si pas installé, voir la section [« Installer Node.js »](../../02-web/01-mini-curl/README.md#-avant-de-commencer--installer-nodejs) de l'exercice 2.1.

```bash
node --version       # v20.x.x ou plus récent
```

### Chrome (ou Chromium / Edge)

Lighthouse a besoin d'un navigateur **basé Chromium**.

| OS | Méthode |
|----|---------|
| **Toutes plateformes** | [google.com/chrome](https://www.google.com/chrome/) |
| **Linux (sans GUI)** | `sudo apt install chromium-browser` |
| **Windows / macOS** | Edge (Chromium) installé par défaut suffit aussi |

`chrome-launcher` (utilisé par les tests) trouve automatiquement le binaire Chrome / Edge / Chromium installé.

**Vérifie** : ouvre Chrome puis F12 → onglet **Lighthouse**. Si l'onglet est là, tu es prêt.

## 🎯 Objectifs pédagogiques

- Transformer un HTML non sémantique en HTML5 propre
- Construire une CSS responsive (mobile-first, Grid + Flexbox)
- Atteindre la conformité WCAG 2.2 AA
- Optimiser images, polices, métadonnées
- Mesurer et faire monter les scores Lighthouse

## 📋 Énoncé

Le dossier `canevas/` contient une **landing page mal codée** pour une fictive entreprise *Café Émeraude*. Elle a tous les défauts classiques :

- HTML : que des `<div>`, pas de `<header>`, `<main>`, `<nav>`
- CSS : tout en `id` avec `!important`, pas de mobile, pas de variables
- Images : pas d'`alt`, pas de `srcset`, pas de `lazy`, pas de `width/height`
- Formulaire : pas de `<label>`, placeholder fait office d'étiquette
- Contraste : texte gris clair `#aaa` sur blanc
- Outline `:focus` retiré
- Pas de meta description, pas d'OpenGraph
- Pas de mode `prefers-reduced-motion`
- Animations qui bougent en permanence

Ta mission : **refaire** cette page proprement, avec un score **Lighthouse ≥ 95** sur les 4 axes.

## ✅ Critères d'acceptation

| Critère | Cible |
|---------|-------|
| Score Performance | ≥ 95 |
| Score Accessibility | ≥ 95 |
| Score Best Practices | ≥ 95 |
| Score SEO | ≥ 95 |
| `<header>`, `<nav>`, `<main>`, `<footer>` présents | ✅ |
| 1 seul `<h1>`, hiérarchie cohérente | ✅ |
| Toutes les images ont un `alt` (vide pour décoratives) | ✅ |
| Toutes les images ont `width` et `height` (pas de CLS) | ✅ |
| Tous les inputs ont un `<label>` associé | ✅ |
| Mobile-first (testé sur 375 px de large) | ✅ |
| Mode sombre via `prefers-color-scheme` | ✅ |
| `prefers-reduced-motion` respecté | ✅ |
| Navigation clavier complète, focus visible | ✅ |
| Skip link "Aller au contenu" présent | ✅ |

### Bonus

- WebP + AVIF avec `<picture>`.
- Données structurées JSON-LD (`Organization` schema).
- Polices auto-hébergées avec `font-display: swap`.
- Build avec Vite pour minifier le CSS.

## 🛠 Comment commencer

```bash
cd canevas/
npx serve .                    # serveur statique simple
# ouvrir http://localhost:3000
# Mesurer Lighthouse dans Chrome DevTools (F12 > Lighthouse)
```

Tu vas voir un résultat catastrophique. Tu peux soit modifier `canevas/` directement, soit copier dans ton propre dossier de travail.

## 🧪 S'auto-valider

```bash
cd tests/
npm install
npm test                       # par défaut teste correction/
TARGET=canevas npm test        # ou ton canevas
```

Le script utilise [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) en mode `chrome-launcher` et vérifie les seuils.

## 💡 Indices

<details>
<summary>1. Par où commencer ?</summary>

Approche progressive :

1. **HTML d'abord** : remplace les `<div>` par les bonnes balises. Lance Lighthouse — déjà ~80 % d'a11y gagnée.
2. **CSS ensuite** : reset moderne, variables, Flexbox/Grid, mobile-first.
3. **Images** : `<picture>` + `srcset`, `loading="lazy"`, `width`/`height`.
4. **Métadonnées** : `<title>`, `<meta description>`, OpenGraph.
5. **Polish a11y** : skip link, contrastes, `:focus-visible`, `aria-label` icônes.
</details>

<details>
<summary>2. Comment tester rapidement le contraste ?</summary>

Chrome DevTools :
1. Inspecter un texte
2. Onglet **Styles** → cliquer sur la couleur
3. Le picker affiche le ratio (4.5:1 minimum requis)

Outils en ligne : [contrast.tools](https://contrast.tools/)
</details>

<details>
<summary>3. Pourquoi mon score Performance reste à 80 même avec une page simple ?</summary>

Causes courantes :
- Images non optimisées : sers WebP + dimensionne (`width`/`height`)
- Police chargée tardivement : `<link rel="preload" as="font" crossorigin>`
- Animations en boucle : ralentissent le main thread, retire ou conditionne à `prefers-reduced-motion`
- `<script>` synchrone : ajoute `defer` ou `type="module"`
</details>

## 🔑 Correction

Voir [`correction/`](./correction/) — page refaite atteignant >95 sur les 4 axes.

## 📚 Pour aller plus loin

- Refais l'exercice avec **Tailwind CSS** au lieu de CSS pur.
- Convertis la page en **PWA** (manifest + service worker).
- Internationalise en français + anglais.
