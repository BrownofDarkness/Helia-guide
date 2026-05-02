-- Indexes justifiés pour atteindre < 50 ms sur les 10 queries

-- Q1 (dernières commandes payées) : filtre status + tri created_at
CREATE INDEX orders_status_created_idx ON orders(status, created_at DESC);

-- Q2 (top clients) : agrégat par customer_id, JOIN customers naturel via PK
CREATE INDEX orders_customer_idx ON orders(customer_id) WHERE status = 'paid';

-- Q3 (top produits par catégorie) : JOIN order_lines → products → categories
-- Index couvrant : INCLUDE (quantity) évite le random IO sur la heap pour SUM(quantity).
CREATE INDEX order_lines_product_idx ON order_lines(product_id) INCLUDE (quantity);
-- (products(category_id) déjà bénéficie de la PK + le filtre)
CREATE INDEX products_category_idx ON products(category_id);

-- Q4 (panier moyen par mois) : agrégation sur orders.created_at
-- L'index Q1 sert pour le filtre. Ajoutons un partiel sur paid si fréquent :
CREATE INDEX orders_paid_at_idx ON orders(paid_at) WHERE paid_at IS NOT NULL;

-- Q5 (cohortes) : besoin d'index sur (customer_id, created_at) pour les CTE
CREATE INDEX orders_customer_created_idx ON orders(customer_id, created_at);

-- Q6 (produits jamais commandés) : LEFT JOIN order_lines
-- order_lines_product_idx (Q3) suffit

-- Q7 (full-text) : pg_trgm pour la recherche typo-tolerante
CREATE INDEX products_name_trgm_idx ON products USING GIN (name gin_trgm_ops);

-- Q8 (filtre JSONB) : GIN sur metadata
CREATE INDEX products_metadata_idx ON products USING GIN (metadata);

-- Q9 (stock à reconstituer) : partiel sur stock < 10
CREATE INDEX products_low_stock_idx ON products(id) WHERE stock < 10;
-- Q9 : pour le JOIN order_lines.order_id → orders.id côté inverse
CREATE INDEX order_lines_order_idx ON order_lines(order_id);

-- Q10 (revenu récurrent) : couvre par orders_customer_created_idx (Q5)

-- Update statistiques après création
ANALYZE products;
ANALYZE orders;
ANALYZE order_lines;
