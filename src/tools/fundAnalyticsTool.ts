import { z } from "zod";
import { createTool } from '@mastra/core/tools'
import { getFundReturn } from "../services/fundService.js";

const fundAnalyticsSchema = z.object({
  analysis_type: z.enum([
    "fund_return"
  ]),

  fund_name: z.string()
});

export const fundAnalyticsTool = createTool ({
  id: "fund_analytics_tool",
  description: "Provides analytics on financial funds, such as historical returns based on NAV data.",
  inputSchema: fundAnalyticsSchema,

  execute: async ({ context }) => {
    try {
    const validated = fundAnalyticsSchema.parse(context);

    switch (validated.analysis_type) {
      case "fund_return":
        const result = await getFundReturn(validated.fund_name);
        
        if (!result) {
          return {
            success: false,
            error: "NO_DATA",
            message: "Insufficient NAV history."
          };
        }

        return {
          success: true,
          data: result
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
      error: "FUND_TOOL_ERROR",
      message:
        error instanceof Error ? error.message : "Unknown error"
    };
  }
},
});