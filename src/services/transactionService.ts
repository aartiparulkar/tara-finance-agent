import { pool } from "../db/connection.js";
import { resolveQueryMerchant } from "../utils/merchantResolver.js";
import {
  GET_TOTAL_SPEND,
  GET_SPEND_BY_CATEGORY,
  GET_TOP_MERCHANTS,
  GET_MONTHLY_SPEND,
  GET_LARGEST_TRANSACTIONS,
  GET_SPEND_BY_MERCHANT,
} from "../db/queries/transactions.sql.js";

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
  return {
    resolved_merchant: canon,
    rows: result.rows,
  };
}