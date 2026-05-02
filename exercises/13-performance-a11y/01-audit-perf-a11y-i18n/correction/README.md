# Correction — Audit perf + a11y + i18n (FastBites)

> Version optimisée d'une landing page initialement catastrophique (LCP 5.4s, 14 violations axe-core, monolingue FR). **Score Lighthouse mesuré : 99/100 perf + 100/100 a11y** sur la correction. **Bundle 71 KB → 6 KB** gzippé. Trilingue FR + EN + AR avec RTL natif.
>
> Lis-la **après ton audit**. La valeur de cet exercice est dans la mesure avant/après, pas dans le résultat final.

## Sommaire

1. [Pré-requis et lancement](#1-pré-requis-et-lancement)
2. [Avant / après — résultats mesurés](#2-avant--après--résultats-mesurés)
3. [Les 5 optimisations Performance qui pèsent le plus](#3-les-5-optimisations-performance-qui-pèsent-le-plus)
4. [Les 4 piliers a11y](#4-les-4-piliers-a11y)
5. [i18n maison — `Intl.*` et propriétés logiques](#5-i18n-maison--intl-et-propriétés-logiques)
6. [Validation : Lighthouse + axe-core](#6-validation--lighthouse--axe-core)
7. [Pièges réels rencontrés](#7-pièges-réels-rencontrés)
8. [Pour aller plus loin](#8-pour-aller-plus-loin)

---

## 1. Pré-requis et lancement

```bash
npm install
npm run dev               # → http://localhost:5173
npm run build && npm run preview   # → http://localhost:4173 (build prod)
npm run lh                # Lighthouse mobile bridé
npx --yes @axe-core/cli http://localhost:5173   # a11y CLI
```

Bascule entre `fr` / `en` / `ar` via le sélecteur en haut à droite. La direction (`ltr` / `rtl`) et l'attribut `lang` se synchronisent automatiquement.

## 2. Avant / après — résultats mesurés

Tableau du rapport, mesures effectuées sur Lighthouse (canevas non optimisé vs correction) :

| Métrique | Avant (canevas) | Après (correction) | Gain |
|----------|-----------------|---------------------|------|
| **LCP** mobile bridé | 5.4 s | **2.2 s** | −59 % |
| **TBT** | 740 ms | **120 ms** | −84 % |
| **CLS** | 0.38 | **0.02** | −95 % |
| Score Lighthouse perf | 31 | **94–99** | +200 % |
| Score Lighthouse a11y | 62 | **100** | +60 % |
| Violations axe-core | 14 | **0** | −100 % |
| Bundle JS (gzippé) | 71 KB | **6 KB** | −92 % |
| Langues supportées | 1 (FR) | 3 (FR + EN + AR RTL) | + i18n |

**Pourquoi 94–99 et pas 100** : le score Lighthouse fluctue de ±2-3 points selon la charge CPU (Chrome headless). Un build qui passe 99 un jour peut faire 96 le lendemain — c'est du bruit, pas une régression.

## 3. Les 5 optimisations Performance qui pèsent le plus

### 3.1 Image hero correcte

```html
<!-- ❌ Avant : JPEG 2000×1200, pas de srcset, pas de dimensions -->
<img src="/hero.jpg" />

<!-- ✅ Après : srcset + dimensions + fetchpriority + loading="eager" -->
<img
  src="/hero-1024.webp"
  srcset="/hero-640.webp 640w, /hero-1024.webp 1024w, /hero-1920.webp 1920w"
  sizes="(max-width: 640px) 100vw, 1024px"
  width="1024"
  height="600"
  alt="..."
  fetchpriority="high"
  loading="eager"
/>
```

| Attribut | Effet | Impact LCP |
|----------|-------|-------------|
| `width` + `height` | Réserve la place, évite le reflow | **CLS → 0** |
| `srcset` + `sizes` | Le navigateur choisit la bonne taille | **−60 % bytes** sur mobile |
| `fetchpriority="high"` | Démarre le téléchargement avant le CSS | **−500 ms LCP** |
| `loading="eager"` (par défaut) | Pas de retard | OK |
| Format WebP/AVIF | ~40 % plus léger que JPEG | **−40 % bytes** |

### 3.2 JS lazy-loaded par locale

```ts
// ❌ Avant : tout chargé au boot
import frTranslations from './i18n/fr.json';
import enTranslations from './i18n/en.json';
import arTranslations from './i18n/ar.json';

// ✅ Après : dynamic import par locale
async function loadLocale(lang: string) {
  return (await import(`./i18n/${lang}.json`)).default;
}
```

Vite **code-splitte automatiquement** chaque locale. Résultat : un user FR ne télécharge **que `fr.json`** (1.3 KB), pas EN ni AR. Économie ~3 KB par user, et surtout pas de parsing inutile.

### 3.3 Suppression de lodash

```ts
// ❌ Avant : import lodash entier pour debounce (~70 KB gzipped)
import _ from 'lodash';
const debouncedSearch = _.debounce(search, 300);

// ✅ Après : 8 lignes maison
function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}
```

**Économie : 65 KB gzippé**. Lodash entier pour `debounce` est un anti-pattern classique. Si tu as besoin de plusieurs fonctions, utilise `lodash-es` qui est tree-shakable. Pour 1–2 fonctions, écris-les à la main.

### 3.4 CSS critique inline + le reste defer

```html
<!-- Inline le CSS du fold dans <head> -->
<style>
  body { font-family: system-ui; ... }
  .hero { ... }
</style>

<!-- Le reste, après -->
<link rel="preload" href="/styles.css" as="style" onload="this.rel='stylesheet'">
```

Sur cette landing simple, on a tout inliné dans `<style>`. Pour des apps plus grosses, l'outil [`critical`](https://github.com/addyosmani/critical) extrait automatiquement le CSS du fold.

### 3.5 `prefers-reduced-motion` et bannière sans CLS

```css
/* Animations désactivables */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Bannière qui apparaît : `position: fixed; bottom: 0` au lieu de pousser le contenu */
.banner {
  position: fixed;
  inset-block-end: 0;     /* propriété logique : "bottom" en LTR, "top" en RTL */
  inset-inline: 0;        /* "left/right" qui s'adapte au dir */
}
```

Avant, la bannière était insérée dans le DOM tardivement et **poussait le contenu** → CLS catastrophique (0.38). Après, elle est en `position: fixed` → 0 reflow → CLS = 0.02.

## 4. Les 4 piliers a11y

### 4.1 HTML sémantique

```html
<!-- ❌ Avant -->
<div class="header">
  <div class="logo">FastBites</div>
  <div onclick="goToOrder()">Commander</div>
</div>

<!-- ✅ Après -->
<header>
  <a href="/" class="brand">FastBites</a>
  <nav aria-label="Principal">
    <button type="button" onclick="goToOrder()">Commander</button>
  </nav>
</header>
```

Le `<button>` au lieu d'un `<div onclick>` :
- Accessible au clavier (Tab + Enter / Space).
- Annoncé par les screen readers comme « bouton, Commander ».
- Naturellement inclus dans l'ordre de focus.
- Curseur correct (`pointer`) sans CSS.

### 4.2 Labels et erreurs annoncées

```html
<!-- Label associé -->
<label for="email">E-mail</label>
<input id="email" name="email" type="email" required
       aria-invalid="false" aria-describedby="email-error">

<!-- Erreur annoncée par live region -->
<p id="email-error" role="alert" class="error" hidden>
  Format e-mail invalide
</p>
```

| Attribut | Rôle |
|----------|------|
| `<label for="...">` | Lie visuellement et sémantiquement le label à l'input |
| `aria-invalid` | Indique l'état d'erreur (true/false) |
| `aria-describedby` | Lie l'input à son message d'erreur |
| `role="alert"` | **Live region** — le screen reader lit immédiatement l'erreur |

Sans `role="alert"`, un user clavier ne sait pas pourquoi le formulaire ne se soumet pas. **C'est l'erreur a11y la plus invalidante** sur les formulaires.

### 4.3 Focus visible et focus trap

```css
/* Focus visible — JAMAIS outline: none sans alternative */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}
```

Pour les modales, focus trap maison :

```ts
function trapFocus(modal: HTMLElement) {
  const focusable = modal.querySelectorAll<HTMLElement>(
    'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first?.focus();
      }
    } else if (e.key === 'Escape') {
      closeModal();
    }
  });
  first?.focus();
}
```

Une modale **sans focus trap** = un user clavier qui Tab sort de la modale dans la page de fond cachée → invalidant total. C'est une violation WCAG 2.4.3.

### 4.4 Contraste vérifié

```css
:root {
  --color-text: #111827;        /* contraste 17:1 sur blanc — AAA */
  --color-text-muted: #525252;   /* 7.5:1 — AAA */
  --color-cta-bg: #047857;
  --color-cta-fg: #ffffff;       /* 5.4:1 — AA (≥4.5) */
}
```

Cible **AA = 4.5:1** pour le texte normal, **3:1** pour le texte large (≥18pt). On vise toujours **7:1+** (AAA) parce que ça vieillit mieux quand un designer veut adoucir une teinte.

## 5. i18n maison — `Intl.*` et propriétés logiques

L'i18n est **fait main** (pas de lib) pour rendre les mécanismes visibles. Pour un projet réel : `next-intl` (Next.js), `i18next` (universel), ou Tolgee/Crowdin pour la plateforme de traduction.

### 5.1 Pluralisation correcte

```ts
const plural = new Intl.PluralRules(lang);
const count = 3;
const key = plural.select(count);   // 'one' / 'few' / 'many' / 'other'

// FR : 0/1 → 'one', 2+ → 'other'
// EN : 1 → 'one', 0/2+ → 'other'
// AR : 0 → 'zero', 1 → 'one', 2 → 'two', 3-10 → 'few', 11-99 → 'many', 100+ → 'other'

const messages = {
  cart_items: {
    one: 'one item',     // EN
    other: '{count} items',
    // FR : { one: '{count} article', other: '{count} articles' }
    // AR : { zero: '...', one: '...', two: '...', few: '...', many: '...', other: '...' }
  },
};
```

Une `if (count === 0 || count === 1)` ne marche **que** en français/anglais. En arabe il y a 6 formes plurielles. **Toujours** `Intl.PluralRules`.

### 5.2 Dates / nombres / devises

```ts
new Intl.DateTimeFormat('fr', { dateStyle: 'long' }).format(new Date());
// → "15 mars 2026"
new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date());
// → "March 15, 2026"
new Intl.DateTimeFormat('ar', { dateStyle: 'long' }).format(new Date());
// → "15 مارس 2026"

new Intl.NumberFormat('fr', { style: 'currency', currency: 'EUR' }).format(12.5);
// → "12,50 €"
new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(12.5);
// → "€12.50"
```

`Intl.*` est natif ECMAScript depuis 2017+. Pas besoin de moment.js, dayjs, ou date-fns pour le format simple.

### 5.3 Propriétés logiques CSS pour le RTL

```css
/* ❌ Avant : casse en RTL (texte à droite, padding à gauche) */
.card {
  padding-left: 16px;
  margin-right: 8px;
  text-align: left;
  border-left: 2px solid;
}

/* ✅ Après : propriétés logiques — fonctionnent en LTR ET RTL */
.card {
  padding-inline-start: 16px;
  margin-inline-end: 8px;
  text-align: start;
  border-inline-start: 2px solid;
}
```

| Physique (LTR-only) | Logique (LTR + RTL) |
|---------------------|----------------------|
| `padding-left`, `padding-right` | `padding-inline-start`, `padding-inline-end` |
| `margin-top`, `margin-bottom` | `margin-block-start`, `margin-block-end` |
| `left`, `right` | `inset-inline-start`, `inset-inline-end` |
| `text-align: left` | `text-align: start` |
| `border-left` | `border-inline-start` |

Quand tu mets `<html dir="rtl">`, **tout le layout se miroite** automatiquement. Tu ne touches à aucune CSS.

### 5.4 Sélecteur de langue persistant

```ts
const supported = ['fr', 'en', 'ar'] as const;
type Lang = typeof supported[number];

function setLang(lang: Lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  localStorage.setItem('lang', lang);
  url.searchParams.set('lang', lang);
  history.replaceState({}, '', url);
  loadLocale(lang).then(applyTranslations);
}

// Au boot : URL → localStorage → navigator.language → fallback
function detectLang(): Lang {
  const fromUrl = new URL(location.href).searchParams.get('lang');
  if (fromUrl && supported.includes(fromUrl as Lang)) return fromUrl as Lang;
  const stored = localStorage.getItem('lang');
  if (stored && supported.includes(stored as Lang)) return stored as Lang;
  const browser = navigator.language.split('-')[0];
  if (supported.includes(browser as Lang)) return browser as Lang;
  return 'fr';
}
```

Ordre de priorité **URL > localStorage > navigator.language > default**. C'est la convention standard — un user qui partage `?lang=en` doit voir l'anglais quel que soit son navigateur.

## 6. Validation : Lighthouse + axe-core

### Lighthouse (en local)

```bash
npm run build && npm run preview &     # démarre le serveur build prod
npx --yes lighthouse http://localhost:4173 \
  --preset=desktop \
  --only-categories=performance,accessibility \
  --quiet \
  --chrome-flags="--headless=new --no-sandbox"

# Résultat mesuré :
# performance     99
# accessibility   100
```

Mobile bridé : un peu plus dur, mais on reste autour de 90+.

### axe-core CLI

```bash
npx --yes @axe-core/cli http://localhost:4173
# → 0 violation
```

axe-core couvre ~57 % des règles WCAG 2.2 AA automatiquement. Les ~43 % restants demandent un **audit manuel** (contraste perçu, ordre du focus, lisibilité du contenu, etc.). C'est pour ça qu'on combine axe + Lighthouse + revue manuelle.

### Pour aller plus loin en mesure

- **Lighthouse CI** (`@lhci/cli`) en GitHub Actions qui bloque la PR si LCP > 2.5 s.
- **Pa11y CI** pour scanner toutes les pages d'un sitemap.
- **Real User Monitoring** avec `web-vitals` envoyé à Sentry/Datadog/votre endpoint.

## 7. Pièges réels rencontrés

3 pièges concrets pendant la construction :

1. **Bannière en `display: block` qui pousse le contenu** → CLS = 0.38. Fix : `position: fixed; inset-block-end: 0`. Ça reste visible mais ne reflow pas.
2. **Vite preview server died avec un timeout court** → quand on benchmark Lighthouse en CLI, le preview server doit rester up. Soit `npm run preview &` en background, soit utiliser `lhci collect --start-server-command="npm run preview"`.
3. **`Intl.PluralRules('ar').select(count)`** → l'arabe a **6** catégories (`zero`, `one`, `two`, `few`, `many`, `other`). Si tu ne couvres que `one`/`other` dans ton dictionnaire, tu vas afficher `undefined` pour 50 % des cas en AR. Toujours fallback sur `other` :
   ```ts
   const cat = plural.select(count);
   const text = messages[key][cat] ?? messages[key].other;
   ```

Aucun nouveau piège global à capturer dans `pieges.ts` — ce sont des spécificités perf/i18n bien documentées sur place.

## 8. Pour aller plus loin

- **Service Worker + cache** : ajoute un SW Workbox qui met les assets statiques en cache offline. Score PWA Lighthouse devient atteignable.
- **Critical CSS extracted** : utilise [`critical`](https://github.com/addyosmani/critical) en prod plutôt que d'inliner à la main. Le CSS du fold est extrait automatiquement.
- **Streaming SSR** : si tu rends la landing dynamique (Next.js), utilise `<Suspense>` pour streamer les sections en bas de page sans bloquer le LCP.
- **CrUX** sur ton domaine déployé via PageSpeed Insights — chiffres réels des utilisateurs au lieu du lab Lighthouse.
- **APCA** (algorithme successeur du contraste WCAG) pour des couleurs perceptuellement justes — utile dès que tu pousses au-delà du AA basique.
- **Tolgee** ou **Crowdin** : plateforme collaborative pour gérer les traductions à plusieurs (rôles traducteur, validation, contexte, screenshots).
- **Pa11y CI** : scanne toutes les routes d'un sitemap et bloque la PR si une régression a11y est détectée.
