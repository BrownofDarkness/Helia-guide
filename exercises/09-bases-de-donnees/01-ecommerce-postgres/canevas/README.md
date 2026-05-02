# Canevas — E-commerce PostgreSQL

> Tu vas concevoir un schéma e-commerce réaliste (~7 tables avec contraintes, ENUM, JSONB), seeder **1 M de orders + 6 M d'order_lines**, écrire **10 queries analytiques** (CTE, window functions, full-text, JSONB, cohortes), et **les optimiser à coups d'index** jusqu'à passer chaque query en moins de 200 ms.
>
> C'est l'exercice qui transforme « je sais faire un SELECT » en « je sais débogguer un plan d'exécution ». Une heure de cet exercice vaut un livre de SQL.

## Ce que tu vas faire

| Étape | Sortie |
|-------|--------|
| 1 | Schéma SQL complet (`schema.sql`) avec 7 tables + ENUM + contraintes |
| 2 | Seed de 1 M orders / 6 M order_lines (tu peux le copier de `correction/seed.sql`) |
| 3 | 10 queries analytiques dans `queries/01-…sql` à `10-…sql` |
| 4 | Stratégie d'indexation dans `indexes.sql` |
| 5 | Benchmark : viser **< 50 ms** par query (200 ms acceptable) |

À la fin, tu auras vécu :
- **Les 6 patterns SQL avancés** : CTE, window functions, recursive CTE (cohortes), full-text trigram, JSONB GIN, anti-join NOT EXISTS.
- **Les 6 stratégies d'indexation** : B-tree composite, partiel (`WHERE`), couvrant (`INCLUDE`), GIN trigram, GIN JSONB, multi-colonnes ordering.
- Le **mur naturel** des window functions sur grosses tables (matview ou rien).
- **`EXPLAIN ANALYZE`** comme outil quotidien — pas un truc obscur réservé aux DBAs.

## Pré-requis

- **Docker** + **Docker Compose v2** (`docker compose version`).
- Optionnel mais pratique : **psql** local ou **DBeaver** / **TablePlus** (GUI).

Si tu n'as pas psql en local : le `tests/benchmark.sh` a un **fallback automatique** qui passe par `docker compose exec postgres psql`. Tu n'as rien à faire.

> **Windows sans WSL** : tout marche en git-bash, mais la GUI **TablePlus** (essai gratuit, $89 ensuite) ou **pgAdmin** (gratuit) rendent le débogage de plans 10× plus agréable.

## Démarrer

```bash
docker compose up -d
# Postgres tourne sur localhost:5432, base "shop", user/pwd "shop"

# Vérifier
docker compose exec postgres pg_isready -U shop
# → /var/run/postgresql:5432 - accepting connections
```

## Étapes détaillées

### 1. Compléter `schema.sql` (8 TODO)

Le canevas a un squelette avec 8 commentaires `-- TODO`. Tu dois ajouter :
- L'ENUM `order_status` (`pending`, `paid`, `shipped`, `cancelled`)
- Les tables `customers`, `categories`, `products`, `orders`, `order_lines`, `promotions`, `order_promotions`
- Les FK avec `ON DELETE CASCADE` ou `RESTRICT` selon le sens métier
- Un `CHECK (price_cents >= 0)`
- L'extension `pg_trgm` (pour la recherche typo-tolérante de Q7)

### 2. Appliquer le schéma

```bash
docker compose exec -T postgres psql -U shop -d shop < schema.sql
```

### 3. Seeder

Le canevas n'inclut pas le seed (qui fait ~5 MB de SQL). Copie-le depuis la correction :

```bash
docker compose exec -T postgres psql -U shop -d shop < ../correction/seed.sql
# 50K customers, 5K products, 1M orders, 6M order_lines (~30s)
```

### 4. Écrire les 10 queries

Voir le README parent (`../README.md`) pour la liste détaillée. En résumé :

| # | Sujet | Pattern principal |
|---|-------|--------------------|
| 1 | 50 dernières commandes payées | Filtre + tri + LIMIT |
| 2 | Top 10 clients par dépense | GROUP BY + ORDER BY + LIMIT |
| 3 | Top 5 produits par catégorie | **Window function** (`ROW_NUMBER OVER PARTITION`) |
| 4 | Panier moyen mensuel | `DATE_TRUNC` + agrégat |
| 5 | Cohorte mensuelle | **CTE + jointure cohorte** |
| 6 | Produits jamais commandés | **NOT EXISTS** (anti-join) |
| 7 | Recherche full-text typo-tolérante | **`pg_trgm`** + `%` + GIN |
| 8 | Filtre JSONB | `metadata @> '{"color":"red"}'` + GIN |
| 9 | Stock à reconstituer | **CTE** + JOIN + filtre composite |
| 10 | Revenu mensuel récurrent | Window function avancée |

### 5. Mesurer chaque query

```bash
docker compose exec -T postgres psql -U shop -d shop -c "\timing on" -f queries/01-recent-paid-orders.sql
```

Ou via le benchmark complet :

```bash
cd ../tests/
bash benchmark.sh canevas
```

### 6. Indexer + ANALYZE

Pour chaque query trop lente, regarde le plan :

```bash
docker compose exec -T postgres psql -U shop -d shop -c "EXPLAIN ANALYZE SELECT … (ta query)"
```

Le plan te dit **où passe le temps**. Cherche les `Seq Scan` sur les grosses tables, les `Sort … external merge Disk:` (= disque, lent), les jointures sans index. Ajoute l'index correspondant dans `indexes.sql` puis :

```bash
docker compose exec -T postgres psql -U shop -d shop < indexes.sql
docker compose exec -T postgres psql -U shop -d shop -c "ANALYZE;"   # Important !
```

`ANALYZE` met à jour les statistiques que Postgres utilise pour choisir les plans. Sans, le planificateur peut ignorer ton nouvel index parce qu'il pense que la table fait 100 rows.

## Bloqué ?

- **`docker compose up` plante avec `port 5432 already in use`** → tu as un Postgres local qui tourne. Stop-le ou change le port host : `"5433:5432"` dans `compose.yml`.
- **`pg_trgm` extension n'existe pas** → tu n'as pas fait `CREATE EXTENSION pg_trgm;` dans `schema.sql`. Idem pour `unaccent` si tu fais une recherche FR.
- **Q3 (window function) prend 1500 ms** → tu joins **avant** d'agréger. Pré-agrège `order_lines` par `product_id` dans une CTE, **puis** joins avec `products` + `categories`. Sinon Postgres trie 6 M lignes pour rien.
- **Q3 toujours lent même avec la CTE** → le bottleneck est la SUM sur 6 M rows. C'est **fondamental** : aucun index ne te sauvera. Solution : `SET work_mem = '128MB'` (au moins le sort tient en RAM), ou mieux une **vue matérialisée** rafraîchie quotidiennement.
- **Q6 (LEFT JOIN ... IS NULL) prend 400 ms** → utilise `NOT EXISTS` à la place. Postgres planifie un anti-join HashAggregate qui s'arrête au 1er match — bien plus rapide.
- **Mes index existent mais Postgres ne les utilise pas** → tu as oublié `ANALYZE` après `CREATE INDEX`. Ou ton index n'est pas adapté (B-tree sur un `LIKE '%foo%'` ne marche pas — il faut GIN trigram).
- **`SET work_mem` ne semble rien changer** → vérifie que tu lances la query dans la même session. Avec `psql -f`, les `SET` du fichier s'appliquent. Avec `psql -c "..."` répété, chaque appel est une nouvelle session.
- **Le seed prend 5 minutes** → c'est normal. 1 M orders + 6 M order_lines. Si tu lances ça en boucle pendant le dev, fais `docker compose down -v && docker compose up -d` pour repartir propre puis seed une bonne fois pour toutes.
- **`docker compose down` mais le volume reste** → c'est le comportement par défaut. `down -v` ajoute le `-v` pour supprimer les volumes nommés (= reset complet de la DB).

## Tester

```bash
cd ../tests/
bash benchmark.sh canevas       # ton canevas
bash benchmark.sh correction    # référence : 9/10 sous 200 ms
```

Le script détecte si `psql` est dans le PATH et fallback vers `docker compose exec` sinon.

## Ne commit pas

`pgdata/`, `*.dump`, `*.backup`. Ils sont gitignored par défaut. Si tu fais un `pg_dump` pour exporter, met-le dans `tmp/` ou `.local/`.
