import { taraAgent } from "./taraAgent";
import { logInfo } from "../utils/logging";

// export async function askTara(question: string) {
//     const response = await taraAgent.generate(question);
//     //   logInfo("Incoming question", { question });
//     console.dir(response, { depth: null });

//     return response.text;
// }

export async function askTara(question: string) {
  console.log("askTara called");

  try {
    const response = await taraAgent.generate(question);
    return response.text;

  } catch (err) {
    console.error("AGENT ERROR:", err);
    throw err;
  }
}