# Canevas — Refonte Lighthouse

> Le `index.html` du canevas est **volontairement catastrophique**. Pas par paresse — par pédagogie. Tu vas mesurer son score Lighthouse, encaisser le résultat, puis le refaire **proprement** et regarder les chiffres monter à chaque étape. C'est un des seuls exercices où le diff entre « avant » et « après » est viscéral.

## Ce que tu vas faire

Refaire la landing page de **Café Émeraude** pour atteindre **≥ 95** sur les 4 axes Lighthouse :

| Axe | Cible |
|-----|-------|
| **Performance** | ≥ 95 |
| **Accessibility** | ≥ 95 |
| **Best Practices** | ≥ 95 |
| **SEO** | ≥ 95 |

À la fin, tu auras vécu **les ~20 erreurs HTML/CSS qui plombent 9 sites sur 10** (alt manquants, focus retiré, contraste #aaa/#fff, !important partout, formulaire sans `<label>`…) et tu sauras pourquoi chaque correction compte — pas juste *quoi* corriger.

## Pré-requis

- **Node ≥ 20** + **npx** (pour servir la page localement).
- **Chrome / Chromium / Edge** installé (pour mesurer Lighthouse). Edge en tant que navigateur Chromium suffit sous Windows.

Si Chrome ou Node manquent, voir l'énoncé global (`../README.md` § « Avant de commencer »).

## Mesurer l'état initial (douloureux mais formateur)

```bash
npx serve .
# Ouvrir http://localhost:3000
# Chrome DevTools (F12) → onglet Lighthouse → Analyze
```

Tu vas voir quelque chose comme :

```
Performance:     ~70
Accessibility:   ~50    ← horrible
Best Practices:  ~75
SEO:             ~70
```

**Ne corrige rien tant que tu n'as pas vu cet écran.** Le but est de comprendre ce qu'un audit révèle, pas de partir d'une page neutre.

## Liste des ~20 défauts à chasser

Coche au fur et à mesure :

### HTML
- [ ] Pas de `<!DOCTYPE>`, pas de `<html lang="fr">`
- [ ] Pas de `<meta charset>`, pas de `<meta viewport>`
- [ ] `<title>` indigent, pas de `<meta description>`, pas d'OpenGraph
- [ ] Aucune balise sémantique (que des `<div>` partout)
- [ ] Pas de `<h1>` unique, hiérarchie de titres cassée
- [ ] Aucun `alt` sur les images
- [ ] Pas de `width`/`height` sur les images → CLS (cumulative layout shift)
- [ ] Formulaire sans `<label for>`, placeholder fait office d'étiquette
- [ ] `<button>` sans `type="submit"` explicite
- [ ] `onclick=""` inline (pas accessible clavier)

### CSS
- [ ] `outline: none !important` sur `:focus`
- [ ] Texte `#ccc` sur `#aaa` → contraste 1.4:1 (cible WCAG AA : 4.5:1)
- [ ] Animation infinie sans respect de `prefers-reduced-motion`
- [ ] Sélecteurs `#id` avec `!important` partout, pas de variables CSS
- [ ] Pas de mobile-first (les `width: 30%` cassent sous 600 px)

### Manquements
- [ ] Pas de skip link « Aller au contenu »
- [ ] Pas de mode sombre via `prefers-color-scheme`
- [ ] Pas de `<picture>` AVIF/WebP/JPG
- [ ] Pas de données structurées JSON-LD

## Démarche suggérée

```
1. HTML d'abord       → 80 % de l'a11y gagnée juste avec les bonnes balises
2. CSS reset + tokens → variables CSS, mobile-first, clamp()
3. Images             → <picture> + width/height + loading="lazy"
4. Métadonnées + JSON-LD
5. Polish a11y        → skip link, :focus-visible, touch targets ≥ 44px
```

Lance Lighthouse **après chaque étape**, pas seulement à la fin. Tu vas voir le score monter par paliers — ça motive et ça apprend ce que chaque fix apporte.

## Tester

```bash
cd ../tests/
npm install
TARGET=canevas npm test       # devrait échouer au début
TARGET=correction npm test    # référence : passe à 95+/95+/95+/95+
```

Le script lance Chrome headless via `chrome-launcher` et mesure les 4 scores Lighthouse. Sortie attendue :

```
✓ performance        100 / 95
✓ accessibility      100 / 95
✓ best-practices     96 / 95
✓ seo                100 / 95
```

## Bloqué ?

- **Score Performance reste ~80 alors que la page est minuscule** → 9 fois sur 10, c'est `<script>` sans `defer` qui bloque le parsing, ou bien des images sans `width`/`height` qui forcent le navigateur à reflow.
- **A11y plafonne à 90** → vérifie chaque `<input>` a un `<label for="…">` (pas un `placeholder`), chaque image décorative a `alt=""` (pas pas-d-alt-du-tout), et **aucun** `outline: none` sans `:focus-visible` de remplacement.
- **Best Practices à 80–90** → souvent une console error JS (charge un fichier 404), ou un mixed content (http://… dans une page https). Regarde l'onglet Console du DevTools.
- **SEO à 90** → lien sans texte descriptif (`<a href="/foo"><img></a>` sans `alt`), absence de `<meta description>`, ou un titre `<title>` trop court.
- **Le mode sombre ne se déclenche pas** → tu utilises `@media (prefers-color-scheme: dark)` mais tes variables CSS sont définies dans `:root` (donc gagnent toujours). Il faut soit override les variables dans le media query, soit basculer une classe.
- **Tu hésites sur le contraste** → DevTools → Elements → onglet Styles → clique sur la couleur. Le picker affiche le ratio. Cible : 4.5:1 pour le texte normal, 3:1 pour les titres ≥ 18pt.

## Ne commit pas

Aucun secret. Si tu ajoutes des images réelles (.jpg, .webp, .avif), commit-les seulement si tu en as les droits — sinon prends [pexels.com](https://pexels.com) ou [unsplash.com](https://unsplash.com) (libres de droit).
