import { z } from "zod";
import { createTool } from '@mastra/core/tools'

import {
  getTotalSpend,
  getSpendByCategory,
  getTopMerchants,
  getMonthlySpendTrend,
  getLargestTransactions,
} from "../services/transactionService";


const transactionAnalyticsSchema = z.object({
  analysis_type: z.enum([
    "total_spend",
    "spend_by_category",
    "top_merchants",
    "monthly_trend",
    "largest_transactions",
  ])
});

export const transactionAnalyticsTool = createTool ({
  id: "transaction_analytics_tool",
  description: "Provides various analytics on financial transactions, such as total spend, spend by category, top merchants, monthly trends, and largest transactions.",
  inputSchema: transactionAnalyticsSchema,

  execute: async ({ context }) => {

    try {
      const validated = transactionAnalyticsSchema.parse(context);
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
  },
});
