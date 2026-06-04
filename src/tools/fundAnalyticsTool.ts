import { z } from "zod";

import {
  getFundReturn
} from "../services/fundService";

import {
  ToolResponse
} from "../types/tool.types";

const fundAnalyticsSchema = z.object({
  analysis_type: z.enum([
    "fund_return"
  ]),

  fund_name: z.string()
});

export async function fundAnalyticsTool(input: unknown): Promise<ToolResponse<any>> {
  
    try {
    const validated = fundAnalyticsSchema.parse(input);

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
}