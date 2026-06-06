import { pool } from "../db/connection.js";
import {
  GET_TOTAL_SPEND,
  GET_SPEND_BY_CATEGORY,
  GET_TOP_MERCHANTS,
  GET_MONTHLY_SPEND,
  GET_LARGEST_TRANSACTIONS,
  GET_SPEND_BY_MERCHANT,
  QUERY_TRANSACTIONS,
  GET_RECURRING_MERCHANTS,
  GET_DISTINCT_CATEGORIES
} from "../db/queries/transactions.sql.js";
import { resolveQueryMerchant } from "../utils/merchantResolver.js";

export async function getTotalSpend() {
  const result = await pool.query(GET_TOTAL_SPEND);
  return Number(result.rows[0].total_spend);
}

export async function getSpendByCategory() {
  const result = await pool.query(GET_SPEND_BY_CATEGORY);
  return result.rows;
}

export async function getTopMerchants() {
  const result = await pool.query(GET_TOP_MERCHANTS);
  return result.rows;
}

export async function getMonthlySpendTrend() {
  const result = await pool.query(GET_MONTHLY_SPEND);
  return result.rows;
}

export async function getLargestTransactions() {
  const result = await pool.query(GET_LARGEST_TRANSACTIONS);
  return result.rows;
}

export async function getSpendByMerchant(rawMerchantInput: string) {
  const canon = await resolveQueryMerchant(rawMerchantInput);
  const result = await pool.query(GET_SPEND_BY_MERCHANT, [`%${canon}%`]);
  return { resolved_merchant: canon, rows: result.rows };
}

export async function queryTransactions(params: {
  category?: string | null;
  merchant?: string | null;
  date_from?: string | null;
  date_to?: string | null;
  include_refunds?: boolean;
}) {
  const {
    category = null,
    merchant = null,
    date_from = null,
    date_to = null,
  } = params;

  const resolvedMerchant = merchant
    ? `%${await resolveQueryMerchant(merchant)}%`
    : null;

  const result = await pool.query(QUERY_TRANSACTIONS, [
    category,
    resolvedMerchant,
    date_from,
    date_to,
  ]);

  if(result.rows.length === 0) return [];

  return result.rows.map((r: any) => ({
    period: r.period,
    category: r.category,
    total: Number(r.total),
    tx_count: Number(r.tx_count),
  }));
}

export async function getRecurringMerchants() {
  const result = await pool.query(GET_RECURRING_MERCHANTS);
  return result.rows.map((r: any) => ({
    merchant: r.merchant_canon,
    months_present: Number(r.months_present),
    avg_monthly_spend: Number(r.avg_monthly_spend),
    stddev_spend: r.stddev_spend ? Number(r.stddev_spend) : 0,
    presence_pct: Number(r.presence_pct),
  }));
}

export async function compareCategorySpend(
  categoryA: string,
  categoryB: string,
  date_from?: string,
  date_to?:   string,
) {

  try {
    let resolvedFrom = date_from;
    let resolvedTo   = date_to;

    if(!resolvedFrom || !resolvedTo) {
      const rangeResult = await pool.query(`
        SELECT
          TO_CHAR(MIN(transaction_date), 'YYYY-MM-DD') AS min_date,
          TO_CHAR(MAX(transaction_date), 'YYYY-MM-DD') AS max_date
        FROM transactions
        WHERE is_transfer = FALSE AND amount > 0
      `);
      resolvedFrom = resolvedFrom ?? rangeResult.rows[0].min_date;
      resolvedTo = resolvedTo ?? rangeResult.rows[0].max_date;
    }
    const [rowsA, rowsB] = await Promise.all([
      queryTransactions({ category: categoryA, date_from: resolvedFrom, date_to: resolvedTo }),
      queryTransactions({ category: categoryB, date_from: resolvedFrom, date_to: resolvedTo }),
    ]);

    // Build a period map for easy comparison
    const periods = new Set([
      ...rowsA.map((r) => r.period),
      ...rowsB.map((r) => r.period),
    ]);

    const comparison = [...periods].sort().map((period) => {
      const a = rowsA.find((r) => r.period === period)?.total ?? 0;
      const b = rowsB.find((r) => r.period === period)?.total ?? 0;
      return { period, [categoryA]: a, [categoryB]: b };
    });

    // Growth rate = (last month - first month) / first month * 100
    const firstA = rowsA[0]?.total ?? 0;
    const lastA  = rowsA[rowsA.length - 1]?.total ?? 0;
    const firstB = rowsB[0]?.total ?? 0;
    const lastB  = rowsB[rowsB.length - 1]?.total ?? 0;

    const growthA = firstA > 0 
      ? Number((((lastA - firstA) / firstA) * 100).toFixed(2)) 
      : null;
    const growthB = firstB > 0 
      ? Number((((lastB - firstB) / firstB) * 100).toFixed(2)) 
      : null;

    const faster =
      growthA === null && growthB === null ? null
      : growthA === null ? categoryB
      : growthB === null ? categoryA
      : growthA > growthB ? categoryA : categoryB;

    return {
      date_range: { from: resolvedFrom, to: resolvedTo },
      comparison,
      growth: {
        [categoryA]: growthA,
        [categoryB]: growthB,
      },
      faster_growing: faster,
    };
  } catch (err) {
    console.error("[compareCategorySpend] Error comparing categories:", err);
    throw new Error("Failed to compare category spend");
  }

}

export async function getDistinctCategories() {
  const result = await pool.query(GET_DISTINCT_CATEGORIES);
  return result.rows.map((r: any) => r.category);
}