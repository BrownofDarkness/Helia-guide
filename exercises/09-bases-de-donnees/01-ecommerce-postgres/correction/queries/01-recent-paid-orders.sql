-- Q1 : Les 50 dernières commandes payées avec nom client + total
-- Index attendu : orders_status_created_idx
SELECT
  o.id,
  c.name AS customer,
  o.total_cents / 100.0 AS total_eur,
  o.created_at
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.status = 'paid'
ORDER BY o.created_at DESC
LIMIT 50;
