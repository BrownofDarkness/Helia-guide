-- Q7 : Recherche full-text typo-tolérante (pg_trgm)
-- Cherche les produits dont le nom ressemble à 'rouge'
SELECT
  id,
  sku,
  name,
  similarity(name, 'rouge') AS sim
FROM products
WHERE name % 'rouge'              -- opérateur de similarité trigram
ORDER BY sim DESC, id
LIMIT 20;
