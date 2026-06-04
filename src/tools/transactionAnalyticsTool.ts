import { z } from "zod";

import {
  getTotalSpend,
  getSpendByCategory,
  getTopMerchants,
  getMonthlySpendTrend,
  getLargestTransactions,
} from "../services/transactionService";

import { ToolResponse } from "../types/tool.types";

const transactionAnalyticsSchema = z.object({
  analysis_type: z.enum([
    "total_spend",
    "spend_by_category",
    "top_merchants",
    "monthly_trend",
    "largest_transactions",
  ])
});

export async function transactionAnalyticsTool(input: unknown): Promise<ToolResponse<any>> {
  try {
    const validated = transactionAnalyticsSchema.parse(input);

    switch (validated.analysis_type) {
      case "total_spend":
        return {
          success: true,
          data: await getTotalSpend()
        };

      case "spend_by_category":
        return {
          success: true,
          data: await getSpendByCategory()
        };

      case "top_merchants":
        return {
          success: true,
          data: await getTopMerchants()
        };

      case "monthly_trend":
        return {
          success: true,
          data: await getMonthlySpendTrend()
        };

      case "largest_transactions":
        return {
          success: true,
          data: await getLargestTransactions()
        };

      default:
        return {
          success: false,
          error: "INVALID_ANALYSIS_TYPE",
          message: "Unsupported analysis type."
        };
    }
  } catch (error) {
    return {
      success: false,
      error: "TRANSACTION_TOOL_ERROR",
      message:
        error instanceof Error ? error.message : "Unknown error"
    };
  }
}