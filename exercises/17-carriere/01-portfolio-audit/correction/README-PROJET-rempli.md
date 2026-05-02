# TaskMaster Pro

> SaaS multi-tenant de gestion de tâches d'équipe — Hono + Postgres + Better Auth + Stripe. Construit en solo en 80 h sur 3 mois pour démontrer mes compétences full-stack en production.

[![Demo](https://img.shields.io/badge/demo-online-success)](https://taskmaster.dev)
[![CI](https://github.com/alice/taskmaster/actions/workflows/ci.yml/badge.svg)](https://github.com/alice/taskmaster/actions)
[![Lighthouse](https://img.shields.io/badge/Lighthouse-96%2F100%2F100%2F100-brightgreen)]()
![License](https://img.shields.io/badge/license-MIT-blue)

![Capture du dashboard](./assets/cover.png)

## Pourquoi

Les équipes de 5 à 30 personnes paient **$200+/mois** pour Asana ou Notion alors qu'elles n'utilisent que 10 % des features. **TaskMaster Pro** offre l'essentiel — tâches, projets, assignations, commentaires — sans le poids, à $5/seat.

Side-project pour démontrer ma stack 2026 : **Hono streaming + Postgres RLS + Better Auth + Stripe webhooks idempotents**, déployé multi-région sur **Fly.io eu-west-3 + ams2**.

## Démo

- **Live** : [taskmaster.dev](https://taskmaster.dev) (login avec Google, free tier 10 users)
- **Vidéo 60 s** : [Loom](https://loom.com/share/xxx)
- **Compte test** : `demo@taskmaster.dev` / `demo` — workspace pré-rempli

## Stack

| Couche | Tech | Pourquoi |
|--------|------|----------|
| Frontend | Next.js 16 (App Router) + Tailwind v4 + Radix UI | Server Components pour les vues read-only (0 KB JS), Client uniquement où nécessaire |
| Backend | Hono sur Fly.io machines | 4 ms de cold-start, edge-ready, type-safe avec Zod |
| Database | Postgres 17 + Drizzle ORM | RLS multi-tenant + migrations versionnées |
| Auth | Better Auth (OAuth Google + magic link) | Cookie HttpOnly + 2FA TOTP optionnel |
| Paiement | Stripe Checkout + webhooks signés | Idempotence par `event.id` |
| Email | Resend + React Email | Templates JSX, sourcemaps incluses |
| Monitoring | Sentry + Better Stack + PostHog | RUM Core Web Vitals + funnel signup |
| CI/CD | GitHub Actions OIDC → Fly.io | Trivy scan + SBOM Anchore + 0 secret long-lived |

## Métriques

| Métrique | Valeur |
|----------|--------|
| **LCP mobile bridé** | 1.2 s |
| **Bundle JS gz** | 86 KB |
| **Lighthouse mobile** | 96 / 100 / 100 / 100 |
| **Couverture tests** | 81 % (Vitest + Playwright) |
| **API p95 latency** | 142 ms |
| **Uptime sur 6 mois** | 99.94 % |
| **MTTR sur 3 incidents** | 14 min |
| **Code base** | ~4500 lignes TypeScript strict, 0 `any` |

## Démarrer en local

```bash
git clone https://github.com/alice/taskmaster
cd taskmaster
cp .env.example .env.local        # remplis les clés
docker compose up -d              # Postgres + Redis local
pnpm install
pnpm db:migrate
pnpm dev                           # → http://localhost:3000
```

Auth en local : magic link arrive dans la console (pas envoyé en réel).

## Tests

```bash
pnpm test           # Vitest (unit + intégration)
pnpm test:e2e       # Playwright (3 parcours critiques)
pnpm test:coverage  # rapport HTML
```

CI bloque la PR si :
- Tests rouges
- Couverture < 80 %
- Lighthouse perf < 90 (sur PR preview)
- axe-core trouve une violation
- Trivy scan trouve un CRITICAL

## Architecture

```
┌──────────────────────────────────────┐
│  Next.js (Vercel) — RSC + Client     │
│   ↓ tRPC streaming                   │
├──────────────────────────────────────┤
│  Hono API — 2 machines Fly CDG/AMS   │
│   ↓                                  │
├──────────────────────────────────────┤
│  Postgres + RLS + Drizzle  │  Redis  │
└──────────────────────────────────────┘
```

Détails dans [`docs/architecture.md`](./docs/architecture.md). Décisions consignées dans [`docs/adr/`](./docs/adr/) (5 ADR au moment de l'écriture).

## Démarches qualité

- **TypeScript strict** + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`
- **ESLint v9 flat config** + `typescript-eslint` strict
- **Pre-commit hook** husky + lint-staged
- **Conventional commits** + changesets pour le versioning
- **Post-mortem** systématique sur tout incident > 5 min

## Limites assumées

- Pas de **mobile native** (PWA installable suffisante pour la cible).
- Pas de **collaboration temps réel** (Yjs/CRDT) — le scope V1 ne le justifie pas.
- Pas de **multi-langue** au-delà de FR/EN — viendra avec la traction.
- **1 région principale** au lancement (CDG). Multi-région après PMF.

## Roadmap publique

- ✅ V1 : auth, tâches, projets, commentaires
- ✅ V2 : Stripe subscriptions + admin
- 🚧 V3 : API publique + webhooks (Q3)
- 📋 V4 : intégrations Slack / Linear (Q4)
- 📋 V5 : mobile PWA installable (2027)

## Contact

- 💼 [LinkedIn — Alice Dupont](https://linkedin.com/in/alicedupont)
- 🐦 [@alice_codes](https://twitter.com/alice_codes)
- 📧 alice@dupont.dev
- 💼 Disponible **freelance** à partir de janvier 2027 — TJM 850 €/j (cf. [TJM-rempli.md](../TJM-rempli.md))

## License

MIT — fais-en ce que tu veux. Si tu reprends le pattern, j'apprécierais un crédit / une étoile sur GitHub.
