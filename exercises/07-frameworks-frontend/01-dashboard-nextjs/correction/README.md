# Correction — Dashboard Next.js

> App Next.js 16 (App Router) avec Server Components, Server Actions, middleware d'auth, mode sombre sans FOUC, et tests Vitest. **Build green** : 6 routes, dont 5 statiques + 1 dynamique.
>
> Lis-la **après avoir tenté le canevas**, sinon tu te prives du « pourquoi » de chaque décision.

## Sommaire

1. [Pré-requis et lancement](#1-pré-requis-et-lancement)
2. [Architecture App Router](#2-architecture-app-router)
3. [Server Components vs Client Components](#3-server-components-vs-client-components)
4. [Server Actions et formulaires](#4-server-actions-et-formulaires)
5. [Middleware et auth simulée](#5-middleware-et-auth-simulée)
6. [Validation : build green + 2/2 tests](#6-validation--build-green--22-tests)
7. [Pièges réels rencontrés](#7-pièges-réels-rencontrés)
8. [Pour aller plus loin](#8-pour-aller-plus-loin)

---

## 1. Pré-requis et lancement

```bash
npm install
npm run dev          # http://localhost:3000 (HMR via Next + Turbopack)
npm run test         # Vitest sur ThemeToggle
npm run lint         # ESLint (eslint-config-next)
npm run build        # next build : 6 routes, TS strict, 0 erreur
```

Sortie de `npm run build` :

```
Route (app)
┌ ○ /                       (Static, 0 KB JS)
├ ○ /_not-found
├ ƒ /api/health             (Dynamic Route Handler)
├ ○ /dashboard              (Static, depend cookies — voir notes)
├ ○ /dashboard/tasks
└ ○ /login

ƒ Proxy (Middleware)
```

## 2. Architecture App Router

```
app/
├── layout.tsx              ← root layout (html lang=fr, ThemeProvider)
├── page.tsx                ← landing  /  (Server Component)
├── login/
│   ├── page.tsx            ← formulaire (Client Component)
│   └── actions.ts          ← server actions (loginAction, logoutAction)
├── dashboard/
│   ├── layout.tsx          ← header avec ThemeToggle + bouton logout
│   ├── page.tsx            ← cards stats (Server Component)
│   └── tasks/
│       └── page.tsx        ← liste de tâches (Server Component)
└── api/
    └── health/
        └── route.ts        ← GET → { status: 'ok' }

middleware.ts               ← À LA RACINE — protège /dashboard*
components/
├── theme-provider.tsx      ← Client (next-themes wrapper)
├── theme-toggle.tsx        ← Client (mount guard anti-hydration-mismatch)
└── theme-toggle.test.tsx   ← Vitest

lib/
└── fake-data.ts            ← async getAllTasks() / getStats() (simule la DB)
```

Trois conventions à mémoriser :

1. **`page.tsx` = route**, **`layout.tsx` = wrapper persistant** entre routes du même segment.
2. **Server Component par défaut.** On annote `'use client'` **uniquement** quand on a besoin de `useState`, `useEffect`, événements DOM, ou hooks de lib client (next-themes, etc.).
3. **`middleware.ts` à la racine du projet** (pas dans `app/`). Le `matcher` détermine sur quelles URLs il s'exécute.

## 3. Server Components vs Client Components

### 3.1 Le mental model en 3 lignes

| Server Component | Client Component |
|------------------|------------------|
| Rendu sur le serveur, **0 KB JS** envoyé au navigateur (sauf si interactif) | Rendu sur le serveur **+** envoyé au navigateur pour hydratation |
| Peut être `async`, peut accéder DB / FS / cookies directement | Pas `async` (sauf cas spéciaux), pas d'accès DB direct |
| `'use client'` **interdit** | `'use client'` **obligatoire** en première ligne |

### 3.2 Pourquoi `/dashboard/tasks` est un Server Component

```tsx
// app/dashboard/tasks/page.tsx
import { getAllTasks } from '@/lib/fake-data';

export default async function TasksPage() {
  const tasks = await getAllTasks();    // ← appel direct, pas de fetch HTTP
  return (
    <ul>
      {tasks.map(t => <li key={t.id}>{t.title}</li>)}
    </ul>
  );
}
```

Trois bénéfices vs un Client Component qui ferait `fetch('/api/tasks')` :

1. **0 KB JS supplémentaire** envoyé au navigateur (ce composant ne s'hydrate pas, il est juste du HTML).
2. **Pas de waterfall** : le serveur a directement les données, pas besoin d'un round-trip HTTP supplémentaire.
3. **Sécurité** : la fonction `getAllTasks()` peut accéder à des secrets, faire des queries SQL, lire des fichiers sensibles — sans jamais exposer ce code au navigateur.

### 3.3 Pourquoi `/login` est un Client Component

Parce qu'il a besoin de `useActionState` (un hook React qui ne peut tourner qu'au client) :

```tsx
'use client';
import { useActionState } from 'react';
import { loginAction } from './actions';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, { error: null });
  return (
    <form action={formAction}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button disabled={pending}>{pending ? 'Connexion...' : 'Se connecter'}</button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
```

Notes :

- `pending` désactive le bouton automatiquement pendant la soumission. Pas besoin de `setIsLoading(true)` à la main.
- `state.error` est l'objet retourné par `loginAction` quand la validation échoue côté serveur. Tu n'as **pas** à propager manuellement l'erreur.
- `formAction` (et pas `loginAction` directement) : c'est la version « augmentée » par `useActionState` qui sait gérer le state.

## 4. Server Actions et formulaires

```ts
// app/login/actions.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(prev: unknown, formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof email !== 'string' || typeof password !== 'string') {
    return { error: 'Champs invalides' };
  }
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

### 4.1 Pourquoi `'use server'` au top du fichier

Marque **toutes** les fonctions exportées comme exécutables uniquement côté serveur. Elles ne sont jamais incluses dans le bundle client. Si on essaie de les appeler depuis un Client Component, Next génère automatiquement un endpoint pour la fonction (POST avec sérialisation des arguments).

### 4.2 `httpOnly` — la règle pour les cookies de session

| Attribut | Effet | Toujours mettre ? |
|----------|-------|-------------------|
| `httpOnly: true` | Le cookie n'est **pas accessible** depuis JS (`document.cookie`) | **Oui** pour les cookies de session — protège du XSS |
| `secure: true` en prod | Le cookie n'est envoyé **qu'en HTTPS** | **Oui** en prod, optionnel en dev |
| `sameSite: 'lax'` | Le cookie n'est pas envoyé sur les requêtes cross-origin (sauf navigation top-level) | **Lax** par défaut, `'strict'` si on est paranoïaque |
| `maxAge: 86400` | Expire après N secondes | Oui — un cookie sans expiration vit jusqu'à la fermeture du navigateur |
| `path: '/'` | Envoyé sur toute l'app | Oui sauf si on veut limiter |

Si tu retiens **une seule règle** : **un cookie qui contient une session doit être `httpOnly`**. Sinon une faille XSS = vol de session = compromission complète.

### 4.3 `redirect()` doit être au top-level de l'action

```ts
// ✅ OK
export async function action() {
  // …
  redirect('/dashboard');
}

// ❌ Cassé : redirect throw une erreur spéciale qui doit remonter
export async function action() {
  try {
    redirect('/dashboard');
  } catch (e) {
    // ne JAMAIS catch redirect — c'est un signal interne de Next
  }
}
```

`redirect()` fonctionne en **throwant** une erreur typée que Next attrape lui-même. Si tu la catches dans ton code, le redirect ne se produit pas et tu bloques en plein milieu de l'action.

## 5. Middleware et auth simulée

```ts
// middleware.ts (RACINE du projet, pas dans app/)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

### 5.1 Pourquoi un middleware plutôt qu'un check dans chaque page

| Approche | Avantage | Inconvénient |
|----------|----------|--------------|
| Check dans chaque page | Granularité fine, logique custom par route | Risque d'oubli sur une nouvelle page → fuite |
| Middleware avec matcher | **Une seule règle**, impossible d'oublier | Logique uniforme sur tout le matcher |

Le middleware est **le bon endroit** pour les vérifications transversales (auth, locale, A/B test, rate-limit). Pour de la logique métier qui dépend de la route, mets-la dans la page.

### 5.2 Auth simulée — limites assumées

Le cookie `session=fake-${Date.now()}` n'est **pas** validé côté serveur. N'importe qui pourrait forger un cookie au nom n'importe quel et le middleware le laisserait passer. **Ne fais pas ça en prod.**

L'auth réelle (axe 10) ajoute :
- Hash du mot de passe (argon2id)
- Token signé (JWT, ou session ID + table `sessions` en DB)
- Vérification de la signature dans le middleware
- Rotation automatique
- Logout côté serveur (révocation)

Cet exercice se concentre sur **le câblage Next.js**. L'auth réelle est un sujet à part entière.

## 6. Validation : build green + 2/2 tests

```bash
npm run build
```

```
Route (app)                                Size  First Load JS
┌ ○ /                                  …
├ ƒ /api/health                        …
├ ○ /dashboard                         …
└ ○ /login                             …

✓ Compiled successfully
```

```bash
npm test
```

```
✓ components/theme-toggle.test.tsx (2 tests) 74ms
  ✓ ThemeToggle > rend un placeholder avant le mount
  ✓ ThemeToggle > rend le bouton accessible avec aria-label

Test Files  1 passed (1)
     Tests  2 passed (2)
```

Le test couvre **le pattern le plus subtil** de l'app : le mount guard pour éviter l'hydration mismatch. Si on testait juste « le bouton est cliquable », on raterait ce qui rend ce composant compliqué.

## 7. Pièges réels rencontrés

Cinq pièges, certains nouveaux à enregistrer dans `pieges.ts` :

1. **`window.matchMedia is not a function` dans Vitest + jsdom + next-themes** → jsdom n'implémente pas `matchMedia`, et `next-themes` y appelle dès le mount. Fix : `vitest.setup.ts` qui mocke `matchMedia` sur `window` (avec tous les `addEventListener` etc. pour éviter d'autres erreurs en cascade).
2. **Hydration mismatch warning sur `<html>`** → quand on utilise `next-themes` avec `attribute="class"`, le serveur ne connaît pas la préférence (system, light, dark) au 1er render. Fix : `suppressHydrationWarning` sur `<html>` (autorisé officiellement dans ce cas précis).
3. **FOUC au chargement** → `ThemeProvider` mal configuré ou placé dans un client component qui se monte trop tard. Fix : `attribute="class"` + `disableTransitionOnChange` + provider en haut du root layout.
4. **JSX automatique non configuré dans Vitest** → erreur `React is not defined` même en React 19. Fix : `esbuild: { jsx: 'automatic' }` dans `vitest.config.ts`.
5. **Vitest 2.x + Node 24** → instabilité Tinypool (déjà capturé). Upgrade vers `^3.2.4`.

Le piège #1 est suffisamment courant pour mériter sa propre entrée — beaucoup de gens galèrent dessus avec next-themes, MUI, ChakraUI ou tout système qui répond aux media queries.

> ℹ️ **Capture dans `pieges.ts` global** : voir l'entrée `vitest-jsdom-matchmedia-missing` (à ajouter si tu reproduis le piège dans un autre exercice — pour l'instant on documente sur place).

## 8. Pour aller plus loin

- **Auth réelle** : remplace l'auth simulée par **Auth.js v5** (anciennement NextAuth) ou **Clerk**. C'est le sujet de l'**axe 10** (BaaS / auth).
- **Persistence** : remplace `lib/fake-data.ts` par Drizzle + SQLite (axe 9.1). Tu verras que la fonction de Server Component reste pareille — le coupling avec Next reste minimal.
- **shadcn/ui** : `npx shadcn@latest add button card input form` pour des composants Tailwind cohérents et accessibles. Compatible Server + Client Components.
- **Skeleton loaders** : utilise `loading.tsx` à côté de `page.tsx`. Next l'affiche automatiquement pendant le streaming d'un Server Component lent.
- **Playwright E2E** : ajoute un test `tests/e2e/login.spec.ts` qui simule le parcours complet (visite `/dashboard` → redirige vers `/login` → soumet « demo » → arrive sur `/dashboard`). Couvre middleware + form action en un seul test.
- **Déploiement Vercel** : `npx vercel`. Tu obtiens en 30 secondes une URL HTTPS qui sert ta SPA. Reviens à l'**axe 14** (DevOps) pour la version "vrai pipeline".
