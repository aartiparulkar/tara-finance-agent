export const GET_PORTFOLIO_VALUE = `
SELECT
  h.holding_id,
  h.fund_name,
  h.units,
  h.purchase_nav,
  h.purchase_date,

  f.nav AS current_nav,
  f.nav_date AS current_nav_date,

  ROUND(h.units * h.purchase_nav, 2) AS invested_value,
  ROUND(h.units * f.nav, 2) AS current_value,
  ROUND(h.units * (f.nav - h.purchase_nav), 2) AS absolute_gain,
  
FROM holdings h
JOIN funds f
  ON h.fund_id = f.fund_id
  AND f.nav_date = (
    SELECT MAX(nav_date) FROM funds WHERE fund_id = h.fund_id
  )
ORDER BY current_value DESC
`;

export const GET_HOLDINGS_PERFORMANCE = `
  SELECT
    h.holding_id,
    h.fund_name,
    h.units,
    h.purchase_nav,
    h.purchase_date,
    f.nav AS current_nav,
    f.nav_date AS current_nav_date,
    ROUND(h.units * h.purchase_nav, 2) AS invested_value,
    ROUND(h.units * f.nav, 2) AS current_value,
    ROUND(h.units * (f.nav - h.purchase_nav), 2) AS absolute_gain
  FROM holdings h
  JOIN funds f
    ON f.fund_id = h.fund_id
   AND f.nav_date = (
     SELECT MAX(nav_date) FROM funds WHERE fund_id = h.fund_id
   )
  ORDER BY absolute_gain DESC
`;