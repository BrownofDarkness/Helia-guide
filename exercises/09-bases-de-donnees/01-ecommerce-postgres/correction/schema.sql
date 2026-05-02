-- ─────────────────────────────────────────────────────────────────────────────
-- Schéma e-commerce taskly-shop
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;

DROP TABLE IF EXISTS order_promotions, promotions, order_lines, orders, products, categories, customers CASCADE;
DROP TYPE IF EXISTS order_status;

CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'cancelled');

-- ─────────────────────────────────────────────────────────────────────────────
-- Customers
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE customers (
  id          SERIAL PRIMARY KEY,
  email       CITEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Categories
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE categories (
  id     SERIAL PRIMARY KEY,
  slug   TEXT NOT NULL UNIQUE,
  name   TEXT NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Products
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE products (
  id            SERIAL PRIMARY KEY,
  sku           VARCHAR(32) NOT NULL UNIQUE,
  category_id   INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name          TEXT NOT NULL,
  price_cents   INTEGER NOT NULL CHECK (price_cents >= 0),
  stock         INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Orders
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE orders (
  id           SERIAL PRIMARY KEY,
  customer_id  INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status       order_status NOT NULL DEFAULT 'pending',
  total_cents  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at      TIMESTAMPTZ
);

-- ─────────────────────────────────────────────────────────────────────────────
-- OrderLines
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE order_lines (
  id              SERIAL PRIMARY KEY,
  order_id        INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  UNIQUE (order_id, product_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Promotions
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE promotions (
  id            SERIAL PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  discount_pct  INTEGER NOT NULL CHECK (discount_pct BETWEEN 1 AND 100),
  valid_from    TIMESTAMPTZ NOT NULL,
  valid_until   TIMESTAMPTZ NOT NULL,
  CHECK (valid_until > valid_from)
);

CREATE TABLE order_promotions (
  order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  promotion_id  INTEGER NOT NULL REFERENCES promotions(id) ON DELETE RESTRICT,
  PRIMARY KEY (order_id, promotion_id)
);
