import dotenv from "dotenv";
dotenv.config();

const BASE_URL = process.env.EVAL_URL ?? "http://localhost:3000";

interface EvalCase {
  question:    string;
  description: string;
  validate:    (answer: string) => boolean;
}

async function ask(question: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/ask`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ question }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json() as any;
  return (json.answer ?? json.response ?? "").toLowerCase();
}

function contains(...terms: string[]) {
  return (answer: string) => terms.some((t) => answer.includes(t.toLowerCase()));
}

function containsNumber(answer: string) {
  return /[\d,]+(\.\d+)?/.test(answer);
}

function notContains(...terms: string[]) {
  return (answer: string) => !terms.some((t) => answer.includes(t.toLowerCase()));
}

// ── Eval cases ───────────────────────────────────────────────────────────────

const EVALS: EvalCase[] = [
  // 1. Single lookup
  {
    description: "Total spend returns a number",
    question:    "What is my total spending?",
    validate:    containsNumber,
  },

  // 2. Date filtering
  {
    description: "Spend in March 2025 returns a number",
    question:    "How much did I spend in March 2025?",
    validate:    containsNumber,
  },

  // 3. Refunds
  {
    description: "Refund handling — mentions refund or net or adjustment",
    question:    "How much did I spend on food in March 2025 after refunds?",
    validate:    contains("refund", "net", "after", "adjusted", "₹", "inr"),
  },

  // 4. Merchant alias
  {
    description: "Swiggy alias — aggregates all Swiggy variants",
    question:    "How much did I spend on Swiggy in total?",
    validate:    (answer) =>
      containsNumber(answer) && contains("swiggy")(answer),
  },

  // 5. Transfers excluded
  {
    description: "Transfers excluded from total spend",
    question:    "What is my total actual spending excluding transfers?",
    validate:    (answer) =>
      containsNumber(answer) &&
      notContains("transfer not found", "no data")(answer),
  },

  // 6. Category comparison
  {
    description: "Food vs travel comparison mentions both categories",
    question:    "Compare my spending on food versus travel. Which grew faster?",
    validate:    (answer) =>
      contains("food")(answer) && contains("travel")(answer),
  },

  // 7. Month over month
  {
    description: "Food spending feb to march returns a comparison",
    question:    "Did my food spending increase from February to March 2025?",
    validate:    (answer) =>
      contains("february", "feb")(answer) &&
      contains("march", "mar")(answer) &&
      containsNumber(answer),
  },

  // 8. Recurring subscriptions
  {
    description: "Recurring merchants returns subscription-like merchants",
    question:    "Which merchants look like recurring subscriptions?",
    validate:    (answer) =>
      // Should mention at least one known subscription-type service
      contains(
        "netflix", "spotify", "amazon prime", "youtube", "apple",
        "hotstar", "zee5", "rent", "insurance", "emi"
      )(answer),
  },

  // 9. No-data case
  {
    description: "No data case — honest response for future date",
    question:    "How much did I spend on groceries in December 2099?",
    validate:    contains(
      "no data", "no transactions", "no spending", "couldn't find",
      "not found", "don't have", "no records", "unavailable", "no grocery"
    ),
  },

  // 10. Fund period return
  {
    description: "Fund period return returns a percentage",
    question:    "What is the return of my best performing fund?",
    validate:    (answer) =>
      containsNumber(answer) && contains("%", "percent", "return")(answer),
  },

  // 11. Realised return on holding
  {
    description: "Realised return on holdings returns gain/loss",
    question:    "What is my realised return on my holdings given when I bought them?",
    validate:    (answer) =>
      containsNumber(answer) &&
      contains("return", "gain", "profit", "loss", "invested", "current")(answer),
  },

  // 12. Portfolio value
  {
    description: "Portfolio value returns a rupee amount",
    question:    "What is my portfolio worth today?",
    validate:    (answer) =>
      containsNumber(answer) &&
      contains("portfolio", "worth", "value", "current", "₹", "inr", "fund")(answer),
  },

  // 13. Largest transaction
  {
    description: "Largest transaction returns a merchant and amount",
    question:    "What was my single biggest expense?",
    validate:    (answer) => containsNumber(answer),
  },

  // 14. Top merchants
  {
    description: "Top merchants returns a list",
    question:    "Who are my top 5 merchants by spending?",
    validate:    (answer) => containsNumber(answer),
  },
];

// ── Runner ───────────────────────────────────────────────────────────────────

async function runEvals() {
  console.log(`\nRunning ${EVALS.length} agent evals against ${BASE_URL}\n`);
  console.log("─".repeat(60));

  const failed: { description: string; question: string; answer: string }[] = [];
  let passed = 0;

  for (const evalCase of EVALS) {
    try {
      const answer = await ask(evalCase.question);
      const ok = evalCase.validate(answer);

      if (ok) {
        passed++;
        console.log(`✓  ${evalCase.description}`);
      } else {
        failed.push({
          description: evalCase.description,
          question:    evalCase.question,
          answer,
        });
        console.log(`✗  ${evalCase.description}`);
      }
    } catch (err) {
      failed.push({
        description: evalCase.description,
        question:    evalCase.question,
        answer:      `ERROR: ${err instanceof Error ? err.message : String(err)}`,
      });
      console.log(`✗  ${evalCase.description} (request failed)`);
    }

    // Small delay between requests to avoid hammering the server
    await new Promise((r) => setTimeout(r, 500));
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  console.log("\n" + "─".repeat(60));
  console.log(`\nResults: ${passed} passed, ${failed.length} failed out of ${EVALS.length}\n`);

  if (failed.length > 0) {
    console.log("Failed cases:");
    console.log("─".repeat(60));
    for (const f of failed) {
      console.log(`\n[FAILED] ${f.description}`);
      console.log(`Question: ${f.question}`);
      console.log(`Answer:   ${f.answer.slice(0, 200)}${f.answer.length > 200 ? "..." : ""}`);
    }
  }

  console.log("\n" + "─".repeat(60));
  process.exit(failed.length > 0 ? 1 : 0);
}

runEvals().catch((err) => {
  console.error("Eval runner crashed:", err);
  process.exit(1);
});