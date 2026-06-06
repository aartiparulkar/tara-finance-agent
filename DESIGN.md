# Design Notes — Tara Finance Agent

---

## Postgres schema

### `transactions`

```sql
transaction_id   TEXT PRIMARY KEY
transaction_date DATE
amount           NUMERIC(14,2)
category         TEXT
currency         TEXT
merchant_raw     TEXT          -- original string, never modified
merchant_canon   TEXT          -- normalized cluster representative
is_refund        BOOLEAN
is_transfer      BOOLEAN
memo             TEXT
```

`merchant_raw` is immutable — it preserves exactly what came in the JSON. `merchant_canon` is computed at ingest time by the normalization pipeline and is what every query uses. Keeping both means you can always audit what the original data said.

**Indexes:** `merchant_canon`, `transaction_date`, `category`. The date index is the most important — almost every query filters by date range. The category index supports the recurring detection aggregation.

---

### `funds`

```sql
fund_id    TEXT          -- from JSON, e.g. "fund_001"
fund_name  TEXT
nav_date   DATE
nav        NUMERIC(14,4)
PRIMARY KEY (fund_id, nav_date)
UNIQUE (fund_id)          -- required so holdings can reference it
```

One row per fund per NAV date — 24 rows per fund for 24 monthly snapshots. The composite primary key enforces that. `UNIQUE (fund_id)` is needed because the holdings foreign key references `fund_id` alone, and Postgres requires a unique constraint on any foreign key target.

**Indexes:** `fund_name` (for fuzzy name resolution), `nav_date` (for date-range NAV lookups).

---

### `holdings`

```sql
holding_id    TEXT PRIMARY KEY
fund_id       TEXT REFERENCES funds(fund_id)
fund_name     TEXT          -- denormalized for query convenience
units         NUMERIC(14,4)
purchase_nav  NUMERIC(14,4)
purchase_date DATE
```

`fund_name` is intentionally denormalized onto holdings so portfolio queries don't always need a join. The foreign key on `fund_id` ensures every holding points to a real fund.

**Index:** `fund_id` — used by every portfolio join.

---

## Tool design

The agent has three tools. Each tool covers one data domain.

### `transactionAnalyticsTool`

Handles all spending questions. Uses `analysis_type` to route internally:

- `total_spend`, `spend_by_category`, `top_merchants`, `monthly_trend`, `largest_transactions` — pre-aggregated, no params needed
- `spend_by_merchant` — requires `merchant`, runs through `resolveQueryMerchant` first
- `query_transactions` — flexible filter by category + date range, always groups by month
- `compare_categories` — compares two categories month-by-month, computes growth rate in the service layer, auto-detects date range from the data if none provided
- `recurring_merchants` — no params, self-contained SQL detection
- `list_categories` — returns distinct categories so the agent never has to guess category names

One tool with routing beats many narrow tools because it reduces the number of tool definitions in the model's context window, which improves tool selection accuracy.

### `fundAnalyticsTool`

Handles fund NAV history questions.

- `fund_return` — resolves the fund name via `resolveFundName`, then fetches the full NAV history and returns start NAV, end NAV, and return percentage
- `best_funds` — ranks all funds by return using a window function query, returns the spread between best and worst

### `holdingsAnalyticsTool`

Handles portfolio questions.

- `portfolio_value` — joins holdings to the latest NAV per fund, returns per-holding breakdown plus a summary with total invested, total current value, total gain, and total return percentage
- `holdings_performance` — same join, adds per-holding return percentage computed in the service layer

---

## Grounding guarantee

Every number in a Tara response comes from a tool result. The system prompt instructs Tara to never calculate numbers herself — she reads `tool_result` blocks and forms language around them. The tools return pre-computed aggregates from SQL so the model has nothing to calculate.

This is enforced at the architecture level: tools return `{ success: true, data: ... }` or `{ success: false, error: ..., message: ... }`. Tara is instructed to report the `message` honestly on failure rather than fabricating an answer.

---

## Formulas

**Spend:** `SUM(amount) WHERE is_transfer = FALSE AND amount > 0`

**Net spend (after refunds):** `SUM(amount) WHERE is_transfer = FALSE` — negative amounts (refunds) reduce the total naturally. No special refund handling needed beyond not filtering `amount > 0`.

**Merchant matching at ingest:** See normalization pipeline below.

**Recurring detection:** A merchant is recurring if it appears in ≥ 3 distinct months, appears in ≥ 50% of all months in the dataset, has a spend standard deviation less than 50% of its average (consistent amount), and averages ≤ 3 transactions per month (rules out high-frequency merchants like grocery stores).

**Fund period return:** `((end_nav - start_nav) / start_nav) * 100` where `start_nav` and `end_nav` are the earliest and latest NAV values in the funds table for that fund. This is the fund's return, not the user's return.

**Holding realised return:** `((current_nav - purchase_nav) / purchase_nav) * 100` where `current_nav` is the most recent NAV from the funds table and `purchase_nav` is from the holdings row. The absolute gain is `units * (current_nav - purchase_nav)`.

These two are deliberately different. The fund period return is a market metric. The holding realised return is personal — it depends on when the user bought in.

---

## Merchant normalization pipeline

The pipeline runs once at ingest time over all merchant strings in the snapshot. It has no hardcoded merchant names.

**Pass 1 — normalize:** lowercase, strip punctuation and symbols, collapse whitespace.

**Pass 2 — memo extraction:** if the merchant field looks like a reference number (all digits or starts with `UPI/`, `NEFT-`), extract the real merchant name from the memo field using regex patterns for UPI and NEFT formats.

**Pass 3 — abbreviation expansion:** for first tokens shorter than 5 characters, attempt to expand them by finding a longer token in the dataset that the short token is a subsequence of and that starts with the same characters. This handles `amz order` → `amazon order`. Runs before bucketing so expansion feeds into clustering.

**Pass 4 — bucket by trigram key:** group merchants by the first 3 characters of their first word for short words (≤ 6 chars), or by the full first word for longer words. This prevents `zomato` and `zepto` from landing in the same bucket (both start with `z` but `zom` ≠ `zep`).

**Pass 5 — longest common prefix within bucket:** find the LCP across all normalized strings in the bucket. This becomes the canonical name. A guard rejects the LCP if it is shorter than 4 characters or covers less than 40% of the average string length — this stops `state bank of india` and `state street advisors` from collapsing to `state`.

**Pass 6 — fuzzy fallback:** Levenshtein distance ≤ 2 with a length ratio guard (shorter/longer ≥ 0.7) to catch genuine typos missed by LCP. Threshold is 2, not 3, to prevent `zomato`/`zepto` false merges (distance 3).

At query time, `resolveQueryMerchant` additionally handles user input imprecision: exact match → prefix match → subsequence match for short tokens → fuzzy distance ≤ 2. This handles `amz` → `amazon` at query time where ingest-time expansion may not have had enough signal.

---

## Date handling

Relative dates in questions (`"last month"`, `"March"`) are resolved by the model based on the current date injected into the system prompt. Explicit dates are passed as `YYYY-MM-DD` strings to the tools.

When no date range is provided for comparison queries, the service layer queries `MIN(transaction_date)` and `MAX(transaction_date)` from the database and uses those as bounds. This means "compare food vs travel" always uses the full available history rather than failing with a missing parameter error.

The assumption for `"last month"` is the calendar month immediately before today. This is stated to the model in the system prompt.

---

## Evals

Two eval layers:

**Unit evals** (`npm run evals`) test internal functions in isolation — normalization clustering, merchant alias grouping, fund resolver matching, holdings calculations. These run without a server and without an LLM call. They catch regressions in the data pipeline.

**Agent evals** (`npm run eval:agent`) send 14 natural language questions to the live `/ask` endpoint and validate structural properties of the answers — does the answer contain a number, does it mention both categories, does it honestly say "no data" for a future date. Validators check structural facts rather than exact values so they hold across all snapshots including the hidden fourth one.

Coverage: single lookup, date filtering, refunds, merchant aliases, transfer exclusion, category comparison, month-over-month growth, recurring subscriptions, no-data case, fund period return, holding realised return, portfolio value, largest transaction, top merchants.

---

## Observability

Every `/ask` request logs question, answer, number of agent steps, and latency in milliseconds as structured JSON. Tool errors log the error type and sanitized inputs. API keys, model secrets, and raw transaction rows are never logged.

To inspect a failed run: find the request by question text in the logs and read the `steps` count — if steps is 1 and the answer is an apology, the tool call failed before producing data. If steps is > 5 and the answer is still an apology, the agent retried repeatedly, which usually means a category name mismatch or a schema validation error in the tool inputs.

---

## Async milestone

Not implemented. All tools run synchronously. The portfolio value and holdings performance queries are fast enough (sub-200ms on the sample data) that async execution would add complexity without meaningful user experience benefit at this data scale. With a real multi-user dataset containing years of NAV history, the fund return ranking query would be a good candidate for async execution using a job queue.

---

## Failure modes and what I would fix with more time

**Category name mismatch:** The agent resolves category names by calling `list_categories` first, but this adds a round trip. A better approach would be to embed the distinct category list directly in the system prompt at startup so the agent always knows what exists without a tool call.

**Merchant normalization false positives:** The LCP pipeline can still incorrectly cluster merchants that share a long common prefix but are genuinely different (e.g. two different "Reliance" subsidiaries). A human-reviewable alias override file — loaded at ingest time but not hardcoded — would let operators correct specific cases without changing the general algorithm.

**Fund name resolution:** Word overlap scoring works well for partial names but struggles when the user uses a completely different name for the same fund (e.g. "Nifty 50 fund" for a fund named "Sentinel Nifty Index Fund"). Embedding-based similarity would handle this better.

**No multi-user support:** The schema has no `user_id`. Adding it would require changes to every query and the ingest pipeline. The assignment data has no multi-user concept so this was intentionally omitted.

**Deployment cold starts:** Railway free tier sleeps inactive services. The first request after sleep takes ~5 seconds. Pinning the service awake with a scheduled health check ping would eliminate this.