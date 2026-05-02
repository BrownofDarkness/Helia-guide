# Exercice 10.1 — SaaS minimal en un week-end

> **Axe** : 10 — BaaS & services managés
> **Difficulté** : intermédiaire (intégrations) à avancé (déploiement)
> **Durée estimée** : 12 à 20 heures sur un week-end
> **Prérequis** : axe 10 entièrement lu, axe 7 (Next.js)

## ⚙️ Avant de commencer — comptes nécessaires

Tu dois créer **6 comptes gratuits** :

| Service | Lien | Free tier |
|---------|------|-----------|
| **GitHub** | [github.com](https://github.com/) | Gratuit |
| **Vercel** | [vercel.com](https://vercel.com/) | Hobby gratuit |
| **Clerk** | [clerk.com](https://clerk.com/) | 10K MAU gratuits |
| **Stripe** | [stripe.com](https://stripe.com/) | Test mode gratuit |
| **Supabase** | [supabase.com](https://supabase.com/) | 500 Mo DB, 2 projets |
| **Resend** | [resend.com](https://resend.com/) | 3K emails/mois gratuits |

Plus locaux :

```bash
node --version       # v20+ (idéalement 24)
npm --version
```

Si pas Node : voir [« Installer Node.js »](../../02-web/01-mini-curl/README.md#-avant-de-commencer--installer-nodejs).

## 🎯 Objectifs pédagogiques

- **Intégrer 5 services** dans une seule app Next.js
- Mettre en place **webhooks Stripe** signés et idempotents
- Utiliser **Supabase RLS** pour la sécurité par utilisateur
- Envoyer des **emails transactionnels** via Resend
- **Déployer sur Vercel** avec variables d'env

## 📋 Énoncé — Tasky Pro

Construire **Tasky Pro**, un SaaS minimal :

- **Landing page** publique (présentation + pricing)
- **Inscription / connexion** (Clerk)
- **Dashboard** privé après connexion
- **Plan Pro** ($9/mois via Stripe Checkout)
- **Email de bienvenue** automatique (Resend)
- **Upgrade button** vers Stripe Checkout
- **Webhooks Stripe** pour activer/désactiver l'abonnement
- **DB Supabase** : table `subscriptions(user_id, status, stripe_customer_id)` avec RLS

## ✅ Critères d'acceptation

| Critère | Détail |
|---------|--------|
| Site accessible publiquement (déployé sur Vercel) | URL fournie |
| Inscription fonctionnelle | via Clerk |
| Dashboard accessible uniquement aux connectés | middleware |
| Stripe Checkout fonctionne en test mode | `4242 4242 4242 4242` |
| Webhook Stripe met à jour Supabase | log visible |
| Email de bienvenue envoyé après signup | template Resend |
| RLS Supabase active : un user ne voit pas les données d'un autre | testé |
| Aucune clé secrète dans le bundle client | `npm run build` + grep |

## 🗺️ Réalisme de la durée annoncée

La durée « 12–20 h sur un week-end » est **optimiste** pour un débutant qui découvre 6 services en parallèle. Voici un découpage honnête :

| Étape | Durée min | Durée max | Coût € |
|-------|-----------|-----------|--------|
| **0. Création des 6 comptes + clés API** | 1 h | 2 h | 0 € (free tiers) |
| **1. Setup Next.js + Tailwind** | 1 h | 2 h | 0 € |
| **2. Clerk auth (signup + sign-in + middleware)** | 2 h | 4 h | 0 € (10 K MAU) |
| **3. Supabase schema + RLS** | 2 h | 3 h | 0 € (500 MB) |
| **4. Stripe Checkout** (produit + prix + session) | 2 h | 4 h | 0 € (test mode) |
| **5. Webhook Stripe signé + idempotent** | 3 h | 5 h | 0 € (Stripe CLI local) |
| **6. Webhook Clerk svix + email Resend** | 2 h | 4 h | 0 € (3 K emails) |
| **7. Dashboard avec lecture conditionnelle (free vs Pro)** | 2 h | 3 h | 0 € |
| **8. Déploiement Vercel + reconfig env vars** | 1 h | 2 h | 0 € (Hobby) |
| **9. Test bout-en-bout** | 1 h | 2 h | 0 € |

**Total réaliste** : **17–31 h sur 1–2 semaines** (vs 12–20 h sur un week-end). Compte un week-end intense uniquement si tu as déjà déployé une app Next.js avant.

### Version minimale (15 h) vs version complète (31 h)

| Choix | Version minimale | Version complète |
|-------|-------------------|---------------------|
| Auth | Clerk en email/password seul | + Google OAuth + magic link |
| Stripe | Checkout simple, pas de portail | + portail client (annulation, change card) |
| Webhooks | Just `checkout.session.completed` | + `subscription.updated/deleted` + retries |
| Email | Email de bienvenue HTML basique | + React Email + tracking opens/clicks |
| Tests | Aucun (validation manuelle) | + Playwright sur le funnel signup |
| Déploiement | Vercel main branch | + preview par PR |

→ **Si tu as un week-end (15 h)**, livre la version minimale. Tu construis ton intuition sur le câblage des 5 services. La version complète vient avec un projet réel.

## 🛠 Démarche — étape par étape

### Étape 1 — Setup Next.js (10 min)

```bash
cd canevas/   # le scaffold est ici
npm install
cp .env.example .env.local
```

### Étape 2 — Clerk (30 min)

1. Crée un compte sur [clerk.com](https://clerk.com/), nouveau projet "tasky-pro".
2. Active **email + password** + **Google OAuth**.
3. Récupère :
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...`
   - `CLERK_SECRET_KEY=sk_test_...`
4. Colle dans `.env.local`.
5. Lance `npm run dev`. Vérifie `/sign-in` et `/sign-up` (gérées par Clerk).

### Étape 3 — Supabase (45 min)

1. Crée un projet sur [supabase.com](https://supabase.com/).
2. Récupère :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (à mettre **côté serveur uniquement**)
3. Dans le SQL editor, exécute le schéma :

```sql
CREATE TABLE subscriptions (
  user_id text PRIMARY KEY,                -- Clerk user ID
  stripe_customer_id text UNIQUE,
  status text NOT NULL DEFAULT 'free',     -- 'free' | 'active' | 'cancelled'
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy : un user ne voit que sa propre subscription
CREATE POLICY "Users see own subscription" ON subscriptions
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

-- Pas de INSERT/UPDATE/DELETE par user — uniquement le service role (webhook)
```

### Étape 4 — Stripe (60 min)

1. Crée un compte Stripe en mode test.
2. Crée un **produit** "Tasky Pro" avec un prix `$9/mois` (recurring monthly).
3. Récupère :
   - `STRIPE_SECRET_KEY=sk_test_...`
   - `STRIPE_WEBHOOK_SECRET=whsec_...` (créé après l'étape 6 ci-dessous)
   - `NEXT_PUBLIC_STRIPE_PRICE_ID=price_...` (l'ID du prix créé)
4. Implémente la route `app/api/checkout/route.ts` (voir correction).
5. Implémente la route `app/api/webhooks/stripe/route.ts` (voir correction).
6. Pour tester les webhooks en local :
   ```bash
   npm install -g stripe
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Le CLI Stripe te donne `whsec_...` → mets dans `.env.local`.

### Étape 5 — Resend (30 min)

1. Crée un compte sur [resend.com](https://resend.com/).
2. Récupère `RESEND_API_KEY=re_...`.
3. Crée un domaine vérifié (ou utilise l'onboarding `@resend.dev` pour tests).
4. Implémente l'envoi d'email de bienvenue (Clerk webhook + Resend).

### Étape 6 — Déploiement Vercel (20 min)

1. Pousse ton code sur GitHub.
2. Sur Vercel, clique "New Project" → importer ton repo.
3. Ajoute toutes les variables d'env (sauf STRIPE_WEBHOOK_SECRET qui sera mise après).
4. Deploy. Tu obtiens une URL `https://tasky-pro.vercel.app`.
5. Reviens sur Stripe → **Webhooks** → "Add endpoint" → URL = `https://tasky-pro.vercel.app/api/webhooks/stripe`. Sélectionne `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
6. Stripe te donne le **vrai** `whsec_...` → ajoute-le dans Vercel env vars → redeploy.

### Étape 7 — Tester de bout en bout

1. Aller sur `https://tasky-pro.vercel.app`.
2. S'inscrire.
3. Vérifier réception email Resend.
4. Aller sur `/dashboard` → cliquer "Upgrade to Pro".
5. Stripe Checkout → carte test `4242 4242 4242 4242`.
6. Retour sur `/dashboard` → status passe à "active".
7. Vérifier dans Supabase : la ligne `subscriptions` a `status = 'active'`.

## 🔑 Correction

Voir [`correction/`](./correction/) — code Next.js complet avec tous les fichiers clés.

> Note : la correction ne contient PAS les `.env` (évidemment). Tu dois créer tes propres comptes et coller tes propres clés.

## ⚠️ Avertissements importants

1. **Toujours mode TEST** sur Stripe pendant l'apprentissage. Ne touche pas aux clés `sk_live_` !
2. **Service role key Supabase** : ne JAMAIS commit dans Git, ne JAMAIS exposer côté client.
3. **Vercel preview deploys** créent une URL publique : si tu commit un secret, il fuit. Toujours via env vars du dashboard.

## 📚 Pour aller plus loin

- Ajouter un **plan annuel** moins cher.
- **Email marketing** avec un service comme Loops ou Customer.io.
- **Analytics PostHog** pour mesurer le funnel.
- Migrer **Clerk → Auth.js** (NextAuth) pour réduire les coûts à l'échelle.
- **Migration vers backend custom** quand > 10K utilisateurs (axes 8-9).
