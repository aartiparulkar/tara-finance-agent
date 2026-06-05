import { pool } from "../db/connection.js";

import {
  GET_FUND_NAV_RANGE,
  GET_BEST_FUNDS
} from "../db/queries/funds.sql.js";

import {
  calculatePercentageChange
} from "./analysticsHelpers.js";

export async function getFundReturn(fundName: string) {
  const result = await pool.query(GET_FUND_NAV_RANGE, [fundName]);
  const rows = result.rows;

  if (rows.length < 2) {
    return null;
  }

  const startNav = Number(rows[0].nav);
  const endNav = Number(rows[rows.length - 1].nav);
  const returnPercentage = calculatePercentageChange(startNav, endNav);

  return {
    fund_name: fundName,
    start_nav: startNav,
    end_nav: endNav,
    return_percentage: returnPercentage
  };
}