import { Agent } from "@mastra/core/agent";
import dotenv from "dotenv";

dotenv.config();

import { transactionAnalyticsTool } from "../tools/transactionAnalyticsTool";
import { fundAnalyticsTool } from "../tools/fundAnalyticsTool";
import { holdingsAnalyticsTool } from "../tools/holdingsAnalyticsTool";
import { SYSTEM_PROMPT } from "./systemPrompt";


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
console.dir(taraAgent, { depth: 3 });

