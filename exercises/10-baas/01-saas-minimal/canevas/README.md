# Canevas — SaaS minimal Tasky Pro

> Tu vas intégrer **5 services SaaS** dans une seule app Next.js : auth (Clerk), paiement (Stripe), DB + RLS (Supabase), email (Resend), déploiement (Vercel). Aucune ligne d'infra à toi-même — tu apprends à composer du **prêt-à-l'emploi**.
>
> Le scaffold est déjà là (UI, libs, middleware Clerk). **Tu n'as que 3 fichiers à compléter** — les 3 routes qui font tourner la mécanique : checkout, webhook Stripe, webhook Clerk.

## Ce que tu vas faire

Construire **Tasky Pro** :

| Route | Type | Quoi |
|-------|------|------|
| `/` | Server | Landing publique |
| `/sign-in`, `/sign-up` | Clerk | Géré 100 % par Clerk (rien à coder) |
| `/dashboard` | Server | Lit `subscriptions` depuis Supabase, affiche le plan |
| `/api/checkout` | Route Handler | **TODO** — crée une session Stripe Checkout |
| `/api/webhooks/stripe` | Route Handler | **TODO** — vérifie signature + active la sub |
| `/api/webhooks/clerk` | Route Handler | **TODO** — vérifie svix + envoie email + init Supabase |

À la fin, tu auras vécu :
- **Webhooks signés** (Stripe HMAC, Clerk svix)
- **RLS Supabase** (un user voit uniquement ses propres rows)
- **Service role vs anon key** Supabase (frontière client/serveur stricte)
- **Lazy init** des SDK pour passer `next build` sans env vars
- **Idempotence par upsert** (un webhook rejoué ne casse rien)

## Pré-requis : 6 comptes gratuits

| Service | Lien | Free tier 2026 |
|---------|------|-----------------|
| GitHub | [github.com](https://github.com/) | Gratuit |
| Vercel | [vercel.com](https://vercel.com/) | Hobby gratuit |
| Clerk | [clerk.com](https://clerk.com/) | 10 K MAU |
| Stripe | [stripe.com](https://stripe.com/) | Mode test gratuit |
| Supabase | [supabase.com](https://supabase.com/) | 500 MB DB |
| Resend | [resend.com](https://resend.com/) | 3 K emails/mois |

Plus en local :

- **Node ≥ 20** (`node --version`)
- **Stripe CLI** (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)

> ⚠️ **Toujours mode TEST sur Stripe** pendant l'apprentissage. Carte test : `4242 4242 4242 4242`, exp future, CVC `123`. Ne touche jamais aux clés `sk_live_…`.

## Configuration (étape par étape)

Suis le **README parent** (`../README.md`) qui détaille les 7 étapes :

1. Setup Next.js (`npm install`, `cp .env.example .env.local`)
2. Clerk (créer le projet, récupérer `pk_test_…` et `sk_test_…`)
3. Supabase (créer le projet, exécuter le schéma SQL avec RLS)
4. Stripe (produit + prix `$9/mois`, `stripe listen` pour les webhooks locaux)
5. Resend (clé API, domaine de test ou `@resend.dev`)
6. Déploiement Vercel
7. Test bout-en-bout

## Structure du canevas (déjà fournie)

```
canevas/
├── app/
│   ├── api/
│   │   ├── checkout/route.ts            ← TODO 1 (4 sous-étapes)
│   │   └── webhooks/
│   │       ├── stripe/route.ts          ← TODO 2 (5 sous-étapes)
│   │       └── clerk/route.ts           ← TODO 3 (5 sous-étapes)
│   ├── dashboard/
│   │   ├── page.tsx                     ← FOURNI : Server Component lisant Supabase
│   │   └── upgrade-button.tsx           ← FOURNI : Client Component qui POST /api/checkout
│   ├── layout.tsx                        ← FOURNI : ClerkProvider
│   ├── page.tsx                          ← FOURNI : landing publique
│   └── globals.css                       ← FOURNI : Tailwind v4
├── lib/
│   ├── stripe.ts                         ← FOURNI : client Stripe lazy
│   ├── supabase-admin.ts                 ← FOURNI : client service_role lazy
│   └── resend.ts                         ← FOURNI : client + sendWelcomeEmail()
├── middleware.ts                          ← FOURNI : Clerk middleware (protège /dashboard*)
├── package.json
└── tsconfig.json
```

Tu n'as à toucher **que 3 fichiers** : les routes API. Tout le reste fonctionne tel quel une fois tes clés en place.

## Les 3 TODO

### TODO 1 — `app/api/checkout/route.ts` (~30 lignes)

POST → crée une session Stripe Checkout, renvoie `{ url }` que le front utilise pour rediriger.

Étapes :
1. Auth Clerk (`auth()` → `userId`, sinon 401).
2. Récupère ou crée le `stripe_customer_id` (lecture Supabase, sinon `stripe.customers.create()` + upsert).
3. `stripe.checkout.sessions.create({ mode: 'subscription', line_items: [...], metadata: { clerk_user_id } })`.
4. `return NextResponse.json({ url: session.url })`.

### TODO 2 — `app/api/webhooks/stripe/route.ts` (~50 lignes)

POST → reçoit les webhooks signés Stripe (`checkout.session.completed`, `customer.subscription.updated/deleted`).

Étapes :
1. **Body brut** (`await request.text()` — pas `.json()` !).
2. Header `stripe-signature`.
3. `stripe.webhooks.constructEvent(body, sig, secret)` (try/catch → 400).
4. Switch sur `event.type` → `supabaseAdmin.update({ status: ... })`.
5. `return { received: true }`.

### TODO 3 — `app/api/webhooks/clerk/route.ts` (~40 lignes)

POST → reçoit le webhook Clerk `user.created` quand quelqu'un s'inscrit.

Étapes :
1. 3 headers svix (`svix-id`, `svix-timestamp`, `svix-signature`).
2. Body brut.
3. `new Webhook(secret).verify(body, headers)` → 400 si invalide.
4. Si `user.created` → `supabaseAdmin.upsert({ user_id, status: 'free' })` + `sendWelcomeEmail(email, firstName)`.
5. `return { received: true }`.

Chaque fichier a les commentaires détaillés à l'intérieur. Si tu sèches sur les imports : ils sont déjà dans la correction (`../correction/app/api/...`).

## Tester

### En local

```bash
npm install
cp .env.example .env.local       # remplis avec tes clés
npm run dev                       # http://localhost:3000

# Dans un autre terminal pour les webhooks Stripe
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Récupère le whsec_... → mets-le dans .env.local
```

### Le parcours complet à valider

1. Ouvre `http://localhost:3000` → tu vois la landing.
2. Clique « Sign up » → tu crées un compte.
3. Vérifie ta boîte mail → tu reçois l'email de bienvenue (TODO 3 ✅).
4. Vérifie Supabase → la row `subscriptions(user_id, status='free')` existe (TODO 3 ✅).
5. Va sur `/dashboard` → tu vois "🆓 Free" + bouton "Upgrade".
6. Clique « Upgrade » → tu arrives sur Stripe Checkout (TODO 1 ✅).
7. Paie avec `4242 4242 4242 4242` → Stripe te redirige sur `/dashboard?success=true`.
8. Refresh `/dashboard` → tu vois "🚀 Pro" (TODO 2 ✅).
9. Vérifie Supabase → `status='active'` + `stripe_customer_id` rempli.

Si une étape casse, **lis les logs** du terminal `npm run dev` ET du terminal `stripe listen`. Le piège n°1 sur ce genre d'exercice est de regarder seulement un côté.

## Bloqué ?

- **`stripe listen` dit `Invalid signature`** → tu as fait `request.json()` au lieu de `request.text()` dans le webhook Stripe. Le HMAC est calculé sur le body brut, un re-parse change l'ordre des clés et casse la signature.
- **Le webhook Clerk reçoit `400 Missing svix headers`** → tu envoies depuis Postman/curl à la main. Clerk envoie 3 headers spécifiques. Pour tester, configure le webhook réel dans le dashboard Clerk avec une URL ngrok / Vercel preview — le `stripe listen` ne marche que pour Stripe.
- **Supabase RLS me bloque même côté serveur** → tu utilises le client `anon` au lieu du `service_role`. Importe `supabaseAdmin` depuis `lib/supabase-admin.ts`.
- **Le bouton « Upgrade » fait un POST mais rien ne se passe** → ouvre l'onglet Network de DevTools. Si `/api/checkout` répond 401 → middleware Clerk pas configuré. Si 500 → log côté serveur (`process.env.X is undefined` typique).
- **`next build` échoue avec `supabaseUrl is required`** → le scaffold a des clients `lib/*.ts` en lazy init via Proxy ; cette erreur ne devrait pas arriver. Si elle arrive, vérifie que tu n'as pas instancié un client en top-level (`new Stripe(...)` directement dans une route).
- **L'email de bienvenue ne part pas** → Resend n'envoie qu'aux **domaines vérifiés**. Pour tester sans domaine, utilise `from: 'onboarding@resend.dev'` (configuré par défaut dans `lib/resend.ts`). Limite : tu ne peux envoyer qu'à ta propre adresse de signup Resend.
- **`@clerk/clerk-react: Missing publishableKey` au build** → ta clé Clerk n'est pas dans `.env.local`. C'est obligatoire **même au build** parce que `<ClerkProvider>` est rendu côté serveur.

## Ne commit pas

`.env.local`, `.next/`, `node_modules/`. Et **surtout pas** `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `CLERK_SECRET_KEY`, `RESEND_API_KEY`. Ces clés donnent accès complet aux services — leur fuite sur GitHub déclenche des alertes automatiques chez les providers (Stripe et Clerk révoquent en quelques minutes), mais en attendant un attaquant peut faire des dégâts.

> **Si tu commits une clé par accident** : régénère immédiatement la clé dans le dashboard du provider, puis `git filter-repo` ou re-init du repo pour purger l'historique. Pas juste `git rm` — la clé reste dans l'historique git.
