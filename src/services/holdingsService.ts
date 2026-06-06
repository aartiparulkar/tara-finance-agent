import { pool } from "../db/connection.js";
import { calculatePercentageChange } from "./analysticsHelpers.js";
import {
  GET_PORTFOLIO_VALUE,
  GET_HOLDINGS_PERFORMANCE
} from "../db/queries/holdings.sql.js";

export async function getPortfolioValue() {
  const result = await pool.query(GET_PORTFOLIO_VALUE);
  const rows = result.rows;

  if (rows.length === 0) return null;

  const totalInvested = rows.reduce((sum: number, r: any) => sum + Number(r.invested_value), 0);
  const totalCurrent = rows.reduce((sum: number, r: any) => sum + Number(r.current_value), 0);
  const totalGain = rows.reduce((sum: number, r: any) => sum + Number(r.absolute_gain), 0);

  return {
    holdings: rows.map((r: any) => ({
      fund_name: r.fund_name,
      units: Number(r.units),
      purchase_nav: Number(r.purchase_nav),
      current_nav: Number(r.current_nav),
      current_nav_date: r.current_nav_date,
      invested_value: Number(r.invested_value),
      current_value: Number(r.current_value),
      absolute_gain: Number(r.absolute_gain),
    })),
    summary: {
      total_invested: Number(totalInvested.toFixed(2)),
      total_current_value: Number(totalCurrent.toFixed(2)),
      total_absolute_gain: Number(totalGain.toFixed(2)),
      total_return_percentage: calculatePercentageChange(totalInvested, totalCurrent),
    },
  };
}

export async function getHoldingsPerformance() {
  const result = await pool.query(GET_HOLDINGS_PERFORMANCE);
  const rows = result.rows;

  if(rows.length === 0) return null;

  return result.rows.map((row) => {
    const invested = Number(row.invested_value);
    const current = Number(row.current_value);

    return {
      fund_name: row.fund_name,
      units: Number(row.units),
      purchase_nav: Number(row.purchase_nav),
      purchase_date: row.purchase_date,
      current_nav: Number(row.current_nav),
      current_nav_date: row.current_nav_date,
      invested_value: invested,
      current_value: current,
      absolute_gain: Number(row.absolute_gain),
      return_percentage: calculatePercentageChange(invested, current)
    };
  });
}