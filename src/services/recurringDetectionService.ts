import { pool } from "../db/connection";

export async function detectRecurringMerchants() {

  const result = await pool.query(`
    SELECT
      merchant_normalized,
      COUNT(*) as transaction_count
    FROM transactions
    GROUP BY merchant_normalized
    HAVING COUNT(*) >= 3
    ORDER BY transaction_count DESC
  `);

  return result.rows;
}