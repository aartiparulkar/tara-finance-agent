import { taraAgent } from "./taraAgent.js";
import { logInfo, logError } from "../utils/logging.js";

export async function askTara(question: string) {
  const startTime = Date.now();

  try {
    logInfo("Received question for Tara", { question });

    const response = await taraAgent.generate(
      [{ role: "user", content: question }],
      { maxSteps: 10 }
    );

    const answer = response.text;
    
    const latency = Date.now() - startTime;

    logInfo("Tara response generated", { 
      question,
      answer,
      steps: response.steps.length ?? 0,
      latency_ms: latency,
    });

    return answer;

  } catch (err) {
    logError("Agent Orchestration Failed", {
      question,
      error: err instanceof Error ? err.message : String(err),
      latency_ms: Date.now() - startTime,
    });
    throw err;
  }
}