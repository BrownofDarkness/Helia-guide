# Exercice 13.1 — Audit perf + a11y + i18n

> **Axe** : 13 — Performance & accessibilité
> **Difficulté** : intermédiaire / avancé
> **Durée estimée** : 8 à 16 heures
> **Prérequis** : axes 5, 6, 7, 13.1 à 13.5 lus, **Node.js ≥ 20**

## ⚙️ Avant de commencer

Voir [« Installer Node.js »](../../02-web/01-mini-curl/README.md#-avant-de-commencer--installer-nodejs).

```bash
node --version       # v20+ (idéalement 24)
```

## 🎯 Objectifs pédagogiques

- **Mesurer** l'état initial d'une page (Lighthouse, axe-core, RUM).
- **Optimiser** un Core Web Vital catastrophique (LCP > 5 s ou INP > 500 ms).
- **Corriger** au moins 8 violations WCAG 2.2 AA.
- **Internationaliser** une page monolingue en FR + EN + AR (RTL).
- **Documenter** un avant/après chiffré dans `AUDIT_REPORT.md`.

## 📋 Énoncé — landing « FastBites »

Le canevas contient une **landing page** d'un service de livraison fictif. Elle est :

- 💀 **lente** : ~5 s de LCP, ~600 ms d'INP, CLS > 0.3 sur mobile bridé,
- 💀 **inaccessible** : score axe-core très bas, ~12 violations,
- 💀 **monolingue FR** : strings hardcodées, dates / nombres au format FR uniquement.

Tu dois :

1. **Mesurer** l'état initial — Lighthouse mobile (CPU 4×, Slow 4G), axe-core via DevTools.
2. **Identifier** les problèmes (perf, a11y, i18n).
3. **Corriger** dans la version finale (`correction/` te donne le résultat attendu, ne le lis qu'après).
4. **Internationaliser** en FR + EN + AR avec sélecteur de langue + RTL pour AR.
5. **Documenter** avant/après dans `AUDIT_REPORT.md`.

## ✅ Critères d'acceptation

| Critère | Détail |
|---------|--------|
| LCP mobile bridé | ≤ 2,5 s (Lighthouse) |
| CLS | ≤ 0,1 |
| INP simulé / TBT | TBT ≤ 200 ms |
| Score Lighthouse perf | ≥ 90 |
| Score Lighthouse a11y | ≥ 95 |
| Violations axe-core | 0 |
| Lang attribute | présent + correct |
| 3 langues fonctionnelles | sélecteur, persistance, URL |
| Direction RTL en AR | layout, propriétés logiques |
| Pluralisation correcte | « 1 article » / « 2 articles » / « 0 article » |
| `AUDIT_REPORT.md` | tableau avant/après chiffré + commits |

### Bonus

- **CI Lighthouse** qui bloque la PR si LCP > 2.5 s.
- **RUM** avec `web-vitals` envoyé à un endpoint local.
- **Tests Playwright** : axe-core sur chaque locale.
- **A/B** d'images : AVIF + WebP + JPEG en `<picture>`.

## 🛠 Démarrer

```bash
cd canevas/
npm install
npm run dev
# Ouvre http://localhost:5173
```

### Mesurer l'état initial

1. **DevTools → Lighthouse** : Performance + Accessibility, mobile, Slow 4G + 4× CPU. Note le score, LCP, INP/TBT, CLS.
2. **DevTools → Issues** + extension **axe DevTools** : note les violations a11y.
3. **DevTools → Performance** : enregistre une session (clic sur un bouton, scroll). Identifie les long tasks.
4. **DevTools → Network** : note le poids total transféré et le nombre de requêtes.

Garde les chiffres **avant** dans un fichier `BEFORE.md` — tu les compareras à la fin.

### Pistes — questions à se poser

**Performance**
- L'image hero a-t-elle les bons attributs (`width`, `height`, `srcset`, `loading`, `fetchpriority`) ?
- Le JS est-il chargé en bloc, ou splitté ? Combien de KB sont vraiment nécessaires au rendu initial ?
- Y a-t-il du CSS / JS render-blocking dans le `<head>` ?
- Les polices ont-elles `font-display: swap` ? Sont-elles préchargées ?
- Les long tasks JS dépassent-elles 50 ms ?

**Accessibilité**
- L'attribut `lang` est-il présent sur `<html>` ?
- Tous les `<img>` ont-ils un `alt` ?
- Les boutons sont-ils des `<button>` ou des `<div onclick>` ?
- Les inputs ont-ils des `<label>` liés ?
- Les couleurs ont-elles un contraste 4.5:1 minimum ?
- Le focus est-il visible au clavier ?
- Le HTML utilise-t-il les landmarks (`<main>`, `<nav>`, etc.) ?
- Les erreurs sont-elles annoncées (live regions) ?
- Les animations respectent-elles `prefers-reduced-motion` ?

**Internationalisation**
- Les strings sont-elles externalisées dans un dictionnaire ?
- Les pluriels gèrent-ils `0`, `1`, `n` correctement par langue ?
- Les dates / nombres / devises utilisent-ils `Intl.*` ?
- Les marges utilisent-elles des **propriétés logiques** (`margin-inline-*`) ?
- En `dir="rtl"`, l'UI fonctionne-t-elle (icônes, scroll, focus) ?

## 🧪 Vérifier

```bash
# Lighthouse en CLI
npx --yes lighthouse http://localhost:5173 \
  --preset=mobile \
  --only-categories=performance,accessibility \
  --view

# Audit a11y headless
npx --yes @axe-core/cli http://localhost:5173

# Bundle size
npm run build
ls -la dist/assets

# (correction/) tests Playwright + axe
npm test
```

## 💡 Indices

<details>
<summary>1. Liste indicative des problèmes plantés (sans les emplacements)</summary>

**Performance (~10)**
1. Image hero JPEG 2000×1200 sans `srcset`, sans `width`/`height`.
2. Pas de `fetchpriority="high"` sur le LCP element.
3. CSS bloquant chargé via `<link>` standard sans optimisation.
4. JS chargé sans `defer` ni splitting → blocage du parser.
5. Boucle synchrone lourde au clic d'un bouton (long task ~400 ms).
6. Pas de `font-display: swap` → FOIT.
7. CLS dû à une bannière qui apparaît tardivement et pousse le contenu.
8. Lib `lodash` complète importée pour `debounce`.
9. Aucun cache HTTP / preconnect vers les CDN d'images.
10. Recompute coûteux à chaque keystroke (pas de debounce).

**Accessibilité (~10)**
1. `<html>` sans `lang`.
2. `<div onclick>` à la place de `<button>`.
3. Inputs sans `<label>`.
4. `<img>` sans `alt`.
5. Erreur de formulaire signalée uniquement par couleur rouge.
6. Contraste insuffisant sur le call-to-action (3.2:1).
7. `outline: none` sans alternative.
8. Pas de `<main>`, `<nav>`, hiérarchie de headings cassée.
9. Animations infinies sans respect de `prefers-reduced-motion`.
10. Modale custom sans focus trap ni `Escape`.

**i18n**
1. Toutes les strings hardcodées en français.
2. Dates et nombres formatés à la main.
3. Pluralisation par if/else.
4. Pas de support RTL.
5. Pas de sélecteur de langue.

</details>

<details>
<summary>2. Plan d'attaque conseillé</summary>

1. **Mesurer** (1 h) — Lighthouse + axe + Performance trace + screenshots.
2. **Performance** (3-5 h) — image hero, defer JS, splitter, debounce, CLS.
3. **Accessibilité** (2-3 h) — sémantique HTML, labels, focus, contraste.
4. **i18n** (3-4 h) — externaliser strings, ajouter `Intl.*`, RTL, sélecteur.
5. **Re-mesurer + AUDIT_REPORT.md** (1-2 h).

</details>

<details>
<summary>3. Outils utiles</summary>

```bash
# Audit a11y
npx --yes @axe-core/cli http://localhost:5173

# Lighthouse mobile
npx --yes lighthouse http://localhost:5173 --preset=mobile --view

# Bundle analyzer (Vite)
npx --yes vite-bundle-visualizer

# Vérifier RTL en local
# DevTools → Emulation → Forcer media features → prefers-color-scheme dark, prefers-reduced-motion
# ou ajouter <html dir="rtl"> manuellement
```
</details>

## 🔑 Correction

Voir [`correction/`](./correction/) — version optimisée + `AUDIT_REPORT.md` complet avec mesures avant/après.

## 📚 Pour aller plus loin

- **CI Lighthouse** sur GitHub Actions avec `@lhci/cli`.
- **Pa11y CI** pour scanner toutes les pages d'un sitemap.
- **CrUX** sur ton domaine déployé (PageSpeed Insights).
- **Tolgee** ou **Crowdin** pour gérer les traductions à plusieurs.
- **APCA** (futur successeur du contraste WCAG) pour des couleurs perceptuellement justes.
