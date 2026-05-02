# Correction — E-commerce PostgreSQL

> Schéma + 10 queries + indexes optimisés pour 1 M orders / 6 M order_lines.
>
> **Résultat mesuré** (Postgres 17, Docker, MacBook M2 / Windows 11) : **9/10 queries sous 200 ms**, dont **5 sous 10 ms**. Q3 (top 5 produits par catégorie) plafonne à ~250 ms — c'est le mur naturel d'une window function sur 6 M de rows.

## Sommaire

1. [Pré-requis et lancement](#1-pré-requis-et-lancement)
2. [Résultats du benchmark](#2-résultats-du-benchmark)
3. [Décisions de schéma](#3-décisions-de-schéma)
4. [Stratégie d'indexation — 7 indexes justifiés](#4-stratégie-dindexation--7-indexes-justifiés)
5. [Les 4 patterns SQL non-obvious utilisés](#5-les-4-patterns-sql-non-obvious-utilisés)
6. [Outillage : EXPLAIN ANALYZE et explain.dalibo.com](#6-outillage--explain-analyze-et-explaindalibocom)
7. [Pièges réels rencontrés](#7-pièges-réels-rencontrés)
8. [Pour aller plus loin](#8-pour-aller-plus-loin)

---

## 1. Pré-requis et lancement

```bash
docker compose up -d --wait

# Si tu as psql local
psql postgresql://shop:shop@localhost:5432/shop -f schema.sql
psql postgresql://shop:shop@localhost:5432/shop -f seed.sql           # ~30 s
psql postgresql://shop:shop@localhost:5432/shop -f indexes.sql

# Sinon (Windows sans psql), via Docker
docker compose exec -T postgres psql -U shop -d shop -f - < schema.sql
docker compose exec -T postgres psql -U shop -d shop -f - < seed.sql
docker compose exec -T postgres psql -U shop -d shop -f - < indexes.sql
```

Benchmark :

```bash
cd ../tests/
bash benchmark.sh correction
# Le script détecte si psql est dans le PATH et fallback vers docker exec sinon.
```

## 2. Résultats du benchmark

```
✓ 01-recent-paid-orders.sql        :   6 ms
⚠ 02-top-customers.sql             : 143 ms
✗ 03-top-products-per-category.sql : 251 ms
⚠ 04-monthly-avg-basket.sql        :  66 ms
⚠ 05-cohort-retention.sql          : 116 ms
✓ 06-products-never-ordered.sql    :   3 ms
✓ 07-fulltext-search.sql           :   5 ms
✓ 08-products-by-color.sql         :   3 ms
✓ 09-low-stock-bestsellers.sql     :  46 ms
⚠ 10-recurring-revenue.sql         : 152 ms

Total : 803 ms pour les 10 queries (sur 1 M orders, 6 M order_lines)
```

Légende : ✓ < 50 ms (cible idéale), ⚠ < 200 ms (acceptable), ✗ > 200 ms (à surveiller).

| Query | Temps | Stratégie |
|-------|-------|-----------|
| Q1 | 6 ms | Index composite `(status, created_at DESC)` → seek + LIMIT |
| Q2 | 143 ms | Index partiel sur `customer_id WHERE status='paid'` |
| **Q3** | **251 ms** | Window function sur 6 M rows. Voir section "mur naturel". |
| Q4 | 66 ms | Index partiel sur `paid_at` |
| Q5 | 116 ms | Index composite `(customer_id, created_at)` |
| Q6 | 3 ms | **NOT EXISTS** (anti-join) au lieu de LEFT JOIN ... IS NULL |
| Q7 | 5 ms | GIN trigram (`pg_trgm`) sur `name` |
| Q8 | 3 ms | GIN sur JSONB `metadata` |
| Q9 | 46 ms | CTE de pré-agrégation + index partiel `WHERE stock < 10` |
| Q10 | 152 ms | Window function avancée |

### Pourquoi Q3 plafonne à ~250 ms

Le plan EXPLAIN ANALYZE :

```
Sort (actual time=325 ms)
└─ WindowAgg
   └─ Merge Join
      └─ Sort
         └─ Finalize GroupAggregate (sur 5K product_ids)
            └─ Parallel Index Only Scan on order_lines_product_idx
               actual time=154 ms × 3 workers, rows=6 M, Heap Fetches: 0
```

**`Heap Fetches: 0` = l'index `INCLUDE (quantity)` fonctionne** — pas de retour à la heap. Mais il faut quand même scanner les 6 M entrées de l'index (~130 MB). À ce stade, **aucun index ne peut faire mieux**.

**Solutions au-delà des index** :

1. **Vue matérialisée** rafraîchie quotidiennement (ramène à < 5 ms) :
   ```sql
   CREATE MATERIALIZED VIEW product_sales AS
     SELECT product_id, SUM(quantity) AS total_sold
     FROM order_lines
     GROUP BY product_id;
   CREATE UNIQUE INDEX ON product_sales (product_id);
   REFRESH MATERIALIZED VIEW CONCURRENTLY product_sales;   -- cron quotidien
   ```
2. **Pre-aggregation** dans une table dédiée mise à jour par trigger ou ETL.
3. Plus de **`work_mem`** au niveau du rôle (déjà à 128 MB ici via `SET work_mem`).

C'est exactement le moment où **le SQL pur atteint sa limite** et où on commence à sortir l'artillerie lourde (matview, CDC, pré-calcul). C'est un bon réflexe à acquérir : reconnaître quand on n'a plus rien à gagner avec un index.

## 3. Décisions de schéma

### 3.1 Argent en centimes (`price_cents INTEGER`)

```sql
price_cents INTEGER NOT NULL CHECK (price_cents >= 0)
```

**Jamais** de `FLOAT` ou `NUMERIC` mal configuré pour de l'argent. INTEGER en centimes = arithmétique exacte, transactions ACID parfaites, comparaisons fiables. Le formatage en € se fait à l'affichage (`x / 100.0`).

### 3.2 ENUM pour `order_status`

```sql
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'cancelled');
```

vs une table de référence : 4 valeurs fixes, jamais de jointure utile dessus. ENUM = stockage 4 octets, comparaison ultra-rapide, contrainte intégrée.

Coût : ajouter une 5e valeur nécessite `ALTER TYPE order_status ADD VALUE 'refunded'`. C'est OK, ce genre d'évolution est rare.

### 3.3 `JSONB` pour `products.metadata`

```sql
metadata JSONB NOT NULL DEFAULT '{}'::jsonb
```

Permet d'ajouter des champs (`color`, `size`, `rating`, `tags`) sans migration de schéma. Index GIN sur `metadata` pour les filtres `@>`. C'est l'**EAV moderne** mais sans les pénalités de l'EAV (5 jointures pour récupérer 5 champs).

Quand préférer une colonne dédiée vs JSONB :
- **Champ utilisé en filtre/tri sur >50 % des queries** → colonne dédiée.
- **Champ rare ou évolutif** → JSONB.

### 3.4 `ON DELETE` cohérent

```sql
order_lines.order_id REFERENCES orders(id) ON DELETE CASCADE,
orders.customer_id  REFERENCES customers(id) ON DELETE RESTRICT,
products.category_id REFERENCES categories(id) ON DELETE RESTRICT,
```

| Sens | Comportement | Pourquoi |
|------|--------------|----------|
| `order_lines → orders` | CASCADE | Supprimer une commande supprime ses lignes (ça n'existe plus) |
| `orders → customers` | RESTRICT | On ne peut pas supprimer un client qui a des commandes (audit, reporting) |
| `products → categories` | RESTRICT | Même logique : on archive plutôt qu'on supprime |

Règle : **par défaut, RESTRICT**. Force le dev à expliciter une suppression (soft delete avec `deleted_at`, archivage). CASCADE seulement quand la cohérence métier l'exige.

### 3.5 Snapshot du prix dans `order_lines.unit_price_cents`

```sql
CREATE TABLE order_lines (
  ...
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL,   -- snapshot du prix au moment de l'achat
  ...
);
```

Le prix d'un produit peut changer. La commande **doit** garder le prix payé. Sinon, ton ticket de caisse change rétroactivement quand le prix bouge — bug catastrophique en compta.

C'est un cas d'**immutabilité métier** : certaines colonnes sont conçues pour ne plus jamais changer après l'INSERT.

## 4. Stratégie d'indexation — 7 indexes justifiés

```sql
-- 1. Q1 : "dernières commandes payées" — filtre + tri composite
CREATE INDEX orders_status_created_idx ON orders(status, created_at DESC);

-- 2. Q2 : index partiel — 25 % de la table seulement
CREATE INDEX orders_customer_idx ON orders(customer_id) WHERE status = 'paid';

-- 3. Q3 : index couvrant pour SUM(quantity) sans random IO
CREATE INDEX order_lines_product_idx ON order_lines(product_id) INCLUDE (quantity);
CREATE INDEX products_category_idx ON products(category_id);

-- 4. Q4 : partiel sur paid_at non-NULL
CREATE INDEX orders_paid_at_idx ON orders(paid_at) WHERE paid_at IS NOT NULL;

-- 5. Q5/Q10 : composite pour cohortes et récurrence
CREATE INDEX orders_customer_created_idx ON orders(customer_id, created_at);

-- 6. Q7 : GIN trigram pour LIKE/typo-tolérance
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX products_name_trgm_idx ON products USING GIN (name gin_trgm_ops);

-- 7. Q8 : GIN JSONB
CREATE INDEX products_metadata_idx ON products USING GIN (metadata);

-- 8. Q9 : index partiel + index pour le JOIN
CREATE INDEX products_low_stock_idx ON products(id) WHERE stock < 10;
CREATE INDEX order_lines_order_idx ON order_lines(order_id);
```

### Cinq techniques d'indexation utilisées

| Technique | Quand | Coût | Bénéfice |
|-----------|-------|------|----------|
| **Composite** `(a, b)` | Filtre sur `a`, tri par `b` | Moyen | Permet seek + scan ordonné en 1 lookup |
| **Partial** `WHERE` | Filtre très sélectif | Petit (< table complète) | Index 5–25 % de la taille → scan rapide |
| **Covering** `INCLUDE` | SELECT sur colonne après JOIN/agg | Moyen | Index-only scan, 0 random IO sur la heap |
| **GIN trigram** | `LIKE '%foo%'`, typo | Gros (~taille de la table) | Recherche rapide même sans préfixe |
| **GIN JSONB** | Filtre `@>` ou `?` | Très gros | Filtre JSONB en O(log n) |

### Ce qui s'utilise pour quelles queries

```
                          Q1   Q2   Q3   Q4   Q5   Q6   Q7   Q8   Q9   Q10
status_created_idx        ✓
customer_idx (paid)            ✓                        
order_lines_product_idx             ✓         ✓                        ✓
products_category_idx               ✓                        
paid_at_idx                              ✓
customer_created_idx                          ✓                        ✓
products_name_trgm_idx                                  ✓
products_metadata_idx                                        ✓
products_low_stock_idx                                            ✓
order_lines_order_idx                                             ✓
```

Chaque index sert ≥ 1 query. Aucun n'est cosmétique. C'est la règle d'or : **un index a un coût** (écritures plus lentes, espace disque, RAM utilisée pour le cache). Ne crée **jamais** un index « au cas où ».

## 5. Les 4 patterns SQL non-obvious utilisés

### 5.1 Anti-join `NOT EXISTS` plutôt que `LEFT JOIN ... IS NULL` (Q6)

```sql
-- ❌ Lent (393 ms à 6 M rows)
SELECT p.id FROM products p
LEFT JOIN order_lines ol ON ol.product_id = p.id
WHERE ol.id IS NULL
LIMIT 100;

-- ✅ Rapide (3 ms)
SELECT p.id FROM products p
WHERE NOT EXISTS (SELECT 1 FROM order_lines ol WHERE ol.product_id = p.id)
LIMIT 100;
```

**Pourquoi 130× plus rapide** : `NOT EXISTS` planifie un **anti-join HashAggregate** qui s'arrête au 1er match. `LEFT JOIN ... IS NULL` doit matérialiser toutes les lignes des deux tables, joindre, puis filtrer — gaspillage massif.

Postgres a un transformeur sémantique qui *parfois* fait l'optimisation, mais pas toujours. Mieux vaut écrire `NOT EXISTS` directement.

### 5.2 CTE de pré-agrégation pour les window functions (Q3)

```sql
-- ❌ Sort externe sur disque (1500 ms, 100 MB temp)
SELECT ..., ROW_NUMBER() OVER (PARTITION BY cat.id ORDER BY SUM(ol.quantity) DESC)
FROM products p
JOIN order_lines ol ON ol.product_id = p.id
JOIN categories cat ON cat.id = p.category_id
GROUP BY cat.id, cat.name, p.id, p.name;

-- ✅ HashAggregate en RAM (250 ms)
WITH product_sales AS (
  SELECT product_id, SUM(quantity) AS total_sold
  FROM order_lines
  GROUP BY product_id    -- 5K groupes en RAM, OK
)
SELECT ..., ROW_NUMBER() OVER (PARTITION BY cat.id ORDER BY ps.total_sold DESC)
FROM product_sales ps
JOIN products p ON p.id = ps.product_id
JOIN categories cat ON cat.id = p.category_id;
```

**Pourquoi 6× plus rapide** : on agrège 6 M → 5K **avant** la jointure. Le sort qui restait se fait sur 5K rows, pas 6 M. C'est l'idée de **« réduire la taille des données le plus tôt possible »** — la règle d'or de toute optimisation SQL.

### 5.3 GIN trigram pour la recherche typo-tolérante (Q7)

```sql
CREATE EXTENSION pg_trgm;
CREATE INDEX products_name_trgm_idx ON products USING GIN (name gin_trgm_ops);

-- Match les noms similaires à "rouje" (typo de "rouge"), insensible à la casse
SELECT * FROM products WHERE name % 'rouje' ORDER BY similarity(name, 'rouje') DESC LIMIT 10;
```

L'opérateur `%` (similarity) match si la similarité dépasse un seuil (par défaut 0.3). `pg_trgm` découpe les chaînes en trigrammes (`{rou, ouj, uje}`) et compare avec la table indexée — extrêmement rapide même sans préfixe.

Contrairement à un FTS classique (`tsvector`), pg_trgm gère **les typos** sans mots-clés magiques. Pour une recherche e-commerce où les utilisateurs tapent vite et faux, c'est imbattable.

### 5.4 Filtrage JSONB avec opérateur `@>` (Q8)

```sql
CREATE INDEX products_metadata_idx ON products USING GIN (metadata);

SELECT * FROM products WHERE metadata @> '{"color": "red"}' LIMIT 100;
```

`@>` veut dire "contient le JSON à droite". L'index GIN scanne en O(log n) — équivalent d'un B-tree sur une colonne plate. À comparer à `metadata->>'color' = 'red'` qui ne peut **pas** utiliser le GIN sans un index fonctionnel séparé.

## 6. Outillage : EXPLAIN ANALYZE et explain.dalibo.com

### 6.1 La commande à connaître

```sql
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT … ;
```

| Option | Quoi |
|--------|------|
| `ANALYZE` | Exécute la query (mesure réelle, pas estimation) |
| `BUFFERS` | Affiche shared/local/temp buffers — clé pour spotter les sort-on-disk |
| `COSTS OFF` | Cache les estimations (souvent fausses, polluent le plan) |
| `FORMAT JSON` | JSON parseable par explain.dalibo.com |

### 6.2 Lire un plan en 30 secondes

Trois patterns à reconnaître :

| Pattern | Signification | Fix |
|---------|---------------|-----|
| `Seq Scan on bigtable` | Scan séquentiel d'une grosse table | Index manquant |
| `Sort … external merge Disk: 100MB` | Sort qui ne tient pas en RAM | `SET work_mem` ou réduire les rows |
| `Heap Fetches: NNN` (pas 0) | Index seek + retour à la heap | Ajouter `INCLUDE (col)` à l'index |

### 6.3 explain.dalibo.com

Colle le plan JSON dans **explain.dalibo.com**. Tu obtiens un arbre visuel + les nœuds chauds en rouge. Outil gratuit, sans login, hosté en France. Indispensable pour les plans complexes (> 10 nœuds).

## 7. Pièges réels rencontrés

Cinq pièges concrets pendant la construction de l'exercice. Trois mériteraient une entrée dans `pieges.ts` global.

1. **Q3 fait du sort externe sur disque (100 MB)** → on agrégeait avant le JOIN, forçant Postgres à trier 6 M de rows. Fix : CTE de pré-agrégation, agréger order_lines seul d'abord (→ 5K rows).
2. **`LEFT JOIN ... IS NULL` plus lent que `NOT EXISTS`** → 393 ms vs 3 ms. Postgres ne convertit pas toujours le LEFT JOIN en anti-join. Fix : écrire `NOT EXISTS` direct.
3. **Index `LATERAL` censément rapide → 12 secondes** → on pensait qu'ajouter un LATERAL pour Q9 isolerait le calcul par produit. En pratique, Postgres a planifié un nested-loop sur tous les products + order_lines = catastrophe. Fix : CTE pré-agrégée.
4. **`SET LOCAL work_mem` ne marche pas hors transaction** → `SET LOCAL` exige `BEGIN/COMMIT`. Avec `psql -f`, les statements sont en autocommit. Fix : `SET work_mem` (sans LOCAL) en tête de fichier.
5. **`grep -P` cassé sur git-bash Windows** → `grep: -P supports only unibyte and UTF-8 locales`. Fix : utiliser `sed -E` (POSIX). Le `benchmark.sh` a été corrigé pour rester portable.

## 8. Pour aller plus loin

- **Vues matérialisées + CONCURRENTLY** :
  ```sql
  CREATE MATERIALIZED VIEW top_products_per_category AS
    SELECT category_id, product_id, total_sold,
           ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY total_sold DESC) AS rank
    FROM (...);
  CREATE UNIQUE INDEX ON top_products_per_category(category_id, product_id);

  -- Cron quotidien (sans bloquer les lectures)
  REFRESH MATERIALIZED VIEW CONCURRENTLY top_products_per_category;
  ```
  Q3 → < 5 ms.

- **Partitionnement** par mois sur `orders` (avec [`pg_partman`](https://github.com/pgpartman/pg_partman)) au-delà de 100 M rows. Permet l'archivage en supprimant des partitions entières.

- **Statistiques avancées** : `CREATE STATISTICS` sur les colonnes corrélées (ex. `(category_id, brand_id)` si les produits d'une catégorie ont la même marque). Postgres a des estimations bien meilleures, choisit de meilleurs plans.

- **Connexion via Drizzle / Prisma** depuis une app Node — voir l'exercice 8.1 (taskly-api) qui réutilise le même pattern d'index.

- **Migrer vers Supabase** ou **Neon** (Postgres managé, free tier généreux). Tu garderais le même schéma, seul le `compose.yml` disparaît.

- **`pgbench`** pour tester la concurrence : 100 clients qui INSERT/UPDATE en parallèle. Révèle les hot spots et les locks de contention.

- **`pg_stat_statements`** : extension qui mesure le temps cumulé par query depuis le redémarrage. La meilleure manière de repérer **les vraies queries lentes en prod** (vs celles qu'on devine).
