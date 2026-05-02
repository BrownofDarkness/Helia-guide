-- Q8 : Produits rouges via JSONB (utilise GIN index sur metadata)
SELECT
  id,
  sku,
  name,
  metadata->>'rating' AS rating
FROM products
WHERE metadata @> '{"color": "red"}'::jsonb
ORDER BY id
LIMIT 100;
