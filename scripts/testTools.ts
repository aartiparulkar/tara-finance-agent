import { transactionAnalyticsTool } from "../src/tools/transactionAnalyticsTool";

import { fundAnalyticsTool } from "../src/tools/fundAnalyticsTool";

import { holdingsAnalyticsTool } from "../src/tools/holdingsAnalyticsTool";

async function run() {
  console.log(await transactionAnalyticsTool({analysis_type: "total_spend"}));

  console.log(await transactionAnalyticsTool({analysis_type: "top_merchants"}));

  console.log(await holdingsAnalyticsTool({analysis_type:"portfolio_value"}));

  console.log(await fundAnalyticsTool({
      analysis_type: "fund_return",
      fund_name: "Axis Bluechip Fund"
    })
  );

//   Invalid test cases
  console.log(await transactionAnalyticsTool({analysis_type: "banana"}));

  console.log(await fundAnalyticsTool({
      analysis_type: "fund_return"
    })
  );
}

run();