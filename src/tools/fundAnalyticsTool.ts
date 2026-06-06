import { z } from "zod";
import { createTool } from '@mastra/core/tools'
import { getFundReturn, getBestFunds } from "../services/fundService.js";

const fundAnalyticsSchema = z.object({
  analysis_type: z.enum([
    "fund_return",
    "best_funds"
  ]),
  fund_name: z.string().optional(),
  top_n: z.number().int().min(1).max(20).optional(),
});

export const fundAnalyticsTool = createTool ({
  id: "fund_analytics_tool",
  description: "Provides analytics on financial funds, such as historical returns based on NAV data. Use fund_return to get a specific fund's historical return. Use best_funds to rank all funds by return.",
  inputSchema: fundAnalyticsSchema,

  execute: async ({ context }) => {
    try {
      console.log("TOOL EXECUTED");
      console.dir(context);
    const validated = fundAnalyticsSchema.parse(context);

    switch (validated.analysis_type) {
      case "fund_return": {
        if (!validated.fund_name) {
          return {
            success: false,
            error: "MISSING_FUND_NAME",
            message: "fund_name is required for fund_return analysis."
          };
        }

        const result = await getFundReturn(validated.fund_name);

        if (!result) {
          return {
            success: false,
            error: "NO_DATA",
            message: "Insufficient NAV history."
          };
        }
        return { success: true, data: result };
      }
      
      case "best_funds": {
        const result = await getBestFunds(validated.top_n ?? 5);
        
        if (!result) {
          return {
            success: false,
            error: "NO_DATA",
            message: "No fund data available."
          };
        }
        return { success: true, data: result };
      }
      
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
      error: "FUND_TOOL_ERROR",
      message:
        error instanceof Error ? error.message : "Unknown error"
    };
  }
},
});