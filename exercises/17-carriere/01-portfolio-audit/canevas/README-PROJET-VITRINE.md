# <Nom du projet>

> Tagline en 1 ligne — qu'est-ce que ça fait, pour qui.

[![Demo](https://img.shields.io/badge/demo-online-success)](https://your-demo.url)
![CI](https://github.com/you/repo/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue)

![Capture / GIF](./assets/cover.png)

## Pourquoi

2-3 phrases : quel problème ça résout, pour qui.

## Démo

- 🌐 **Live** : https://demo.example
- 📺 **Loom 90 secondes** : [lien]
- 🔑 **Compte de test** : `demo@example.com` / `demo`

## Stack technique

- **Frontend** : Next.js 16 + Tailwind v4 + Radix UI
- **Backend** : Hono + Drizzle + Postgres 17 + Better Auth
- **Déploiement** : Fly.io (eu-west-3) + Cloudflare CDN
- **Tests** : Vitest + Playwright
- **Observabilité** : Sentry + Better Stack

## Fonctionnalités

- ✅ ...
- ✅ ...
- ✅ ...

## Décisions techniques notables

- **Drizzle plutôt que Prisma** : runtime edge-compatible, moins d'overhead — voir [ADR-002](./docs/adrs/002-drizzle.md)
- **Better Auth plutôt que Clerk** : open source, contrôle total des cookies — voir [ADR-001](./docs/adrs/001-better-auth.md)
- **pgvector** pour la recherche : 0 nouvelle infra, transactionnel — voir [ADR-003](./docs/adrs/003-pgvector.md)

## Démarrer en local

```bash
git clone https://github.com/you/project
cp .env.example .env  # remplir les valeurs
docker compose up -d   # postgres + redis
npm install
npm run db:migrate
npm run dev
# Ouvre http://localhost:3000
```

## Tests

```bash
npm test                    # unit + integration
npm run test:e2e           # Playwright
npm run lint               # Biome ou ESLint
npm run typecheck          # tsc --noEmit
```

- Couverture : **78 %** — 142 tests
- E2E : flow complet auth + CRUD principal
- Lighthouse CI bloque les PR si LCP > 2.5 s

## Métriques (live)

- Lighthouse mobile : **96 / 100 / 100 / 100**
- Cold start Fly : **~180 ms**
- Latence API p95 : **120 ms**
- Bundle JS gz : **42 KB**

## Architecture

![Architecture](./docs/architecture.svg)

## Roadmap

- [ ] Recherche full-text Postgres
- [ ] Mode hors ligne (PWA)
- [ ] Notifications push

## Contribuer

PRs bienvenues. Voir [CONTRIBUTING.md](./CONTRIBUTING.md).

## Licence

MIT
