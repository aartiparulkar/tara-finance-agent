import { getTotalSpend} from "../services/transactionService";

export async function runRegressionEvals() {
  const spend = await getTotalSpend();

  if (spend < 0) {
    throw new Error("Spend should never be negative");
  }

  console.log(
    "[PASSED] Spend non-negative"
  );
}