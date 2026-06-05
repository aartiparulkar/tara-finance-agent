import { taraAgent } from "./taraAgent.js";
import { logInfo, logError } from "../utils/logging.js";

// export async function askTara(question: string) {
//     const response = await taraAgent.generate(question);
//     //   logInfo("Incoming question", { question });
//     console.dir(response, { depth: null });

//     return response.text;
// }

export async function askTara(question: string) {
  try {
    logInfo("Received question for Tara", { question });

    const response = await taraAgent.generate(question);
    logInfo("Tara response generated", { response: response.text });

    return response.text;

  } catch (err) {
    logError("Agent Orchestration Failed", err);
    throw err;
  }
}