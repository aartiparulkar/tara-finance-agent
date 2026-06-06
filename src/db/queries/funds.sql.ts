export const GET_FUND_NAV_RANGE = `
SELECT nav_date, nav
FROM funds
WHERE fund_name = $1
ORDER BY nav_date ASC
`;

export const GET_BEST_FUNDS = `
  WITH fund_endpoints AS (
    SELECT
      fund_name,
      FIRST_VALUE(nav) OVER (
        PARTITION BY fund_name ORDER BY nav_date ASC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
      ) AS start_nav,
      FIRST_VALUE(nav) OVER (
        PARTITION BY fund_name ORDER BY nav_date DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
      ) AS end_nav
    FROM funds
  ),
  ranked AS (
    SELECT DISTINCT
      fund_name,
      start_nav,
      end_nav,
      ROUND(((end_nav - start_nav) / start_nav) * 100, 2) AS return_percentage
    FROM fund_endpoints
    WHERE start_nav > 0
  )
  SELECT *
  FROM ranked
  ORDER BY return_percentage DESC
  LIMIT $1
`;