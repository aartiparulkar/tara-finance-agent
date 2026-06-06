import {runNormalizationEvals} from "./normalization.evals";
import {runTransactionEvals} from "./transactions.evals";
import {runFundEvals} from "./funds.evals";
import {runHoldingsEvals} from "./holdings.evals";
import {runRegressionEvals} from "./regression.evals";
import { runResolverEvals } from "./resolver.evals";


async function runAllEvals() {
  try {
    console.log("\nRunning normalization evals...");
    await runNormalizationEvals();

    console.log("\nRunning transaction evals...");
    await runTransactionEvals();

    // console.log("\nRunning resolver evals...");
    // await runResolverEvals();

    console.log("\nRunning fund evals...");
    await runFundEvals();

    console.log("\nRunning holdings evals...");
    await runHoldingsEvals();

    console.log("\nRunning regression evals...");
    await runRegressionEvals();

    console.log("\nALL EVALS PASSED");
    process.exit(0);

  } catch (error) {
    console.error(
      "\nEVAL FAILURE:",
      error
    );

    process.exit(1);
  }
}

runAllEvals();