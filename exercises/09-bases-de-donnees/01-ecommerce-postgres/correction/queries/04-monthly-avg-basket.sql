-- Q4 : Panier moyen par mois (12 derniers mois)
SELECT
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS orders_count,
  AVG(total_cents) / 100.0 AS avg_basket_eur,
  SUM(total_cents) / 100.0 AS total_eur
FROM orders
WHERE status = 'paid'
  AND created_at >= now() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;
