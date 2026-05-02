-- Q3 : Top 5 produits par catégorie en quantité vendue (window function)
-- Stratégie : pré-agréger order_lines (6M rows) en sales par product (5K rows)
-- AVANT le JOIN avec products + categories. Sinon on joint puis on agrège,
-- ce qui force un sort externe sur disque (~100 MB) sur les 6M lignes.
--
-- work_mem ↑ pour autoriser le HashAggregate en RAM sur 6M rows
-- (par défaut PostgreSQL : 4 MB → on monte à 128 MB pour cette session).
-- En prod : configurer work_mem au niveau du rôle ou via pg_hint_plan.
SET work_mem = '128MB';
WITH product_sales AS (
  SELECT product_id, SUM(quantity) AS total_sold
  FROM order_lines
  GROUP BY product_id
)
SELECT category, product_name, total_sold FROM (
  SELECT
    cat.name AS category,
    p.name AS product_name,
    ps.total_sold,
    ROW_NUMBER() OVER (
      PARTITION BY cat.id
      ORDER BY ps.total_sold DESC
    ) AS rank
  FROM product_sales ps
  JOIN products p ON p.id = ps.product_id
  JOIN categories cat ON cat.id = p.category_id
) ranked
WHERE rank <= 5
ORDER BY category, rank;
