import {
  getPortfolioValue,
  getHoldingsPerformance
} from "../services/holdingsService";

export async function runHoldingsEvals() {
  const portfolio = await getPortfolioValue();

  if (!Array.isArray(portfolio)) {
    throw new Error("Portfolio value invalid");
  }

  console.log(
    "[PASSED] Portfolio value"
  );

  const holdings = await getHoldingsPerformance();

  if (!Array.isArray(holdings)) {
    throw new Error("Holdings performance invalid");
  }

  console.log(
    "[PASSED] Holdings performance"
  );
}