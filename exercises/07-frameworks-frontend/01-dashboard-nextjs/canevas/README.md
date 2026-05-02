# Canevas — Dashboard Next.js

> Tu vas construire un dashboard Next.js 16 (App Router) avec **Server Components**, **Server Actions**, **middleware d'auth**, et **Tailwind v4**. C'est l'exercice qui fait le plus la jonction entre tout ce que tu as appris : TypeScript strict, fetch typé, store réactif (côté client), routing (côté framework).

## Ce que tu vas faire

Un mini-dashboard pour la fictive plateforme **Tasky** :

| Route | Type | Auth | Quoi |
|-------|------|------|------|
| `/` | Server Component | non | Landing page (0 KB JS envoyé) |
| `/login` | Client Component | non | Formulaire avec `useActionState` |
| `/dashboard` | Server Component | **oui** | Cards de stats |
| `/dashboard/tasks` | Server Component | oui | Liste de tâches lues côté serveur |
| `/api/health` | Route Handler | non | `{ status: 'ok' }` |

Plus :
- **Mode clair/sombre** via `next-themes` (sans FOUC)
- **Auth simulée** : password `demo`, cookie `httpOnly`, middleware qui protège `/dashboard*`
- **Tailwind v4** + design tokens
- **Tests Vitest** sur les Client Components (jsdom + matchMedia mocké)

À la fin, tu auras une vraie compréhension de **Server vs Client Components**, du modèle de Server Actions (vs API routes), et des points subtils (hydration, cookie httpOnly, suppressHydrationWarning).

## Pré-requis

- **Node ≥ 20** (`node --version`).

C'est tout. Next.js, Tailwind, next-themes, Vitest sont installés via `npm install`.

## Démarrer

```bash
npm install
npm run dev          # → http://localhost:3000
```

Hot-reload immédiat sur tous les fichiers `.tsx`. Le typecheck tourne dans VS Code (rouge sous les erreurs).

## Fichiers à compléter (11 TODO au total)

| Fichier | TODO | Sujet |
|---------|------|-------|
| `app/layout.tsx` | 1 | Wrapper `<ThemeProvider>` autour de `{children}` |
| `app/login/actions.ts` | 2–5 | `loginAction` (validation, cookie httpOnly, redirect) + `logoutAction` |
| `app/login/page.tsx` | 6 | Formulaire avec `useActionState`, affichage `pending` + `error` |
| `app/dashboard/page.tsx` | 7 | Cards stats (Server Component qui appelle `getStats()`) |
| `app/dashboard/tasks/page.tsx` | 8 | Liste de tâches (Server Component) |
| `middleware.ts` | 9 | Vérifier cookie `session`, rediriger `/login` si absent |
| `components/theme-provider.tsx` | 10 | Wrapper `<NextThemesProvider attribute="class" defaultTheme="system">` |
| `components/theme-toggle.tsx` | 11 | Mount guard pour éviter le mismatch SSR/client |

## Ordre suggéré

```
1. theme-provider + theme-toggle  → faire marcher le mode sombre d'abord (visuel)
2. layout.tsx                      → wrap le tout
3. login actions + form            → premier vrai parcours utilisateur
4. middleware                      → protéger /dashboard
5. dashboard + tasks               → Server Components qui lisent les données
```

Si tu commences par le middleware sans les actions, tu vas tester un système incomplet et ne sauras pas d'où viennent les bugs. **Construis le happy path avant de protéger.**

## TODO clés à retenir

### Server Action
```ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(prev: unknown, formData: FormData) {
  const password = formData.get('password');
  if (password !== 'demo') return { error: 'Mot de passe incorrect' };
  (await cookies()).set('session', `fake-${Date.now()}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 86400,
  });
  redirect('/dashboard');
}
```

### Mount guard ThemeToggle (anti hydration mismatch)
```tsx
'use client';
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return <div aria-hidden="true" className="w-10 h-10" />;
```

### Middleware
```ts
export function middleware(request: NextRequest) {
  if (!request.cookies.get('session')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ['/dashboard/:path*'] };
```

## Tester

```bash
npm run test         # Vitest (composants client : ThemeToggle)
npm run lint         # ESLint
npm run build        # next build : doit passer (TS strict + ESLint)
```

Build attendu : 6 routes, dont `/api/health` (`ƒ` dynamic) et 5 statiques (`○`). Si tu vois `λ` (Server Component dynamic), c'est probablement parce que tu utilises `cookies()` ou `headers()` dans une page — c'est attendu pour `/dashboard*`.

## Bloqué ?

- **`/login` ne soumet pas le formulaire** → tu as oublié `action={formAction}` (la prop `formAction` du retour de `useActionState`). Avec une `<form action={loginAction}>` directement, tu n'as pas accès à l'état pending/error.
- **Hydration mismatch warning sur `<html>`** → ajoute `suppressHydrationWarning` sur la balise `<html>` dans `layout.tsx`. C'est la solution officielle quand on utilise `next-themes` (le serveur ne connaît pas la préférence système, donc le 1er render diffère du client).
- **Mode sombre flashe au chargement (FOUC)** → ton `ThemeProvider` n'a pas `attribute="class"` ou est dans un Client Component qui se monte trop tard. La doc `next-themes` recommande `attribute="class"` + `disableTransitionOnChange` pour zéro FOUC.
- **Le test Vitest crashe avec `window.matchMedia is not a function`** → jsdom ne l'implémente pas. Le canevas a déjà un `vitest.setup.ts` qui le mocke, vérifie qu'il est listé dans `setupFiles` de `vitest.config.ts`.
- **`window is not defined` au build** → tu accèdes à `window` au top-level d'un Server Component. Soit déclarer `'use client'`, soit déplacer l'accès dans un `useEffect`.
- **Le middleware ne se déclenche pas** → vérifie qu'il est **à la racine** du projet (pas dans `app/`), et que le `matcher` matche bien `/dashboard/:path*`.

## Ne commit pas

`node_modules`, `.next/`, `out/`. Pas de secrets attendus pour cet exercice.
