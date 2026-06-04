import {
  getTotalSpend,
  getTopMerchants,
  getMonthlySpendTrend,
  getSpendByCategory,
  getLargestTransactions
} from "../src/services/transactionService";

async function run() {
  console.log(await getTotalSpend());
  console.log(await getTopMerchants());
  console.log(await getSpendByCategory());
  console.log(await getMonthlySpendTrend());
  console.log(await getLargestTransactions());

}

run();