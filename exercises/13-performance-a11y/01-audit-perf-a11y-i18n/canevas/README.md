# Canevas — Audit perf + a11y + i18n (FastBites)

> Tu reçois une **landing page volontairement catastrophique** : LCP > 5 s, CLS > 0.3, 14 violations a11y axe-core, monolingue FR avec strings hardcodées. Ta mission : **mesurer**, **identifier**, **corriger**, **internationaliser** (FR + EN + AR avec RTL), et **documenter** dans un rapport d'audit avant/après chiffré.
>
> C'est l'exercice le plus complet pour comprendre **où le web casse en pratique** : utilisateurs sur mobile, connexions lentes, déficiences visuelles ou motrices, locales différentes. Trois axes pour le prix d'un.

## Ce que tu vas faire

| Étape | Sortie |
|-------|--------|
| 1. **Mesurer** l'état initial | Captures Lighthouse, axe DevTools, screenshots |
| 2. **Optimiser perf** | LCP ≤ 2.5 s, CLS ≤ 0.1, TBT ≤ 200 ms |
| 3. **Corriger a11y** | 0 violation axe-core, score Lighthouse ≥ 95 |
| 4. **Internationaliser** | FR + EN + AR avec sélecteur de langue + RTL pour AR |
| 5. **Rédiger** `AUDIT_REPORT.md` | Tableau avant/après chiffré + commits associés |

À la fin tu auras vécu :
- **Les 5 leviers Performance** qui pèsent vraiment (image hero, JS lazy, CLS bannière, CSS critique, debounce maison vs lodash entier).
- **Les 4 piliers a11y** : sémantique HTML, labels + erreurs annoncées, focus, contraste.
- **`Intl.PluralRules`** pour l'arabe (6 catégories vs 2 en anglais), `Intl.DateTimeFormat`, `Intl.NumberFormat`.
- **Propriétés logiques CSS** (`padding-inline-start` vs `padding-left`) qui font marcher le RTL automatiquement.

## Pré-requis

- **Node ≥ 20** (`node --version`).
- **Chrome / Edge / Chromium** (pour Lighthouse en local).
- Optionnel : extension **axe DevTools** (Chrome / Firefox) pour l'audit interactif.

## Démarrer

```bash
npm install
npm run dev
# → http://localhost:5173
```

### Mesurer l'état initial — discipline pédagogique

**Avant de toucher à une seule ligne**, fais ces 4 mesures et note-les dans un fichier `BEFORE.md` :

```bash
# 1. Lighthouse mobile bridé (Slow 4G + 4× CPU)
npm run lh   # ou : npx lighthouse http://localhost:5173 --preset=mobile --view

# 2. axe-core
npx --yes @axe-core/cli http://localhost:5173

# 3. DevTools → Performance trace : enregistre 5s avec un clic. Note les long tasks.

# 4. Network tab : note le poids transféré et le nombre de requêtes au load.
```

**Pourquoi mesurer avant** ? Sans chiffres avant, tu ne peux pas prouver que tes corrections ont marché. Le `AUDIT_REPORT.md` final doit montrer **avant/après chiffré** — c'est ce que demande un manager / client / pentester.

## Démarche en 5 étapes

### Étape 1 — Mesurer (1 h)

Lis le code rapidement, mais **ne corrige rien encore**. Lance les 4 audits ci-dessus et écris :

```markdown
# BEFORE.md (avant correctifs)

## Lighthouse mobile
- Performance : 31
- Accessibility : 62
- LCP : 5.4 s
- TBT : 740 ms
- CLS : 0.38

## axe-core
- 14 violations
- 4 critiques (alt manquants, pas de label, contraste, pas de focus visible)

## Performance trace
- Long task au clic « Commander » : ~400 ms
- Lodash chargé entier (~70 KB)
```

### Étape 2 — Performance (3–5 h)

Attaque dans cet ordre (impact décroissant) :

| Levier | Impact LCP | Impact CLS | Impact bundle |
|--------|------------|------------|---------------|
| Image hero `width`+`height`+`srcset`+`fetchpriority` | **−2 s** | **−0.2** | −60 % bytes mobile |
| Remplacer `lodash` complet par `debounce` maison | — | — | **−65 KB gz** |
| Bannière en `position: fixed` au lieu de poussée | — | **−0.18** | — |
| `prefers-reduced-motion` | — | — | — |
| CSS critique inline | −300 ms | — | — |
| Lazy-load des locales (i18n) | − | − | −3 KB par user |
| `font-display: swap` + preload | −200 ms | — | — |

### Étape 3 — Accessibilité (2–3 h)

Suis la liste axe-core ligne par ligne. Pour chaque violation :

```html
<!-- ❌ Avant -->
<div onclick="goToOrder()">Commander</div>

<!-- ✅ Après -->
<button type="button" onclick="goToOrder()">Commander</button>
```

Patterns à appliquer :

- **Sémantique** : `<header>`, `<nav>`, `<main>`, `<footer>`, `<button>`, `<a>` à la place des `<div>`.
- **Labels** : chaque `<input>` a un `<label for="...">` (pas un placeholder).
- **Erreurs** : `role="alert"` + `aria-invalid` + `aria-describedby`.
- **Focus** : `:focus-visible` avec outline contrasté (jamais `outline: none` sans alternative).
- **Hiérarchie** : un seul `<h1>`, puis `<h2>`, puis `<h3>` cohérents.
- **Modale** : focus trap + `Escape` pour fermer.
- **Contraste** : 4.5:1 minimum (DevTools → couleur → ratio).
- **Animations** : `@media (prefers-reduced-motion: reduce) { animation-duration: 0.01ms !important }`.

### Étape 4 — i18n (3–4 h)

```
src/
└── i18n/
    ├── fr.json       ← strings FR
    ├── en.json       ← strings EN
    └── ar.json       ← strings AR
```

```ts
async function loadLocale(lang: 'fr' | 'en' | 'ar') {
  return (await import(`./i18n/${lang}.json`)).default;
}

function setLang(lang: Lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  localStorage.setItem('lang', lang);
  // applique les traductions au DOM
}
```

**Règles importantes** :

1. **`Intl.PluralRules`** pour les pluriels — ne fais **pas** `if (count === 1)`. Exemple : l'arabe a 6 catégories (`zero`, `one`, `two`, `few`, `many`, `other`).
2. **`Intl.DateTimeFormat`** + **`Intl.NumberFormat`** pour les dates/nombres/devises (pas de moment.js, pas de `toFixed(2)` à la main).
3. **Propriétés logiques CSS** : `padding-inline-start` au lieu de `padding-left`, `text-align: start` au lieu de `text-align: left`. Le RTL fonctionne **gratuitement**.
4. **Sélecteur de langue persistant** : URL `?lang=en` > localStorage > `navigator.language` > défaut.

### Étape 5 — Re-mesurer + AUDIT_REPORT.md (1–2 h)

Refais les 4 audits de l'étape 1 → écris `AFTER.md` puis fusionne dans `AUDIT_REPORT.md` :

```markdown
# Rapport d'audit — FastBites landing

## Avant / après

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| LCP | 5.4 s | 2.2 s | −59 % |
| TBT | 740 ms | 120 ms | −84 % |
| CLS | 0.38 | 0.02 | −95 % |
| Score perf Lighthouse | 31 | 94 | +200 % |
| Violations axe-core | 14 | 0 | −100 % |

## Détail par catégorie

### Performance (P-001 à P-008)
... (chaque correctif avec son commit)

### Accessibilité (A-001 à A-010)
...

### i18n (I-001 à I-005)
...
```

C'est le format standard d'un audit pro : **résumé exécutif** + **détail par item** + **commits**.

## Vérifier

```bash
npm run build       # build prod
npm run preview     # http://localhost:4173

# Lighthouse sur le build prod (plus représentatif)
npm run lh

# axe-core
npx --yes @axe-core/cli http://localhost:4173

# Bundle size (avant/après lodash)
ls -la dist/assets
```

Cibles à atteindre :

| Métrique | Cible |
|----------|-------|
| LCP mobile bridé | ≤ 2.5 s |
| CLS | ≤ 0.1 |
| TBT | ≤ 200 ms |
| Lighthouse perf | ≥ 90 |
| Lighthouse a11y | ≥ 95 |
| Violations axe-core | 0 |

## Bloqué ?

- **Lighthouse fluctue ±10 points entre runs** → c'est normal, le headless Chrome est imprévisible. Lance 3 fois et prends la médiane. En CI, utilise `lhci` qui fait 5 runs et applique les seuils.
- **`<img srcset>` ne se déclenche pas** → vérifie l'attribut `sizes`. Sans `sizes`, le navigateur prend toujours la plus grande variante. `sizes="(max-width: 640px) 100vw, 1024px"` lui dit "sur petit écran prends la 100vw, sinon 1024px".
- **CLS reste élevé même après width/height sur les images** → il vient probablement d'une **fonte** ou d'un **iframe**. Vérifie `font-display: swap` + dimensions explicites sur les iframes.
- **Mes textes en arabe se collent à droite mais le layout reste cassé** → tu utilises `padding-left`/`text-align: left` au lieu des **propriétés logiques** (`padding-inline-start`/`text-align: start`). Recherche `-left` et `-right` dans ton CSS — ils trahissent les fuites.
- **`Intl.PluralRules('ar').select(2)` retourne `'two'` mais mon dictionnaire n'a que `one`/`other`** → ajoute toutes les catégories pour l'AR. Au minimum fallback : `messages[key][cat] ?? messages[key].other`.
- **Le sélecteur de langue se réinitialise au refresh** → tu ne persistes ni dans `localStorage` ni dans l'URL. Lis dans cet ordre au boot : `URL.searchParams.get('lang')` → `localStorage.getItem('lang')` → `navigator.language`.
- **Mon `<button onclick>` ne se déclenche pas au clavier** → c'est probablement un `<div onclick>` que tu as mal converti. Un vrai `<button>` reçoit Enter et Space gratuitement.

## Ne commit pas

`dist/`, `node_modules/`, `BEFORE.md` (c'est ton brouillon — fusionne-le dans AUDIT_REPORT.md à la fin).

## Comparer avec la correction

Une fois fini, regarde `../correction/` :
- LCP **2.2 s**, perf **99/100**, a11y **100/100** mesurés
- Bundle JS **6 KB gzippé** (vs 71 KB avant)
- 3 langues + RTL natif via propriétés logiques
- `AUDIT_REPORT.md` complet avec mesures comparatives

Tes choix peuvent **différer** sans être moins bons. Compare la **structure** de ton rapport, la priorité que tu as donnée aux correctifs, et le format. La discipline « mesurer avant, mesurer après » est ce qui compte vraiment.
