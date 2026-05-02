-- Q2 : Top 10 clients par dépense totale
-- Index attendu : orders_customer_idx (partiel sur paid)
SELECT
  c.id,
  c.name,
  c.email,
  SUM(o.total_cents) / 100.0 AS lifetime_eur,
  COUNT(o.id) AS order_count
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.status = 'paid'
GROUP BY c.id, c.name, c.email
ORDER BY lifetime_eur DESC
LIMIT 10;
