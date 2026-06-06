import { z } from "zod";
import { createTool } from '@mastra/core/tools'

import {
  getTotalSpend,
  getSpendByCategory,
  getTopMerchants,
  getMonthlySpendTrend,
  getLargestTransactions,
  getSpendByMerchant,
  queryTransactions,
  getRecurringMerchants,
  compareCategorySpend,
  getDistinctCategories,
} from "../services/transactionService.js";

console.log("Transaction Analytics Tool Loaded");

const transactionAnalyticsSchema = z.object({
  analysis_type: z.enum([
    "total_spend",
    "spend_by_category",
    "top_merchants",
    "monthly_trend",
    "largest_transactions",
    "spend_by_merchant",
    "query_transactions",
    "recurring_merchants",
    "compare_categories",
    "list_categories",
  ]).describe(
    "The type of analysis to run. Use top_merchants to rank all merchants by spend — no merchant field needed. Use spend_by_merchant only when the user names a specific merchant."
  ),
  merchant: z.string().optional().describe(
    "Only required for spend_by_merchant. The merchant name as the user said it. Leave undefined for all other analysis types."
  ),
  category: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  category_a: z.string().optional(),
  category_b: z.string().optional(),
  include_refunds: z.boolean().optional().default(false),
});

console.dir(
  transactionAnalyticsSchema.safeParse({
    analysis_type: "compare_categories",
    category_a: "food",
    category_b: "travel"
  }),
  { depth: null }
);

export const transactionAnalyticsTool = createTool ({
  id: "transaction_analytics_tool",
  description: `Analyzes financial transactions. Pick analysis_type based on the question — never ask the user for clarification, just call the tool with what you know.

- total_spend: total spending. No params needed.
- spend_by_category: spending by category. No params needed.
- top_merchants: highest spend merchants. No params needed.
- monthly_trend: month-over-month totals. No params needed.
- largest_transactions: biggest individual transactions. No params needed.
- recurring_merchants: subscriptions and recurring bills detected automatically. NO params needed, call immediately.
- spend_by_merchant: spend for one merchant. Requires: merchant.
- query_transactions: monthly spend filtered by category, merchant, or date range. All params optional. Use for single-category questions like "how much on food in march" (pass category="food", date_from="2025-03-01", date_to="2025-03-31").
- compare_categories: compares two categories month by month and calculates which grew faster. Requires: category_a, category_b. date_from and date_to are optional — if not provided by the user, omit them and the tool will automatically use all available data. Never ask the user for a date range for this analysis.
- list_categories: lists all distinct categories in the transaction data. No params needed.
`,
 
  inputSchema: transactionAnalyticsSchema,
  execute: async ({ context }) => {
    try {
      const sanitized = Object.fromEntries(
        Object.entries(context).map(([key, value]) => [
          key,
          value === null || value === "" ? undefined : value,
        ])
      );
      
      const validated = transactionAnalyticsSchema.parse(sanitized);

      switch (validated.analysis_type) {
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

        case "query_transactions":
          const data = await queryTransactions({
            category: validated.category ?? undefined,
            merchant: validated.merchant ?? undefined,
            date_from: validated.date_from ?? undefined,
            date_to: validated.date_to ?? undefined,
            include_refunds: validated.include_refunds,
          });

          if(data.length === 0) {
            return {
              success: false,
              error: "NO_DATA",
              message: "No transactions found matching the specified criteria.",
            };
          }

          return { success: true, data };
        
        case "recurring_merchants": {
          const data = await getRecurringMerchants();

          if(data.length === 0) {
            return {
              success: false,
              error: "NO_DATA",
              message: "No recurring merchants found in the transaction data.",
            };
          }

          return { success: true, data };
        }

        case "compare_categories": {
          console.log("[tool] compare_categories called with:", validated);
          if (!validated.category_a || !validated.category_b) {
            return {
              success: false,
              error: "MISSING_CATEGORIES",
              message: "category_a and category_b are required for compare_categories analysis.",
            };
          }

          const data = await compareCategorySpend(
            validated.category_a,
            validated.category_b,
            validated.date_from,
            validated.date_to
          );

          return { success: true, data };
        }

        case "list_categories":
          return {
            success: true,
            data: await getDistinctCategories(),
          };

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
