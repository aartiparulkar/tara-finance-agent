import { z } from "zod";
import { createTool } from '@mastra/core/tools'

import {
  getTotalSpend,
  getSpendByCategory,
  getTopMerchants,
  getMonthlySpendTrend,
  getLargestTransactions,
  getSpendByMerchant,
} from "../services/transactionService.js";


const transactionAnalyticsSchema = z.object({
  analysis_type: z.enum([
    "total_spend",
    "spend_by_category",
    "top_merchants",
    "monthly_trend",
    "largest_transactions",
    "spend_by_merchant",
  ]).describe(
    "The type of analysis to run. Use top_merchants to rank all merchants by spend — no merchant field needed. Use spend_by_merchant only when the user names a specific merchant."
  ),
  merchant: z.string().optional().describe(
    "Only required for spend_by_merchant. The merchant name as the user said it. Leave undefined for all other analysis types."
  ),
});

export const transactionAnalyticsTool = createTool ({
  id: "transaction_analytics_tool",
  description: `Analyzes financial transactions. Use analysis_type to pick the right query:
  - total_spend: Get total money spent across all transactions.
  - spend_by_category: breaakdown of spend by category.
  - top_merchants: ranked list of ALL merchants by total spend - use this when the user asks "which merchants do I spend most on" or "top merchants" WITHOUT naming a specific merchant.
  - monthly_trend: spend over time by month.
  - largest_transactions: single biggest transactions, sorted by amount.
  - spend_by_merchant: spend for ONE named merchant - only use this when the user names a specific merchant like "Swiggy" or "Amazon". Requires the merchant field.`,
 
  inputSchema: transactionAnalyticsSchema,
  execute: async ({ context }) => {
    try {
      switch (context.analysis_type) {
        case "total_spend":
          return { success: true, data: await getTotalSpend() };

        case "spend_by_category":
          return { success: true, data: await getSpendByCategory() };

        case "top_merchants":
          return { success: true, data: await getTopMerchants() };

        case "monthly_trend":
          return { success: true, data: await getMonthlySpendTrend() };

        case "largest_transactions":
          return { success: true, data: await getLargestTransactions() };

        case "spend_by_merchant": {
          if (!context.merchant?.trim()) {
            return {
              success: false,
              error: "MISSING_MERCHANT",
              message: "spend_by_merchant requires a merchant name. For top merchants overall, use top_merchants instead.",
            };
          }
          return { success: true, data: await getSpendByMerchant(context.merchant) };
        }
        
        default:
          return { success: false, error: "INVALID_ANALYSIS_TYPE" };
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
