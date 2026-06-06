import { resolveQueryMerchant, invalidateCanonCache } from "../utils/merchantResolver.js";
import { pool } from "../db/connection.js";
import { assertEqual } from "./assertions.js";

export async function runResolverEvals() {
  await pool.query(`
    INSERT INTO transactions (transaction_id, transaction_date, amount, category, currency, merchant_raw, merchant_canon, is_refund, is_transfer)
    VALUES
      ('eval-1', '2025-01-01', 100, 'shopping', 'INR', 'Amazon', 'amazon', false, false),
      ('eval-2', '2025-01-01', 200, 'food',     'INR', 'Swiggy', 'swiggy', false, false),
      ('eval-3', '2025-01-01', 300, 'food',     'INR', 'Zomato', 'zomato', false, false),
      ('eval-4', '2025-01-01', 400, 'grocery',  'INR', 'Zepto',  'zepto',  false, false)
    ON CONFLICT (transaction_id) DO NOTHING
  `);

  invalidateCanonCache();

  // Abbreviation — handled at query time
  assertEqual(await resolveQueryMerchant("amz"),       "amazon", "amz resolves to amazon");
  assertEqual(await resolveQueryMerchant("amz order"), "amazon", "amz order resolves to amazon");

  // Typo
  assertEqual(await resolveQueryMerchant("swiggi"),    "swiggy", "swiggi typo resolves to swiggy");

  // Exact match passthrough
  assertEqual(await resolveQueryMerchant("zomato"),    "zomato", "zomato exact match");

  // Zepto must NOT resolve to zomato
  assertEqual(await resolveQueryMerchant("zepto"),     "zepto",  "zepto resolves to zepto not zomato");

  // Cleanup
  await pool.query(`DELETE FROM transactions WHERE transaction_id LIKE 'eval-%'`);
  invalidateCanonCache();
}