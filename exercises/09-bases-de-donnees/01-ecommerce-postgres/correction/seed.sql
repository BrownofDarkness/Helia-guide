-- ─────────────────────────────────────────────────────────────────────────────
-- Seed : 50k customers, 5k products, ~1M orders, ~5M order_lines
-- Durée typique : 1-2 minutes
-- ─────────────────────────────────────────────────────────────────────────────

-- Categories
INSERT INTO categories (slug, name) VALUES
  ('books', 'Livres'),
  ('electronics', 'Électronique'),
  ('clothing', 'Vêtements'),
  ('home', 'Maison'),
  ('sports', 'Sport'),
  ('food', 'Alimentation'),
  ('toys', 'Jouets'),
  ('beauty', 'Beauté');

-- Customers (50 000)
INSERT INTO customers (email, name, created_at)
SELECT
  'user' || g || '@example.com',
  'User ' || g,
  now() - (random() * INTERVAL '730 days')
FROM generate_series(1, 50000) g;

-- Products (5 000) avec metadata variée
INSERT INTO products (sku, category_id, name, price_cents, stock, metadata)
SELECT
  'SKU-' || lpad(g::text, 6, '0'),
  ((g % 8) + 1),
  CASE (g % 5)
    WHEN 0 THEN 'Carnet ' || g
    WHEN 1 THEN 'Téléphone modèle ' || g
    WHEN 2 THEN 'T-shirt rouge taille ' || g
    WHEN 3 THEN 'Lampe design ' || g
    ELSE         'Produit ' || g
  END,
  (random() * 50000)::int + 100,
  (random() * 200)::int,
  jsonb_build_object(
    'color', (ARRAY['red','blue','green','black','white'])[(g % 5) + 1],
    'rating', (random() * 5)::numeric(3,2)
  )
FROM generate_series(1, 5000) g;

-- Orders (1 000 000)
INSERT INTO orders (customer_id, status, total_cents, created_at, paid_at)
SELECT
  ((random() * 49999)::int + 1),
  (ARRAY['pending'::order_status, 'paid', 'shipped', 'cancelled'])[(g % 4) + 1],
  ((random() * 50000)::int + 1000),
  now() - (random() * INTERVAL '730 days'),
  CASE WHEN (g % 4) IN (1, 2) THEN now() - (random() * INTERVAL '730 days') ELSE NULL END
FROM generate_series(1, 1000000) g;

-- OrderLines : 3-7 lignes par commande, ~5M lignes
INSERT INTO order_lines (order_id, product_id, quantity, unit_price_cents)
SELECT DISTINCT ON (o.id, p.id)
  o.id,
  p.id,
  (random() * 5)::int + 1,
  p.price_cents
FROM orders o
CROSS JOIN LATERAL (
  SELECT id, price_cents FROM products
  ORDER BY random() LIMIT (random() * 4)::int + 3
) p;

-- Quelques promotions
INSERT INTO promotions (code, discount_pct, valid_from, valid_until) VALUES
  ('WELCOME10', 10, now() - INTERVAL '1 year', now() + INTERVAL '1 year'),
  ('SUMMER25',  25, now() - INTERVAL '6 months', now() + INTERVAL '3 months'),
  ('VIP50',     50, now() - INTERVAL '1 year', now() + INTERVAL '1 year');

-- Statistiques
ANALYZE customers;
ANALYZE products;
ANALYZE orders;
ANALYZE order_lines;
