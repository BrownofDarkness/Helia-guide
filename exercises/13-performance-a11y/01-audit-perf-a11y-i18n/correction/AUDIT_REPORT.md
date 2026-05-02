# Rapport d'audit — FastBites landing

## Date

2026-04-30

## Périmètre

Landing page « FastBites » — version statique multi-page (FR / EN / AR), Vite + TS vanilla.

## Méthode

| Mesure | Outil | Conditions |
|--------|-------|------------|
| Performance | **Lighthouse 12** (DevTools) | Mobile, 4× CPU slowdown, Slow 4G simulé |
| RUM | **web-vitals** + `console.log` | Navigation manuelle, Chrome 130 |
| Accessibilité | **axe DevTools** + audit manuel | NVDA + clavier + zoom 200 % + RTL |
| i18n | Audit manuel | Bascule des 3 locales, vérif Intl.* + RTL |

## Résultats — avant / après

### Core Web Vitals (Lighthouse mobile bridé)

| Métrique | Avant (canevas) | Après (correction) | Cible |
|----------|------------------|--------------------|-------|
| **LCP** | 5,4 s | **2,2 s** ✅ | ≤ 2,5 s |
| **TBT** (proxy INP labo) | 740 ms | **120 ms** ✅ | ≤ 200 ms |
| **CLS** | 0,38 | **0,02** ✅ | ≤ 0,1 |
| **FCP** | 2,1 s | 1,3 s | < 1,8 s |
| **Score Performance** | 31/100 | **94/100** ✅ | ≥ 90 |

### Accessibilité

| Mesure | Avant | Après | Cible |
|--------|-------|-------|-------|
| **Score Lighthouse a11y** | 62 | **100** ✅ | ≥ 95 |
| **Violations axe-core** | 14 | **0** ✅ | 0 |
| Audit manuel clavier (toute la page atteignable) | ❌ | ✅ | |
| NVDA — landmarks annoncés | ❌ | ✅ | |
| Contraste 4.5:1 minimum | ❌ (3.2:1) | ✅ | |

### Bundle / réseau

| Mesure | Avant | Après |
|--------|-------|-------|
| Bundle JS (gz) | 71 KB (lodash full) | **6 KB** (web-vitals + main) |
| Locales chargées au boot | — | 1 seule (lazy) |
| Image hero | JPEG 2 MB sans `srcset` | AVIF/WebP/JPEG `<picture>` ~85 KB sur mobile |
| Requêtes au boot | 9 | 5 |

### i18n

| Critère | Avant | Après |
|---------|-------|-------|
| Strings externalisées | ❌ | ✅ (3 dictionnaires JSON) |
| Pluralisation correcte | ❌ (if/else) | ✅ (`Intl.PluralRules` — 6 formes pour AR) |
| Dates / nombres / devises | hardcodées FR | `Intl.DateTimeFormat`, `Intl.NumberFormat` |
| Direction RTL | ❌ | ✅ (`dir="rtl"` + propriétés logiques) |
| Sélecteur de langue | ❌ | ✅ (avec persistance localStorage) |
| URL `<html lang>` à jour | ❌ | ✅ |

---

## Détail des corrections

### Performance

| ID | Avant | Après | Gain |
|----|-------|-------|------|
| **P-001** CSS bloquant | `<link rel="stylesheet">` brut | inline du critical via Vite + `font-display: swap` | -180 ms FCP |
| **P-002** Polices Google sans préchargement | rel=stylesheet sec | `preconnect` + `preload` + `swap` | -250 ms LCP |
| **P-003** Script bloquant | `<script src>` synchro | `<script type="module">` (deferred par défaut) | -350 ms FCP |
| **P-004** Image hero 2 MB sans dim. | JPEG nu | `<picture>` AVIF/WebP/JPEG + `srcset` + `width`/`height` + `fetchpriority="high"` | -2,8 s LCP, CLS éliminé |
| **P-005** Bannière cookies → CLS | injectée à +1500 ms | hauteur réservée + `[hidden]` jusqu'au flag user | CLS 0,38 → 0,02 |
| **P-006** Long task synchrone (~400 ms) | `for (i < 20M)` au clic | retiré (factice) | INP/TBT divisé par 6 |
| **P-007** Pas de live region panier | `<div>#cart-status` muet | `role="status"` + `aria-live="polite"` | a11y + UX |
| **P-008** lodash complet | 70 KB | retiré, `debounce` natif 3 lignes | bundle -65 KB |
| **P-008b** Locales chargées en bloc | toutes embarquées | `import('./i18n/${locale}.json')` à la demande | -2-4 KB de boot par locale absente |
| **P-009** Recompute par keystroke | calcul lourd à chaque touche | debounce 200 ms + check léger | INP stable |

### Accessibilité

| ID | Avant | Après |
|----|-------|-------|
| **A-001** `<html>` sans `lang` | absent | `lang="fr/en/ar"` synchronisé avec la locale |
| **A-002** Pas de landmarks | suite de `<div>` | `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>` |
| **A-003** Liens en `<div onclick>` | clavier inaccessible | `<a href>` et `<button>` natifs |
| **A-004** Hiérarchie de headings | h2 avant h1 | un seul h1, h2/h3 en cascade |
| **A-005** Images sans `alt` | absent | `alt=""` (décoratif) ou texte explicite |
| **A-006** Boutons sans focus | `outline: none` | `:focus-visible` 3px contrasté |
| **A-007** Contraste insuffisant | 3.2:1 sur CTA | palette retravaillée — 5.4:1+ partout |
| **A-008** Inputs sans label | `placeholder` seul | `<label for>` lié + `autocomplete` + `inputmode` |
| **A-009** Erreur par couleur seule | `border: red` | `aria-invalid` + texte d'erreur dans `role="alert"` |
| **A-010** Modale custom | `<div>` sans focus trap | `<dialog>` natif (`showModal()`) |
| **A-011** `prefers-reduced-motion` ignoré | animation infinie | media query qui désactive les animations décoratives |
| **A-012** Skip link | absent | `.skip-link` qui apparaît au focus |
| **A-013** Cibles tactiles < 24px | `36×36` | `44×44` (cible Apple HIG, > seuil WCAG 2.5.8) |

### i18n

| ID | Avant | Après |
|----|-------|-------|
| **I-001** Marges physiques (`margin-left`) | break en RTL | propriétés logiques (`margin-inline-start`) — Tailwind v4 free |
| **I-002** Strings hardcodées | inline FR | extraction vers `i18n/{fr,en,ar}.json` |
| **I-003** Pluralisation par if | faux pour AR/PL/RU | `Intl.PluralRules` + 6 catégories en AR |
| **I-004** Validation hardcodée | message FR | `t('contact.emailErrorInvalid')` |
| **I-005** Pas de support RTL | layout cassé | `dir="rtl"` + propriétés logiques + miroir contextuel |
| **I-006** Prix au format manuel | `14,90 €` | `Intl.NumberFormat(currentLocale, { currency: 'EUR' })` |
| **I-007** Sélecteur de langue absent | — | `<select>` accessible + persistance |

---

## Procédures de vérification

### Démarrage de la version corrigée

```bash
cd correction/
npm install
npm run dev
# http://localhost:5173
```

### Audits

```bash
# Lighthouse mobile bridé
npm run lh

# axe-core CLI
npx --yes @axe-core/cli http://localhost:5173

# Bundle visualisation
npx --yes vite-bundle-visualizer
```

### RUM en local

Ouvrir la console et naviguer la page : les `console.log('[web-vital]', ...)` remontent les LCP/INP/CLS observés.

---

## Ce qu'il reste à creuser (hors scope V1)

- **CSP nonce-based** + serve les images via un CDN avec en-têtes immutables.
- **Service Worker** pour le mode offline (axe 16 — Spécialisations).
- **i18n côté serveur** (Cloudflare Worker selon `Accept-Language`) pour éviter le flash FR.
- **Pa11y CI** sur sitemap + Playwright a11y test multi-locales (bonus déjà esquissé).
- **APCA** au lieu du contraste WCAG 2.x (en draft pour WCAG 3).

## Commits associés

```
perf: V-P-004 image hero AVIF/WebP + srcset + fetchpriority
perf: V-P-005 réserver l'espace de la bannière cookies → CLS 0,38 → 0,02
perf: V-P-006 retirer le long task synthétique du clic addToCart
a11y: V-A-001 ajouter lang="fr" sur <html> et synchroniser avec la locale
a11y: V-A-003 div→button + roles natifs
a11y: V-A-007 palette retravaillée pour AA (4.5:1)
a11y: V-A-010 modale → <dialog> natif
i18n: V-I-002 externaliser les strings dans 3 dictionnaires
i18n: V-I-003 utiliser Intl.PluralRules (support AR 6 formes)
i18n: V-I-005 RTL via dir="rtl" + propriétés logiques
```
