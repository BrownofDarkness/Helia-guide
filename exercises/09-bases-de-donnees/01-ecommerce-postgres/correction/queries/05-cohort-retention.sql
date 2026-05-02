-- Q5 : Cohorte mensuelle — % des clients qui re-commandent à M+1, M+2, ...
WITH first_order AS (
  SELECT
    customer_id,
    DATE_TRUNC('month', MIN(created_at))::date AS cohort_month
  FROM orders
  WHERE status = 'paid'
  GROUP BY customer_id
),
order_months AS (
  SELECT
    o.customer_id,
    DATE_TRUNC('month', o.created_at)::date AS order_month
  FROM orders o
  WHERE o.status = 'paid'
),
cohorts AS (
  SELECT
    fo.cohort_month,
    EXTRACT(MONTH FROM AGE(om.order_month, fo.cohort_month))::int AS month_offset,
    COUNT(DISTINCT om.customer_id) AS customers
  FROM first_order fo
  JOIN order_months om ON om.customer_id = fo.customer_id
  WHERE om.order_month >= fo.cohort_month
  GROUP BY fo.cohort_month, month_offset
)
SELECT
  cohort_month,
  month_offset,
  customers,
  ROUND(100.0 * customers / FIRST_VALUE(customers) OVER (
    PARTITION BY cohort_month ORDER BY month_offset
  ), 1) AS retention_pct
FROM cohorts
WHERE cohort_month >= now() - INTERVAL '12 months'
ORDER BY cohort_month, month_offset
LIMIT 100;
