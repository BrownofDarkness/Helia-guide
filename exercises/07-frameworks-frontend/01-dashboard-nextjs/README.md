# Exercice 7.1 — Dashboard Next.js

> **Axe** : 7 — Frameworks frontend
> **Difficulté** : avancé
> **Durée estimée** : 8 à 16 heures
> **Prérequis** : axes 6 et 7 lus, **Node.js ≥ 20** (voir ci-dessous)

## ⚙️ Avant de commencer — outils nécessaires

### Node.js ≥ 20

Si pas installé, voir la section [« Installer Node.js »](../../02-web/01-mini-curl/README.md#-avant-de-commencer--installer-nodejs) de l'exercice 2.1.

```bash
node --version       # v20.x.x ou plus récent
```

C'est tout — Next.js, Tailwind, shadcn/ui, Vitest, Playwright sont tous installés via npm.

## 🎯 Objectifs pédagogiques

- Structurer une app Next.js 15 (**App Router**)
- Bien distinguer **Server Components** et **Client Components**
- Mettre en place un **middleware** d'authentification simple
- Utiliser **Tailwind CSS** + composants shadcn/ui
- Implémenter une **Server Action** pour un formulaire
- Tester avec **Vitest** (unitaire) et **Playwright** (E2E)

## 📋 Énoncé

Tu vas construire un mini-dashboard pour une fictive plateforme **Tasky**. L'app comprend :

| Route | Type | Auth requise | Description |
|-------|------|--------------|-------------|
| `/` | Server Component | non | Landing page, présente le produit |
| `/login` | Client Component | non | Formulaire connexion (simulé, pas de vraie DB) |
| `/dashboard` | Server Component | **oui** | Tableau de bord avec stats serveur |
| `/dashboard/tasks` | Server Component | oui | Liste de tâches (lues côté serveur) |
| `/api/health` | Route Handler | non | `{ status: 'ok' }` |

### Auth simulée

Pour rester focalisé sur Next.js (l'auth réelle est l'**axe 10**) :

- `/login` accepte n'importe quel email + mot de passe `demo`.
- Au login, une **server action** pose un cookie `session=fake-token-...`.
- Le **middleware** `middleware.ts` redirige vers `/login` si on accède à `/dashboard*` sans cookie.
- Un bouton « Se déconnecter » supprime le cookie.

### Mode sombre

Toggle clair/sombre via `next-themes`, persisté en localStorage.

## ✅ Critères d'acceptation

| Critère | Détail |
|---------|--------|
| `npm run build` passe | TypeScript strict, 0 erreur |
| `npm run lint` passe | ESLint configuré |
| `/` rendu côté serveur, **0 KB JS** envoyé | Server Component pur |
| `/login` est un Client Component | utilise `useState`, `useFormStatus` |
| Middleware redirige `/dashboard` non authentifié | Vérifié par Playwright |
| Server Action `loginAction` fonctionne | Pose le cookie, redirige `/dashboard` |
| `next-themes` fonctionne (clair/sombre/auto) | Pas de FOUC au chargement |
| `/dashboard/tasks` lit les tâches **côté serveur** | Pas de fetch dans Client Component |
| Test Vitest sur un composant client | Au moins 2 cas |
| Test Playwright sur le parcours login → dashboard | Au moins 1 happy path |

### Bonus

- shadcn/ui pour Button, Card, Input, Form.
- Server Action de logout.
- Skeleton loaders sur le dashboard.
- Page 404 custom.

## 🗺️ Découpage en sous-étapes (vs durée annoncée)

La durée 8–16 h est **optimiste** pour un débutant qui découvre App Router + Server Actions + auth + tests d'un coup. Voici un découpage réaliste :

| Étape | Durée min | Durée max | Qu'est-ce qui se passe |
|-------|-----------|-----------|------------------------|
| **0. Setup** | 30 min | 1 h | `npm install`, lecture README, lancer le dev server |
| **1. ThemeProvider + ThemeToggle** | 1 h | 2 h | Mode sombre sans FOUC, mount guard anti-hydration |
| **2. Layout + landing publique** | 1 h | 2 h | `app/layout.tsx`, `app/page.tsx`, premier server component |
| **3. Server Action `loginAction`** | 2 h | 3 h | Cookies HttpOnly, redirect, gestion erreur via `useActionState` |
| **4. Middleware d'auth** | 30 min | 1 h | Redirect `/dashboard` → `/login` si pas de session |
| **5. Dashboard server (lecture DB simulée)** | 1 h | 2 h | `app/dashboard/page.tsx`, Server Component qui lit `lib/fake-data.ts` |
| **6. Liste de tâches** | 1 h | 2 h | `app/dashboard/tasks/page.tsx`, idem pattern |
| **7. Tests Vitest sur ThemeToggle** | 1 h | 2 h | Configurer jsdom + matchMedia mock + tests |
| **8. (Bonus) Tests E2E Playwright** | 2 h | 4 h | Setup Playwright + 1 test happy path login |

**Total réaliste** : 10–19 h (vs 8–16 annoncé). La courbe d'apprentissage Next.js 16 + Server Components est rude la 1ère fois.

### Version minimale (8 h) vs version complète (19 h)

| Choix | Version minimale | Version complète |
|-------|-------------------|---------------------|
| Mode sombre | `next-themes` direct, OK FOUC | mount guard + suppressHydrationWarning |
| Auth | password literal `demo` ok | + rate-limit en mémoire sur `/login` |
| Tests | Vitest + 2 tests | + Playwright + golden path |
| Dashboard | 1 page stats simple | + page tasks + skeleton loaders |
| Build | `npm run build` passe | + lint + typecheck strict en CI |

→ **Si tu as 8 h, livre la version minimale**. Tu reviendras pour le polish quand tu auras besoin de cette feature dans un vrai projet.

## 🛠 Comment commencer

```bash
cd canevas/
npm install
npm run dev
# http://localhost:3000
```

Le canevas contient le scaffold Next.js + dossiers vides + stubs avec TODO.

## 🧪 S'auto-valider

```bash
# Tests unitaires (Vitest)
cd canevas/
npm run test

# Tests E2E (Playwright)
npx playwright install   # une fois
npm run test:e2e
```

## 💡 Indices

<details>
<summary>1. Structure de fichiers App Router</summary>

```
app/
├── layout.tsx                  ← root layout (html, body, ThemeProvider)
├── page.tsx                    ← landing /
├── login/
│   ├── page.tsx                ← formulaire login (Client)
│   └── actions.ts              ← server action loginAction
├── dashboard/
│   ├── layout.tsx              ← layout dashboard (sidebar, header avec déconnexion)
│   ├── page.tsx                ← stats
│   └── tasks/
│       └── page.tsx            ← liste de tâches (Server)
└── api/
    └── health/
        └── route.ts            ← GET /api/health

middleware.ts                    ← à la RACINE (pas dans app/)
components/                       ← composants partagés (theme-toggle, etc.)
lib/                              ← utilitaires (auth, fake-data)
```
</details>

<details>
<summary>2. Server Action minimale</summary>

```ts
// app/login/actions.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const password = formData.get('password');
  if (password !== 'demo') {
    return { error: 'Mot de passe incorrect (essaie "demo")' };
  }
  const cookieStore = await cookies();
  cookieStore.set('session', `fake-${Date.now()}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
  redirect('/dashboard');
}
```
</details>

<details>
<summary>3. Middleware d'auth</summary>

```ts
// middleware.ts (à la racine du projet)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');
  if (!session) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```
</details>

<details>
<summary>4. Server Component qui lit des données</summary>

```tsx
// app/dashboard/tasks/page.tsx
import { getAllTasks } from '@/lib/fake-data';

export default async function TasksPage() {
  const tasks = await getAllTasks();   // appel direct côté serveur

  return (
    <ul>
      {tasks.map(t => <li key={t.id}>{t.title}</li>)}
    </ul>
  );
}
```

`getAllTasks` peut être une fonction simple qui simule une DB :

```ts
// lib/fake-data.ts
export async function getAllTasks() {
  await new Promise(r => setTimeout(r, 100));   // simule la DB
  return [
    { id: 1, title: 'Apprendre Next.js' },
    { id: 2, title: 'Lire l\'axe 7' },
  ];
}
```
</details>

## 🔑 Correction

Voir [`correction/`](./correction/) — app complète, buildable, testable.

## 📚 Pour aller plus loin

- Remplace l'auth simulée par **Auth.js (NextAuth v5)** ou **Clerk** (axe 10).
- Persiste les tâches dans **PostgreSQL** via Prisma (axe 9).
- Déploie sur **Vercel** : `vercel deploy` (axe 14).
- Ajoute un **graphique** dans `/dashboard` avec [Recharts](https://recharts.org/).
