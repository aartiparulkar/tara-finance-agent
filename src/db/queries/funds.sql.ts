export const GET_FUND_NAV_RANGE = `
SELECT nav_date, nav
FROM funds
WHERE fund_name = $1
ORDER BY nav_date
`;

export const GET_BEST_FUNDS = `
SELECT
  fund_name,
  MIN(nav) AS min_nav,
  MAX(nav) AS max_nav
FROM funds
GROUP BY fund_name
`;