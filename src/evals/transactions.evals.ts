import {
  getTotalSpend,
  getTopMerchants
} from "../services/transactionService";

import { assertEqual } from "./assertions";

export async function runTransactionEvals() {
  const totalSpend = await getTotalSpend();
  if (typeof totalSpend !== "number") {
    throw new Error("Total spend is not numeric");
  }
  console.log("[PASSED] Total spend numeric");


  const merchants = await getTopMerchants();
  if (!Array.isArray(merchants)) {
    throw new Error("Top merchants is not array");
  }
  console.log("[PASSED] Top merchants array");
}