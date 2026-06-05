import { z } from "zod";
import { createTool } from '@mastra/core/tools'

import {
  getPortfolioValue,
  getHoldingsPerformance
} from "../services/holdingsService";

import {
  ToolResponse
} from "../types/tool.types";

const holdingsAnalyticsSchema = z.object({
  analysis_type: z.enum([
    "portfolio_value",
    "holdings_performance"
  ])
});

export const holdingsAnalyticsTool = createTool ({

  id: "holdings_analytics_tool",
  description: "Provides analytics on financial holdings, such as current portfolio value and performance of individual holdings.",
  inputSchema: holdingsAnalyticsSchema,

  execute: async ({ context }) => {
    try {
      const validated = holdingsAnalyticsSchema.parse(context);

      switch (validated.analysis_type) {
        case "portfolio_value":
          return {
            success: true,
            data: await getPortfolioValue()
          };

        case "holdings_performance":
          return {
            success: true,
            data: await getHoldingsPerformance()
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
        error: "HOLDINGS_TOOL_ERROR",
        message:
          error instanceof Error ? error.message : "Unknown error"
      };
    }
  },
});