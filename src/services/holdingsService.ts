import { pool } from "../db/connection.js";

import {
  GET_PORTFOLIO_VALUE,
  GET_HOLDINGS_PERFORMANCE
} from "../db/queries/holdings.sql.js";

import {
  calculatePercentageChange
} from "./analysticsHelpers.js";

export async function getPortfolioValue() {
  const result = await pool.query(GET_PORTFOLIO_VALUE);
  return result.rows;
}

export async function getHoldingsPerformance() {
  const result = await pool.query(GET_HOLDINGS_PERFORMANCE);

  return result.rows.map((row) => {
    const invested = Number(row.invested_value);
    const current = Number(row.current_value);
    const returnPercentage = calculatePercentageChange(invested, current);

    return {
      ...row,
      return_percentage: returnPercentage
    };
  });
}