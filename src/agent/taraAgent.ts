import { Agent } from "@mastra/core/agent";
import dotenv from "dotenv";

dotenv.config();

import { transactionAnalyticsTool } from "../tools/transactionAnalyticsTool.js";
import { fundAnalyticsTool } from "../tools/fundAnalyticsTool.js";
import { holdingsAnalyticsTool } from "../tools/holdingsAnalyticsTool.js";
import { SYSTEM_PROMPT } from "./systemPrompt.js";


export const taraAgent = new Agent({
  name: "tara-finance-agent",
  instructions: SYSTEM_PROMPT,
  model: "openai/gpt-4.1-mini",
  tools: {
    transactionAnalyticsTool,
    fundAnalyticsTool,
    holdingsAnalyticsTool
  }
});

