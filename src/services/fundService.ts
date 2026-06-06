import { pool } from "../db/connection.js";
import { calculatePercentageChange } from "./analysticsHelpers.js";
import { resolveFundName } from "../utils/fundResolver.js";
import {
  GET_FUND_NAV_RANGE,
  GET_BEST_FUNDS
} from "../db/queries/funds.sql.js";

export async function getFundReturn(fundName: string) {
  const resolvedName = await resolveFundName(fundName);
  
  if(!resolvedName) return null;

  const result = await pool.query(GET_FUND_NAV_RANGE, [resolvedName]);
  const rows = result.rows;

  if (rows.length < 2) return null;

  const startNav = Number(rows[0].nav);
  const endNav = Number(rows[rows.length - 1].nav);

  return {
    fund_name: resolvedName,
    queried_name: fundName,
    start_nav: startNav,
    end_nav: endNav,
    return_percentage: calculatePercentageChange(startNav, endNav)
  };
}

export async function getBestFunds(topN: number = 5) {
  const limit = Math.max(1, Math.min(Math.floor(topN), 20));

  const result = await pool.query(GET_BEST_FUNDS, [limit]);
  const rows = result.rows;

  if (rows.length === 0) return null;

  return {
    funds: rows.map((row: any) => ({
      fund_name: row.fund_name,
      start_nav: Number(row.start_nav),
      end_nav: Number(row.end_nav),
      return_percentage: Number(row.return_percentage),
    })),
    best: rows[0].fund_name,
    worst: rows[rows.length - 1].fund_name,
    spread: Number(
      (rows[0].return_percentage - rows[rows.length - 1].return_percentage).toFixed(2)
    ),
  };
}