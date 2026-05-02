-- Q9 : Produits dont le stock < 10 ET qui ont vendu > 50 unités les 30 derniers jours.
-- Stratégie : pré-agréger les ventes 30 jours par produit dans une CTE, PUIS
-- joindre avec products filtré via products_low_stock_idx.
-- L'index orders(status, created_at DESC) sert pour la fenêtre 30 jours.
WITH recent_sales AS (
  SELECT ol.product_id, SUM(ol.quantity) AS sold_30d
  FROM order_lines ol
  JOIN orders o ON o.id = ol.order_id
  WHERE o.status = 'paid'
    AND o.created_at >= now() - INTERVAL '30 days'
  GROUP BY ol.product_id
)
SELECT
  p.id,
  p.sku,
  p.name,
  p.stock,
  rs.sold_30d
FROM products p
JOIN recent_sales rs ON rs.product_id = p.id
WHERE p.stock < 10
  AND rs.sold_30d > 50
ORDER BY rs.sold_30d DESC;
