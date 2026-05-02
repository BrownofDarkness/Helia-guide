-- Q10 : Top 20 clients par récurrence (nombre de mois distincts avec achat sur 12 mois)
SELECT
  c.id,
  c.name,
  c.email,
  COUNT(DISTINCT DATE_TRUNC('month', o.created_at)) AS active_months,
  SUM(o.total_cents) / 100.0 AS total_eur,
  AVG(o.total_cents) / 100.0 AS avg_basket_eur
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.status = 'paid'
  AND o.created_at >= now() - INTERVAL '12 months'
GROUP BY c.id, c.name, c.email
HAVING COUNT(DISTINCT DATE_TRUNC('month', o.created_at)) >= 3
ORDER BY active_months DESC, total_eur DESC
LIMIT 20;
