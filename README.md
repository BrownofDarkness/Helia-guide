# Helia — guide du développeur web

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
