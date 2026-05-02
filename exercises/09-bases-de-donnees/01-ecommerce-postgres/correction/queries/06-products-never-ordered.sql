-- Q6 : Produits jamais commandés
-- Utilise NOT EXISTS (anti-join) plutôt que LEFT JOIN … IS NULL :
-- PostgreSQL planifie un anti-join HashAggregate qui s'arrête au 1er match,
-- alors que LEFT JOIN … IS NULL force à matérialiser toutes les lignes.
SELECT p.id, p.sku, p.name, p.stock
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM order_lines ol WHERE ol.product_id = p.id
)
ORDER BY p.id
LIMIT 100;
