import { transactionAnalyticsTool } from "../src/tools/transactionAnalyticsTool";
import { fundAnalyticsTool } from "../src/tools/fundAnalyticsTool";
import { holdingsAnalyticsTool } from "../src/tools/holdingsAnalyticsTool";

async function run() {
  console.log(
  await transactionAnalyticsTool.execute?.({
    context: {
      analysis_type: "total_spend"
    }
  } as any)
);

  console.log(await transactionAnalyticsTool.execute?.({
    context: {
      analysis_type: "top_merchants"
    }
  } as any));

  console.log(await holdingsAnalyticsTool.execute?.({
    context: {
      analysis_type:"portfolio_value"}
  } as any));

  console.log(await fundAnalyticsTool.execute?.({
    context: {
      analysis_type: "fund_return",
      fund_name: "Axis Bluechip Fund"
    }
  } as any));


//   Invalid test cases
  console.log(await transactionAnalyticsTool.execute?.({
    context: {
      analysis_type: "banana"
    }
  } as any));

  console.log(await fundAnalyticsTool.execute?.({
    context: {
      analysis_type: "fund_return"
    }
  } as any));
}

run();