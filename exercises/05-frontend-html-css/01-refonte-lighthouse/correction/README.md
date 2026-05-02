# Correction — Refonte Lighthouse

> Cette correction obtient **100 / 100 / 96 / 100** (Performance / A11y / Best Practices / SEO) lancée en CI sur Chrome headless. Pas un bricolage qui passe en local : un score reproductible.
>
> Lis-la **après avoir tenté ton refactor**. Le but : voir *pourquoi* chaque ligne est là, pas la recopier.

## Sommaire

1. [Pré-requis et lancement](#1-pré-requis-et-lancement)
2. [Vue d'ensemble du fix](#2-vue-densemble-du-fix)
3. [HTML — le plus gros gain](#3-html--le-plus-gros-gain)
4. [CSS — design tokens et reset](#4-css--design-tokens-et-reset)
5. [Accessibilité — détails qui font tout](#5-accessibilité--détails-qui-font-tout)
6. [Validation : 4/4 Lighthouse](#6-validation--44-lighthouse)
7. [Pièges réels rencontrés](#7-pièges-réels-rencontrés)
8. [Pour aller plus loin](#8-pour-aller-plus-loin)

---

## 1. Pré-requis et lancement

```bash
cd correction/
npx serve .
# → http://localhost:3000
# F12 → Lighthouse → Analyze (mobile, performance + a11y + best-practices + seo)
```

Pour automatiser via CLI :

```bash
cd ../tests/
npm install
npm test                 # par défaut : audit la correction
TARGET=canevas npm test  # ou : audit le canevas (devrait échouer)
```

## 2. Vue d'ensemble du fix

| Catégorie | Avant (canevas) | Après (correction) |
|-----------|-----------------|---------------------|
| Performance | ~70 | **100** |
| Accessibility | ~50 | **100** |
| Best Practices | ~75 | **96** |
| SEO | ~70 | **100** |

Trois fichiers seulement : `index.html`, `styles.css` (et 3 images optionnelles). Pas de framework, pas de bundler. **Tout le gain vient des bonnes balises et de ~400 lignes de CSS bien pensées.**

## 3. HTML — le plus gros gain

### 3.1 Sectionnement sémantique

```html
<header>
  <nav aria-label="Principal">…</nav>
</header>
<main id="contenu">
  <section aria-labelledby="hero-title">
    <h1 id="hero-title">…</h1>
  </section>
  <section aria-labelledby="offre-title">
    <h2 id="offre-title">Notre offre</h2>
    <ul role="list">…</ul>
  </section>
  <aside aria-label="Information importante">…</aside>
</main>
<footer>…</footer>
```

Pourquoi c'est rentable :

- **`<header>` / `<main>` / `<footer>` / `<nav>`** : un screen reader peut sauter directement à `<main>` avec une navigation par landmarks. Sans eux, l'utilisateur lit toute la page.
- **`aria-labelledby`** sur les `<section>` : nomme la section par son titre interne, ce qui permet à un screen reader d'annoncer « section : Notre offre ».
- **`aria-label="Principal"` / `"Pied de page"`** sur les `<nav>` : si une page a deux `<nav>`, il faut les distinguer pour que la navigation par landmarks soit utile.
- **`role="list"` sur `<ul>`** : Safari désactive la sémantique `list` quand on enlève les puces avec `list-style: none` (bug officiel reconnu). Le `role="list"` la remet. Sans ça, VoiceOver n'annonce pas « liste de 3 éléments ».

### 3.2 Skip link en haut de body

```html
<a class="skip-link" href="#contenu">Aller au contenu</a>
```

Avec le CSS qui le cache hors viewport sauf au `:focus` :

```css
.skip-link {
  position: absolute;
  left: 0;
  top: -100px;
}
.skip-link:focus {
  top: 0;
}
```

Permet à un utilisateur clavier de **sauter la nav** au premier `Tab`. Sur les sites avec 50 liens dans le header, c'est l'écart entre « utilisable » et « impossible ».

### 3.3 Images : `<picture>` + dimensions + lazy

```html
<picture>
  <source type="image/avif" srcset="cafe-robusta.avif" />
  <source type="image/webp" srcset="cafe-robusta.webp" />
  <img src="cafe-robusta.jpg" alt="" width="400" height="300" loading="lazy" />
</picture>
```

Chaque attribut compte :

| Attribut | Pourquoi |
|----------|----------|
| `<source type="image/avif">` puis WebP puis JPG | Le navigateur prend le **premier format qu'il sait afficher** (AVIF ~40 % plus léger que JPG, WebP ~25 %). Fallback automatique. |
| `width` + `height` | Le navigateur **réserve la place** avant le chargement de l'image → pas de saut de layout (CLS). C'est *la* métrique qui plombe le plus de sites. |
| `loading="lazy"` | Charge l'image **quand elle approche du viewport**. Sur une page avec 20 images, gain massif sur le LCP. |
| `alt=""` (vide) | Image décorative → annoncée comme « image » par les screen readers, sans description superflue. **Ne jamais omettre `alt`** ; le mettre vide explicite la décision. |

### 3.4 Métadonnées qui rapportent en SEO

```html
<title>Café Émeraude — Cafés artisanaux depuis 1952</title>
<meta name="description" content="…torréfie ses grains à Lyon…" />
<meta property="og:title" content="…" />
<meta property="og:description" content="…" />
<meta property="og:type" content="website" />
<link rel="canonical" href="https://…" />

<script type="application/ld+json">
{ "@context": "https://schema.org", "@type": "LocalBusiness", … }
</script>
```

- **`<title>`** : 50–60 caractères, le mot-clé en premier, format « Marque — Bénéfice/Année ».
- **`<meta description>`** : 150–160 caractères. Affiché dans les résultats Google sous le titre.
- **OpenGraph** : aperçu propre quand on partage l'URL sur Slack, WhatsApp, LinkedIn, X. Sans ça, le partage est moche → moins de clics.
- **`<link rel="canonical">`** : dit à Google « si tu trouves cette page sous plusieurs URLs (avec `?ref=…`, `?utm_…`), considère que celle-ci est la canonique ». Évite la dilution PageRank.
- **JSON-LD** : Google peut afficher des résultats enrichis (rich snippets) — étoiles, prix, horaires, position carte. Pour un commerce local, énorme.

## 4. CSS — design tokens et reset

### 4.1 Reset moderne minimal

```css
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }
img, picture, video, canvas, svg { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; }
```

Pas de Normalize.css, pas de Reset.css de 2010. Quatre règles inspirées de [Josh Comeau](https://www.joshwcomeau.com/css/custom-css-reset/) qui couvrent 95 % des besoins :

1. `box-sizing: border-box` partout : la largeur d'un élément inclut le padding/border (vs default `content-box` qui ne les inclut pas — source d'erreurs sans fin).
2. Reset des marges (par défaut, `<h1>`, `<p>`, etc. ont des marges qui collent leurs voisins).
3. Images en `display: block` + `max-width: 100%` : pas de débordement responsive et pas d'espace blanc fantôme sous les images inline.
4. Inputs/boutons héritent de la police du body (Chrome force du Helvetica par défaut sinon).

### 4.2 Design tokens via CSS custom properties

```css
:root {
  --color-primary: #047857;
  --color-text: #111827;          /* contraste 17:1 sur blanc */
  --color-text-muted: #525252;    /* contraste 7.5:1 sur blanc */
  --space-1: 0.25rem;
  --space-4: 1rem;
  --radius-md: 0.5rem;
  --container-max: 1100px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-text: #f3f4f6;
    --color-bg: #111827;
    /* … */
  }
}
```

Trois bénéfices :

1. **Cohérence** : impossible d'utiliser un `#525252` à un endroit et un `#525251` ailleurs (si tu en utilises un autre, ça veut dire qu'il manque un token).
2. **Mode sombre** quasi gratuit : un seul `@media` qui override les variables, et tout le reste suit.
3. **Refacto** : si la marque change la couleur primaire, **un seul endroit à toucher**.

Le commentaire `/* contraste 17:1 sur blanc */` à côté de chaque couleur de texte sauve du temps : tu mesures le contraste **une fois** (au choix du token) et plus jamais ailleurs.

### 4.3 Responsive sans media query

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-6);
}

.hero h1 {
  font-size: clamp(2rem, 5vw, 3.5rem);
}

.section {
  padding-block: clamp(2rem, 6vw, 5rem);
}
```

| Pattern | Effet |
|---------|-------|
| `repeat(auto-fit, minmax(250px, 1fr))` | Les cards passent de 3 colonnes (large) à 2 (medium) à 1 (mobile) **automatiquement**, sans aucun media query. |
| `clamp(min, idéal, max)` | Le titre fait 2rem en mobile, 3.5rem en desktop, et scale linéairement entre les deux. Idem pour les paddings. |

Résultat : **0 media query** dans cette feuille de style à part celles pour `prefers-color-scheme` et `prefers-reduced-motion`. Maintenance divisée par 5.

### 4.4 `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

L'utilisateur a coché « réduire le mouvement » dans son OS → toutes les animations se terminent en 0.01ms (donc invisibles). Pas seulement pour les utilisateurs vestibulaires : c'est dans les critères WCAG 2.2 AA et Lighthouse pénalise sans.

C'est l'**unique endroit où `!important` est légitime** dans ce fichier — pour s'assurer qu'aucune animation custom plus loin ne le contourne.

## 5. Accessibilité — détails qui font tout

### 5.1 `:focus-visible` (et pas `:focus`)

```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

`:focus-visible` se déclenche **uniquement quand l'utilisateur navigue au clavier**, pas au clic souris. Avant, on devait choisir entre :

- garder `:focus` partout (entoure de bleu après un clic, jugé moche par les designers),
- ou enlever le focus (catastrophe pour les utilisateurs clavier).

`:focus-visible` est la solution depuis Chrome 86. **Le combo gagnant** : retire le défaut, redonne via `:focus-visible`.

### 5.2 Touch targets ≥ 44×44 px

```css
header nav a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}
.btn { min-height: 44px; padding: var(--space-3) var(--space-6); }
.field input { min-height: 44px; }
```

WCAG 2.2 (la version 2026) impose **44×44 px minimum** pour les cibles tactiles. Un lien de 30 px de haut en mobile = trop facile à rater. C'est pénalisé en Lighthouse depuis 2024.

### 5.3 Contraste — tokens et tests croisés

Toutes les paires utilisées :

| Texte | Fond | Ratio | Conforme ? |
|-------|------|-------|------------|
| `#111827` (text) | `#ffffff` (bg) | 17:1 | ✅ |
| `#525252` (text-muted) | `#ffffff` | 7.5:1 | ✅ |
| `#ffffff` (texte hero) | gradient `#047857` | 5.4:1 | ✅ |
| `#78350f` (banner-text) | `#fef3c7` (banner-bg) | 8:1 | ✅ |

WCAG AA exige 4.5:1 pour texte normal, 3:1 pour texte large. **On vise toujours 7:1+** (niveau AAA) parce que ça vieillit mieux quand le designer veut adoucir une nuance.

## 6. Validation : 4/4 Lighthouse

```bash
cd ../tests/
npm install
npm test
```

Sortie observée :

```
📊 Audit Lighthouse de "correction"
Serveur statique sur http://localhost:6179/
──────────────────────────────────
✓ performance        100 / 95
✓ accessibility      100 / 95
✓ best-practices     96 / 95
✓ seo                100 / 95
──────────────────────────────────
```

Le runner :

1. Démarre un serveur statique sur un port aléatoire.
2. Lance Chrome headless via `chrome-launcher`.
3. Exécute Lighthouse sur les 4 catégories.
4. Compare aux seuils (≥ 95 chacun).

> ℹ️ Le score Performance peut fluctuer ±2 selon la charge CPU (Chrome headless). Si tu obtiens 96 au lieu de 99 sans avoir rien cassé, c'est juste du bruit.

## 7. Pièges réels rencontrés

Cinq classiques d'a11y/perf qui réapparaissent dans tous les audits :

1. **`outline: none` sans alternative** — la cause #1 d'a11y catastrophique. Fix : `:focus-visible` + outline contrasté.
2. **`<ul>` avec `list-style: none` sans `role="list"`** — Safari désactive la sémantique de liste. Bug officiel WebKit, fix : `role="list"`.
3. **Images sans `width`/`height`** — provoque CLS au chargement, pénalise Performance. Toujours déclarer les dimensions intrinsèques en HTML.
4. **`<input>` sans `<label for>`** — un placeholder ne suffit pas (disparaît dès qu'on tape, pas annoncé par screen readers). Fix : `<label for="email">E-mail</label><input id="email">`.
5. **`prefers-reduced-motion` ignoré** — les animations en boucle pénalisent à la fois Performance et A11y. Fix : un media query qui force `animation-duration: 0.01ms !important` pour tout.

Ces 5 pièges sont *si* universels qu'ils pourraient être un linter pre-commit. Outils dispo : [axe DevTools](https://www.deque.com/axe/devtools/), [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) (utilisé ici), [Pa11y](https://pa11y.org/).

Pas de piège « inédit » à ajouter à `pieges.ts` global — ce sont les standards. Si tu en croises un *original* en faisant l'exercice, capture-le.

## 8. Pour aller plus loin

- **PWA** : ajoute un `manifest.json` (icônes, theme-color, display) et un service worker minimal qui cache les assets statiques. Tu gagnes le badge PWA Lighthouse + offline-first.
- **Polices custom** : ajoute Inter ou Geist en self-hosting (`@font-face` avec `font-display: swap`). Combine avec `<link rel="preload" as="font" crossorigin>` dans le `<head>`. Subtil mais le score Performance grimpe parce que le FOIT/FOUT diminue.
- **Critical CSS inline** : pour gagner les derniers % de Performance, mets le CSS du fold dans `<style>` inline, et charge le reste avec `<link rel="preload" as="style">`. Outil : [critical](https://github.com/addyosmani/critical).
- **i18n** : duplique en `index-en.html` ou intègre [i18next-browser](https://github.com/i18next/i18next). Ajoute `<link rel="alternate" hreflang="en" href="/en/">` pour Google.
- **Tailwind v4** : refais la même page en Tailwind. Compare les deux feuilles de style — Tailwind n'est pas magique, tu vas voir les mêmes patterns (clamp, grid auto-fit, prefers-color-scheme) sous une autre syntaxe.
