-- À COMPLÉTER après avoir mesuré les queries
-- Pour chaque query lente, ajoute l'index approprié et re-mesure avec EXPLAIN ANALYZE

-- TODO : index B-tree sur orders(customer_id, created_at DESC) pour les listings clients

-- TODO : index sur orders(status, created_at DESC) pour "dernières commandes payées"

-- TODO : index GIN trgm sur products(name) pour le full-text search

-- TODO : index GIN sur products(metadata) pour les filtres JSON

-- TODO : index partiel pour "stock faible"
