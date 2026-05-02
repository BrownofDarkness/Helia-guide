# Helia — guide du développeur web

[![License: MIT](https://img.shields.io/github/license/BrownofDarkness/Helia-guide?color=blue)](LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/BrownofDarkness/Helia-guide)](https://github.com/BrownofDarkness/Helia-guide/commits/main)
[![Stars](https://img.shields.io/github/stars/BrownofDarkness/Helia-guide?style=flat&logo=github)](https://github.com/BrownofDarkness/Helia-guide/stargazers)
[![Astro](https://img.shields.io/badge/Astro-6-FF5D01?logo=astro&logoColor=white)](https://astro.build)
[![Starlight](https://img.shields.io/badge/Starlight-0.38-7E8FFF?logo=astro&logoColor=white)](https://starlight.astro.build)
[![Langue](https://img.shields.io/badge/langue-Français-blue)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](https://github.com/BrownofDarkness/Helia-guide/pulls)

**Helia** est un site statique pédagogique en français qui couvre l'ensemble du développement web moderne — des fondations informatiques jusqu'à la mise en production et la carrière. **17 axes**, **5 parcours fil-rouge** narratifs, **280 termes** au glossaire, **32 pièges réels** documentés. Construit avec **Astro + Starlight**.

## Démarrage rapide

```bash
npm install
npm run dev
```

Le site est accessible sur `http://localhost:4321`.

## Scripts disponibles

| Commande | Action |
|----------|--------|
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Vérifie les types et génère le site statique dans `dist/` |
| `npm run preview` | Prévisualise le build de production |

## Structure

```
.
├── src/
│   ├── content/docs/        ← cours et chapitres en MDX
│   ├── components/          ← Exercise, Quiz, Diagram, TabbedCode...
│   ├── styles/              ← CSS personnalisé
│   └── assets/              ← logo, illustrations
├── exercises/               ← canevas et corrections d'exercices (à cloner par l'apprenant)
├── public/                  ← fichiers servis tels quels
├── astro.config.mjs         ← configuration Astro/Starlight
└── package.json
```

## Les 17 axes

1. Fondations informatiques
2. Comment fonctionne le Web
3. Analyse & conception
4. Outils du développeur
5. Frontend : HTML & CSS
6. JavaScript & TypeScript
7. Frameworks frontend
8. Backend (Node/TS, Python Django/Flask/FastAPI, PHP)
9. Bases de données
10. BaaS & services managés (Firebase, Supabase, …)
11. Qualité & tests
12. Sécurité applicative
13. Performance & accessibilité
14. DevOps & exploitation
15. Méthodes & soft skills
16. Spécialisations (mobile, IA, temps réel, …)
17. Carrière & parcours

## Contribuer / suivre l'avancement

Chaque axe possède un `index.mdx` avec son plan détaillé. Les sections marquées 🚧 sont à rédiger lors des phases suivantes.
