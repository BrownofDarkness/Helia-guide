# Correction — SaaS minimal Tasky Pro

> Code Next.js 16 complet intégrant **5 services BaaS** : Clerk (auth), Stripe (paiement + webhooks), Supabase (DB + RLS), Resend (email transactionnel), Vercel (déploiement). Aucune ligne d'infra à toi-même — tu intègres et tu shippes.
>
> Cet exercice ne peut **pas** être lancé en mode autonome. Tu dois créer 5 comptes (gratuits) et coller tes clés. Le code et la mécanique fonctionnent en local + en prod après config.

## Sommaire

1. [Pré-requis et configuration](#1-pré-requis-et-configuration)
2. [Architecture en 4 couches](#2-architecture-en-4-couches)
3. [Webhooks signés et idempotents](#3-webhooks-signés-et-idempotents)
4. [Supabase RLS — sécurité par utilisateur](#4-supabase-rls--sécurité-par-utilisateur)
5. [Lazy init des clients SaaS](#5-lazy-init-des-clients-saas)
6. [Validation : `next build` green](#6-validation--next-build-green)
7. [Pièges réels rencontrés](#7-pièges-réels-rencontrés)
8. [Coûts mensuels et seuils de bascule](#8-coûts-mensuels-et-seuils-de-bascule)

---

## 1. Pré-requis et configuration

### Comptes (gratuits) à créer

| Service | Lien | Free tier 2026 |
|---------|------|-----------------|
| GitHub | [github.com](https://github.com/) | Gratuit |
| Vercel | [vercel.com](https://vercel.com/) | Hobby gratuit |
| Clerk | [clerk.com](https://clerk.com/) | 10 K MAU gratuits |
| Stripe | [stripe.com](https://stripe.com/) | Mode test gratuit |
| Supabase | [supabase.com](https://supabase.com/) | 500 MB DB, 2 projets |
| Resend | [resend.com](https://resend.com/) | 3 K emails/mois |

### Lancement local

```bash
npm install
cp .env.example .env.local        # remplit avec tes clés (cf. README parent §3)
npm run dev                        # http://localhost:3000
```

### Webhooks Stripe en local (ngrok-like via Stripe CLI)

```bash
npm install -g stripe
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Récupère le whsec_... → mets-le dans .env.local
```

### Schéma Supabase (à exécuter une fois dans le SQL editor)

```sql
CREATE TABLE subscriptions (
  user_id text PRIMARY KEY,                  -- Clerk user ID
  stripe_customer_id text UNIQUE,
  status text NOT NULL DEFAULT 'free',       -- 'free' | 'active' | 'cancelled'
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy : un user voit uniquement sa propre subscription
CREATE POLICY "Users see own subscription" ON subscriptions
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);
-- Pas de INSERT/UPDATE/DELETE par user — uniquement le service role (webhook)
```

## 2. Architecture en 4 couches

```
┌──────────────────────────────────────────────────────────────┐
│                       Browser (client)                       │
│  /  /sign-in  /sign-up        /dashboard                     │
└──────────────┬───────────────────────────┬───────────────────┘
               │                           │
               ▼ (sign in)                 ▼ (upgrade button)
       ┌─────────────┐           ┌──────────────────┐
       │    Clerk    │           │ POST /api/checkout │
       │   (auth)    │           │  → Stripe Checkout│
       └─────────────┘           └────────┬──────────┘
               │                            │
               ▼ (user.created)             ▼ (success)
       ┌──────────────────┐         ┌──────────────────────┐
       │ POST /api/       │         │ POST /api/webhooks/  │
       │ webhooks/clerk   │         │ stripe               │
       │ (svix verify)    │         │ (signature verify)   │
       └────────┬─────────┘         └──────────┬───────────┘
                │                              │
                ▼                              ▼
         ┌─────────────┐                ┌──────────────┐
         │   Supabase  │                │   Supabase   │
         │ subscriptions│←─── update ────│ subscriptions│
         │ (RLS active)│                │ (RLS active) │
         └─────────────┘                └──────────────┘
                │
                ▼
         ┌──────────┐
         │  Resend  │
         │  (email) │
         └──────────┘
```

| Couche | Fichiers | Responsabilité |
|--------|----------|-----------------|
| **UI** | `app/page.tsx`, `app/dashboard/page.tsx`, `app/dashboard/upgrade-button.tsx` | Server Components pour la lecture, Client Component pour le bouton upgrade |
| **Routes API** | `app/api/checkout/route.ts`, `app/api/webhooks/{stripe,clerk}/route.ts` | Création de session Stripe + réception webhooks signés |
| **Lib clients** | `lib/{stripe,supabase-admin,resend}.ts` | Wrappers paresseux sur les SDK |
| **Auth middleware** | `middleware.ts` | Clerk middleware qui protège `/dashboard*` et `/api/checkout` |

## 3. Webhooks signés et idempotents

### 3.1 Pourquoi signer les webhooks ?

Sans vérification de signature, **n'importe qui** peut envoyer un POST à `/api/webhooks/stripe` avec un body forgé du genre `{"type":"checkout.session.completed", ...}`. Tu activerais des subscriptions sans paiement réel.

### 3.2 Stripe — vérif via la lib officielle

```ts
// app/api/webhooks/stripe/route.ts
const sig = (await headers()).get('stripe-signature');
const body = await request.text();    // ⚠️ raw body, pas .json()

let event: Stripe.Event;
try {
  event = stripe.webhooks.constructEvent(
    body,
    sig!,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
} catch {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
}
```

**Subtilités** :

- **`request.text()`** et pas `.json()` : `constructEvent` calcule le HMAC sur le body **brut**. Si tu fais `.json()` qui re-sérialise, l'ordre des clés peut changer et le HMAC échoue.
- **Erreur générique 400** : ne jamais leak la cause précise (timing, invalid signature, …) — donne des indices à un attaquant.

### 3.3 Clerk — vérif via svix

Clerk utilise [svix](https://www.svix.com/) (un standard webhook open-source). Le pattern est similaire :

```ts
import { Webhook } from 'svix';

const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
const event = wh.verify(body, {
  'svix-id': svix_id,
  'svix-timestamp': svix_timestamp,
  'svix-signature': svix_signature,
});
```

### 3.4 Idempotence

Un webhook peut être **envoyé plusieurs fois** (timeout réseau côté Stripe, retry). Deux protections :

1. **`upsert` sur `user_id`** plutôt que `insert` :
   ```ts
   await supabaseAdmin.from('subscriptions').upsert({
     user_id: event.data.id,
     status: 'free',
   });
   ```
   Si la row existe, on update. Si elle n'existe pas, on crée. Dans tous les cas, idempotent.

2. **Stocker l'`event.id`** dans une table dédiée (optionnel pour cet exercice). Si l'event a déjà été traité, on skip.

Pour Tasky Pro, l'`upsert` suffit parce que les opérations sont commutatives (un même event = même résultat final). Pour des opérations non-commutatives (créditer un compte), la déduplication par event ID est obligatoire.

## 4. Supabase RLS — sécurité par utilisateur

### 4.1 Le principe

Sans RLS (Row Level Security), **n'importe quel client** authentifié peut faire `SELECT * FROM subscriptions` et lire les données de tous les utilisateurs. Avec RLS :

```sql
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own subscription" ON subscriptions
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);
```

Postgres applique automatiquement `WHERE auth.jwt() ->> 'sub' = user_id` à chaque requête. **Pas de fuite possible**, même si un dev oublie un `WHERE` dans son code.

### 4.2 Pourquoi pas de policy INSERT/UPDATE/DELETE ?

Pour éviter qu'un utilisateur puisse modifier sa propre subscription (et passer en `status='active'` sans payer). Les modifications passent par les **webhooks** qui utilisent la `service_role` qui **bypass RLS**.

### 4.3 Le piège service_role

```ts
// lib/supabase-admin.ts
export const supabaseAdmin = createClient(url, SUPABASE_SERVICE_ROLE_KEY, ...);
```

`SERVICE_ROLE_KEY` a tous les droits sur la DB. **Ne jamais l'importer dans un Client Component** — sinon elle se retrouve dans le bundle JS livré au navigateur et tout le monde peut la lire. Règle Next.js :

| Variable | Côté client | Côté serveur |
|----------|-------------|--------------|
| `NEXT_PUBLIC_*` | ✅ Oui (préfixée) | ✅ Oui |
| Sans préfixe | ❌ Non | ✅ Oui |

`SUPABASE_SERVICE_ROLE_KEY` (sans préfixe) reste serveur-only. Si tu fais `import { supabaseAdmin } from '@/lib/supabase-admin'` dans un fichier marqué `'use client'`, Next.js fail à la compilation — c'est une protection.

## 5. Lazy init des clients SaaS

### 5.1 Le problème pendant le build

```ts
// ❌ Throw au top-level → casse `next build`
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {...});
```

Pendant `next build`, Next.js **importe** chaque route handler pour collecter les page data. Si le module throw à l'import (parce que `STRIPE_SECRET_KEY` n'est pas dans l'env du build), le build entier échoue.

### 5.2 La solution — Proxy paresseux

```ts
// ✅ Init au premier appel, pas au top-level
let cached: Stripe | null = null;

function makeStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is required.');
  return new Stripe(key, { apiVersion: '2025-02-24.acacia', typescript: true });
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!cached) cached = makeStripeClient();
    return Reflect.get(cached, prop, cached);
  },
});
```

Le `Proxy` intercepte `stripe.checkout.sessions.create(...)`. Au premier accès, on instancie le vrai client. Tant que rien n'appelle `stripe.X`, l'env var n'est pas requise.

**Bénéfice secondaire** : si on déploie une page qui n'utilise jamais Stripe (ex. la landing), la page fonctionne même sans `STRIPE_SECRET_KEY` configurée. Plus permissif, plus testable.

### 5.3 Appliqué à 3 clients

Même pattern dans `lib/stripe.ts`, `lib/supabase-admin.ts`, `lib/resend.ts`. Chacun est un Proxy qui résout au runtime.

## 6. Validation : `next build` green

```bash
npm run build
```

Avec un `.env.local` configuré (clés réelles ou placeholders ayant le bon format pour Clerk publishableKey), le build produit :

```
Route (app)                                Size  First Load JS
┌ ○ /                                  …
├ ○ /_not-found                        …
├ ƒ /api/checkout                      …
├ ƒ /api/webhooks/clerk                …
├ ƒ /api/webhooks/stripe               …
└ ○ /dashboard                         …

ƒ Proxy (Middleware)
✓ Compiled successfully
```

> ⚠️ **Sans `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`**, `next build` échoue au prerender de `/_not-found` parce que `<ClerkProvider>` plante. C'est un comportement intrinsèque de Clerk : il a besoin de la clé même au build. Solution : utilise un `pk_test_…` réel (gratuit) ou une clé factice respectant le format.

## 7. Pièges réels rencontrés

5 pièges concrets pendant la construction :

1. **Manque de la dep `svix`** → l'import dans `app/api/webhooks/clerk/route.ts` cassait le build. Ajouté `"svix": "^1.40.0"` dans `dependencies`.
2. **Version d'API Stripe obsolète** → `apiVersion: '2024-12-18.acacia'` rejeté par TS (le SDK v17 attend `'2025-02-24.acacia'` minimum). Mis à jour.
3. **Throws au top-level dans `lib/*.ts`** → `next build` échouait à la collecte de page data. Refacto en Proxy paresseux (cf. § 5).
4. **`<ClerkProvider>` exige la publishableKey au build** → même avec lazy init, Clerk Provider valide la clé au render. C'est un comportement intrinsèque, pas un bug. Doc : ce n'est pas contournable sans changer de stratégie d'auth.
5. **`middleware.ts` deprecated en Next 16** → warning, pas erreur. Migration vers `proxy.ts` à faire dans une future itération (l'API du fichier reste compatible).

Aucun nouveau piège global à capturer dans `pieges.ts` — ce sont des spécificités SaaS-Next bien documentées sur place.

## 8. Coûts mensuels et seuils de bascule

| Service | Free tier | Coût après | Seuil de bascule |
|---------|-----------|------------|---------------------|
| Vercel | 100 GB bandwidth | $20/mo (Pro) | ~10 K visiteurs/mois |
| Clerk | 10 K MAU | $25/mo | 10 K MAU |
| Stripe | (% transactions) | 2.9 % + 0.30 € | toujours |
| Supabase | 500 MB DB | $25/mo (Pro) | ~50 K rows actives |
| Resend | 3 K emails/mo | $20/mo (50 K) | ~3 K signups/mois |

**Bilan** : tu peux **livrer un MVP à 0 € de coût fixe** jusqu'à un certain seuil. Au-delà, ~70–100 €/mo pour < 10 K users actifs. C'est imbattable vs un dev custom + ops (où tu paierais 200–500 €/mo en infra + 20–40 h/mois de DevOps).

### Quand sortir des BaaS ?

- **> 10 K MAU** : Clerk devient cher → migrer vers Auth.js v5 (NextAuth) côté self-hosted.
- **> 100 K rows / 500 MB** : Supabase Pro (25 €/mo) suffit longtemps. Vraie bascule à 1 M+ rows.
- **> 50 K emails/mois** : SendGrid ou self-hosted (Postal, Cuttlefish) deviennent compétitifs.

Garder à l'esprit : **le coût d'une migration vers self-hosted vaut souvent 6–12 mois d'abonnement BaaS**. Reste sur les BaaS jusqu'à ce que ça fasse vraiment mal au compte ou que la latence/contrôle devienne critique.

## Limites assumées

- **Pas d'admin dashboard** pour gérer les utilisateurs (utiliser le dashboard Clerk).
- **Pas de gestion équipes / workspaces** (nécessite Clerk Organizations + adapter le schéma).
- **Email simple HTML** — pour de la prod, utiliser **React Email** + templates plus sophistiqués.
- **Pas de portail client Stripe** (mais facile à ajouter avec `stripe.billingPortal.sessions.create()`).
- **`middleware.ts` deprecated en Next 16** — à migrer vers `proxy.ts` dans une future PR.

## Pour aller plus loin

- **React Email** + templates pour des emails plus jolis ([react.email](https://react.email/)).
- **Portail client Stripe** (`stripe.billingPortal.sessions.create`) → l'utilisateur peut annuler / changer de carte sans contact support.
- **Trial 14 jours** : `subscription_data: { trial_period_days: 14 }` dans le checkout.
- **Plan annuel** moins cher (-20 %) — créer un 2e prix Stripe, afficher les 2 options.
- **Webhooks Resend** (delivered, bounce, complaint) → tracker les bounces et rate-limit le sending.
- **Migrer Clerk → Auth.js v5** quand tu dépasses 10 K MAU.
- **Migrer Supabase → Postgres self-hosted** quand tu as besoin de RLS custom complexe ou de tuning fin (axes 9 + 14).
