import { getFundReturn } from "../services/fundService";

export async function runFundEvals() {
  const result = await getFundReturn("Kestrel Emerging Growth Fund");

  if (!result) {
    console.log("[SKIPPED] No fund data");
    return;
  }

  if (typeof result.return_percentage !== "number") {
    throw new Error("Invalid return percentage");
  }

  console.log("[PASSED] Fund return evaluation");
}