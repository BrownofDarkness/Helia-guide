# Exercice 9.1 — Base e-commerce sous PostgreSQL

> **Axe** : 9 — Bases de données
> **Difficulté** : avancé
> **Durée estimée** : 6 à 12 heures
> **Prérequis** : axe 9 lu, **Docker** installé

## ⚙️ Avant de commencer — outils nécessaires

### Docker (pour Postgres)

Si Docker n'est pas installé : voir [« Installer Docker »](../../04-outils/01-stack-conteneurisee/README.md#-avant-de-commencer--installer-docker) (axe 4 exercice 1).

```bash
docker --version
docker compose version
```

### Client PostgreSQL (`psql`)

Pour interagir avec la DB depuis le terminal :

| OS | Comment |
|----|---------|
| **macOS** | `brew install libpq && brew link --force libpq` |
| **Linux/WSL Ubuntu** | `sudo apt install postgresql-client` |
| **Windows** | Inclus avec [pgAdmin](https://www.pgadmin.org/) ou [installeur Postgres](https://www.postgresql.org/download/windows/) |

Vérifie : `psql --version`.

> Alternative : utiliser **DBeaver** (GUI gratuite multi-OS) ou **TablePlus** (excellent client moderne, freemium).

## 🎯 Objectifs pédagogiques

- Concevoir un **schéma e-commerce** réaliste (users, products, orders, lines, promotions)
- Écrire **10 requêtes analytiques** (CTE, window functions, jointures complexes)
- **Indexer correctement** (B-tree, partiel, GIN sur JSONB)
- Comparer les **plans d'exécution** avant/après index
- **Atteindre < 50 ms** sur les 10 requêtes avec 1 M de lignes seed

## 📋 Énoncé

### Le domaine — Tasky-Shop

Une boutique en ligne avec :

- **Customers** : email, nom, date d'inscription
- **Products** : SKU, nom, catégorie, prix (en cents !), stock, métadonnées JSONB
- **Categories** : nom, slug
- **Orders** : statut (pending/paid/shipped/cancelled), total, dates
- **OrderLines** : produit + quantité + prix snapshot
- **Promotions** : code, % réduction, validité
- **OrderPromotions** : promotion appliquée à une commande

Tu dois écrire le **schéma** + **10 queries** ci-dessous + **indexes** pour que tout réponde en < 50 ms sur 1 M de lignes.

### Les 10 queries à écrire

1. **Liste des 50 dernières commandes payées** (avec nom client + total).
2. **Top 10 clients** par dépense totale en € (lifetime value).
3. **Top 5 produits par catégorie** en quantité vendue (window function).
4. **Panier moyen** par mois (depuis 12 mois) — `DATE_TRUNC` + `SUM/COUNT`.
5. **Cohorte mensuelle** : combien de % des clients qui ont commandé en M ont commandé en M+1 ?
6. **Produits jamais commandés** (LEFT JOIN où la jointure est NULL).
7. **Recherche full-text** : produits dont le nom matche `'rouge'` ou similaire (insensible à la casse, typo-tolérant si possible avec `pg_trgm`).
8. **Produits par couleur** dans `metadata` JSONB (`metadata @> '{"color": "red"}'`).
9. **Stock à reconstituer** : produits dont le stock < 10 ET qui ont vendu > 50 unités les 30 derniers jours.
10. **Revenu mensuel récurrent** par client (top 20 par récurrence).

## ✅ Critères d'acceptation

| Critère | Détail |
|---------|--------|
| Le schéma SQL crée toutes les tables avec contraintes appropriées | |
| Le seed génère **1 M lignes** de orders + 5 M de order_lines | |
| Les 10 queries renvoient des résultats corrects | |
| **Toutes les queries < 50 ms** | mesuré via `\timing` ou `EXPLAIN ANALYZE` |
| Les indexes sont **justifiés** dans `correction/INDEXES.md` | |

### Bonus

- Une vue matérialisée pour les stats lourdes.
- Un `pg_partman` pour partitionner `orders` par mois.
- Un script de **rollback** propre.

## 🛠 Comment commencer

```bash
cd canevas/

# Démarrer Postgres
docker compose up -d
# Postgres tourne maintenant sur localhost:5432, base "shop", user "shop", mdp "shop"

# Créer le schéma
psql postgresql://shop:shop@localhost:5432/shop -f schema.sql

# Seed avec 1M lignes (peut prendre 1-2 min)
psql postgresql://shop:shop@localhost:5432/shop -f seed.sql

# Lancer une query
psql postgresql://shop:shop@localhost:5432/shop -f queries/01-recent-paid-orders.sql
```

## 🧪 S'auto-valider

```bash
cd tests/
./benchmark.sh
```

Le script lance les 10 queries et mesure le temps. Cible : toutes < 50 ms.

## 💡 Indices

<details>
<summary>1. Schéma de base (squelette)</summary>

```sql
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'cancelled');

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(32) NOT NULL UNIQUE,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  stock INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- À continuer : orders, order_lines, promotions, order_promotions
```
</details>

<details>
<summary>2. Cohorte mensuelle — pattern</summary>

```sql
WITH first_order AS (
  SELECT customer_id, DATE_TRUNC('month', MIN(created_at)) AS first_month
  FROM orders WHERE status = 'paid'
  GROUP BY customer_id
),
order_months AS (
  SELECT customer_id, DATE_TRUNC('month', created_at) AS order_month
  FROM orders WHERE status = 'paid'
)
SELECT
  fo.first_month AS cohort,
  om.order_month - fo.first_month AS months_after_first,
  COUNT(DISTINCT om.customer_id) AS customers
FROM first_order fo
JOIN order_months om ON om.customer_id = fo.customer_id
GROUP BY fo.first_month, om.order_month - fo.first_month
ORDER BY 1, 2;
```
</details>

<details>
<summary>3. Top N par groupe — window function</summary>

```sql
SELECT category, name, total_sold FROM (
  SELECT
    cat.name AS category,
    p.name,
    SUM(ol.quantity) AS total_sold,
    ROW_NUMBER() OVER (
      PARTITION BY cat.id ORDER BY SUM(ol.quantity) DESC
    ) AS rank
  FROM products p
  JOIN categories cat ON cat.id = p.category_id
  JOIN order_lines ol ON ol.product_id = p.id
  GROUP BY cat.id, cat.name, p.id, p.name
) ranked
WHERE rank <= 5;
```
</details>

<details>
<summary>4. Index pour atteindre < 50 ms</summary>

```sql
-- Pour la query "dernières commandes payées"
CREATE INDEX orders_status_created_idx ON orders(status, created_at DESC);

-- Pour les top clients (mais on peut s'en passer si on a déjà customer_id sur orders)
CREATE INDEX orders_customer_idx ON orders(customer_id);

-- Pour le full-text search
CREATE INDEX products_name_trgm_idx ON products USING GIN (name gin_trgm_ops);
-- (nécessite CREATE EXTENSION pg_trgm)

-- Pour le JSONB
CREATE INDEX products_metadata_idx ON products USING GIN (metadata);

-- Pour la query "stock à reconstituer"
CREATE INDEX products_low_stock_idx ON products(stock) WHERE stock < 10;
```
</details>

## 🔑 Correction

Voir [`correction/`](./correction/) — schéma optimisé, 10 queries écrites + commentées, INDEXES.md avec justifications.

## 📚 Pour aller plus loin

- Migrer vers **Supabase** ou **Neon** (managé) au lieu du Docker local.
- Ajouter une **vue matérialisée** pour le dashboard analytique.
- **Partitionner** `orders` par mois avec `pg_partman` (au-delà de 100M lignes).
- Connecter via **Prisma** ou **Drizzle** depuis une app Node/TS.
