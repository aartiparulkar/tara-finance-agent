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
  merchant_canon AS merchant,
  SUM(amount) AS total
FROM transactions
WHERE
  is_transfer = FALSE
  AND amount > 0
GROUP BY merchant_canon
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
    merchant_canon AS merchant,
    amount,
    transaction_date
FROM transactions
WHERE
    is_transfer = FALSE 
    AND amount > 0
ORDER BY amount DESC
LIMIT 10
`;

export const GET_SPEND_BY_MERCHANT = `
  SELECT
    merchant_canon AS merchant,
    SUM(amount) AS total_spend,
    COUNT(*) AS transaction_count
  FROM transactions
  WHERE
    merchant_canon ILIKE $1
    AND is_transfer = FALSE
    AND amount > 0
  GROUP BY merchant_canon
`;

export const QUERY_TRANSACTIONS = `
  SELECT
    TO_CHAR(DATE_TRUNC('month', transaction_date), 'YYYY-MM') AS period,
    category,
    ROUND(SUM(amount)::numeric, 2) AS total,
    COUNT(*) AS tx_count
  FROM transactions
  WHERE
    is_transfer = FALSE
    AND amount > 0
    AND ($1::text IS NULL OR LOWER(category) = LOWER($1))
    AND ($2::text IS NULL OR merchant_canon ILIKE $2)
    AND ($3::date IS NULL OR transaction_date >= $3::date)
    AND ($4::date IS NULL OR transaction_date <= $4::date)
  GROUP BY DATE_TRUNC('month', transaction_date), category
  ORDER BY period ASC, total DESC
`;

export const GET_RECURRING_MERCHANTS = `
  WITH monthly_counts AS (
    SELECT
      merchant_canon,
      DATE_TRUNC('month', transaction_date) AS month,
      COUNT(*) AS tx_count,
      SUM(amount) AS monthly_total,
      AVG(amount) AS avg_amount
    FROM transactions
    WHERE
      is_transfer = FALSE
      AND amount > 0
    GROUP BY merchant_canon, DATE_TRUNC('month', transaction_date)
  ),
  merchant_stats AS (
    SELECT
      merchant_canon,
      COUNT(DISTINCT month) AS months_present,
      ROUND(AVG(monthly_total)::numeric, 2) AS avg_monthly_spend,
      ROUND(STDDEV(monthly_total)::numeric, 2) AS stddev_spend,
      ROUND(AVG(tx_count)::numeric, 2) AS avg_tx_per_month,
      (
        SELECT COUNT(DISTINCT DATE_TRUNC('month', transaction_date))
        FROM transactions
        WHERE is_transfer = FALSE AND amount > 0
      ) AS total_months_in_data
    FROM monthly_counts
    GROUP BY merchant_canon
  )
  SELECT
    merchant_canon,
    months_present,
    avg_monthly_spend,
    stddev_spend,
    avg_tx_per_month,
    total_months_in_data,
    -- consistency score: how often they appear relative to total months
    ROUND((months_present::numeric / total_months_in_data) * 100, 1) AS presence_pct
  FROM merchant_stats
  WHERE
    -- appears in at least 3 months
    months_present >= 3
    -- appears in at least 50% of all months in the dataset
    AND (months_present::numeric / total_months_in_data) >= 0.5
    -- low spend variance = consistent amount (stddev < 50% of avg)
    AND (stddev_spend IS NULL OR stddev_spend < avg_monthly_spend * 0.5)
    -- typically 1 transaction per month (subscriptions, rent)
    AND avg_tx_per_month <= 3
  ORDER BY presence_pct DESC, avg_monthly_spend DESC
`;

export const GET_DISTINCT_CATEGORIES = `
  SELECT DISTINCT LOWER(category) AS category, COUNT(*) AS tx_count
  FROM transactions
  WHERE is_transfer = FALSE
  GROUP BY LOWER(category)
  ORDER BY tx_count DESC
`;