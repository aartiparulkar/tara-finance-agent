export const GET_PORTFOLIO_VALUE = `
SELECT
  h.user_id,
  SUM(f.nav * h.units) AS portfolio_value
FROM holdings h
JOIN funds f
  ON h.fund_id = f.fund_id
GROUP BY h.user_id
`;

export const GET_HOLDINGS_PERFORMANCE = `
SELECT
  h.holding_id,
  h.units,
  h.purchase_nav,
  f.nav AS current_nav,

  (f.nav * h.units) AS current_value,

  (h.purchase_nav * h.units) AS invested_value

FROM holdings h
JOIN funds f
  ON h.fund_id = f.fund_id
`;

