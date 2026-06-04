export const GET_TOTAL_SPEND = `
SELECT COALESCE(SUM(amount), 0) AS total_spend
FROM transactions
WHERE
  is_transfer = FALSE
  AND amount > 0
`;

export const GET_SPEND_BY_CATEGORY = `
SELECT category, SUM(amount) AS total
FROM transactions
WHERE
  is_transfer = FALSE
  AND amount > 0
GROUP BY category
ORDER BY total DESC
`;

export const GET_TOP_MERCHANTS = `
SELECT
  merchant_normalized,
  SUM(amount) AS total
FROM transactions
WHERE
  is_transfer = FALSE
  AND amount > 0
GROUP BY merchant_normalized
ORDER BY total DESC
LIMIT 10
`;

export const GET_MONTHLY_SPEND = `
SELECT
  DATE_TRUNC('month', transaction_date) AS month,
  SUM(amount) AS total
FROM transactions
WHERE
  is_transfer = FALSE
  AND amount > 0
GROUP BY month
ORDER BY month
`;

export const GET_LARGEST_TRANSACTIONS = `
SELECT
    merchant_normalized,
    amount,
    transaction_date
FROM transactions
WHERE
    is_transfer = FALSE 
    AND amount > 0
ORDER BY amount DESC
LIMIT 10
`;
