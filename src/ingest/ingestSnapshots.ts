import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

import { pool } from "../db/connection.js";
import { transactionSchema } from "./validators.js";
import { buildCanonicalLookup, deriveTransactionFields } from "./derivedFields.js";
import { invalidateCanonCache } from "../utils/merchantResolver.js";
import { invalidateFundCache } from "../utils/fundResolver.js";

dotenv.config();

const snapshotName = process.argv[2] || "sample_a";

const SNAPSHOT_PATH = fileURLToPath(
    new URL(`../../data/${snapshotName}`, import.meta.url)
);

async function ingestMerchantCanonicals(canonicalMap: Map<string, string>): Promise<void> {
  const pairs = [...canonicalMap.entries()].map(([raw, canon]) => ({ raw, canon }));

  if (pairs.length === 0) return;

  const values: string[] = [];
  const placeholders: string[] = [];

  let i = 1;
  for (const { raw, canon } of pairs) {
    placeholders.push(`($${i}, $${i + 1})`);
    values.push(raw, canon);
    i += 2;
  }

  await pool.query(
    `INSERT INTO merchant_canonicals (merchant_raw, merchant_canon)
     VALUES ${placeholders.join(", ")}
     ON CONFLICT (merchant_raw) DO UPDATE
       SET merchant_canon = EXCLUDED.merchant_canon`,
    values
  );

  console.log(`Upserted ${pairs.length} merchant canonical entries.`);
}

async function ingestTransactions() {
  try {
    const transactionsPath = path.join(SNAPSHOT_PATH, "transactions.json");
    const rawData = fs.readFileSync(transactionsPath, "utf-8");
    const transactions = JSON.parse(rawData);

    // Step 1: build the canonical map from all transactions in this snapshot
    console.log("Building merchant canonical map...");
    const canonicalMap = buildCanonicalLookup(transactions);

    // Step 2: persist the raw → canon mappings to merchant_canonicals
    console.log("Populating merchant_canonicals table...");
    await ingestMerchantCanonicals(canonicalMap);

    // Step 3: batch insert all transactions
    console.log("Inserting transactions...");
    const values: unknown[] = [];
    const placeholders: string[] = [];

    let i = 1;
    for (const transaction of transactions) {
      const validated = transactionSchema.parse(transaction);
      const derived = deriveTransactionFields(transaction, canonicalMap);

      placeholders.push(
        `($${i},$${i+1},$${i+2},$${i+3},$${i+4},$${i+5},$${i+6},$${i+7},$${i+8})`
      );
      values.push(
        validated.id,
        validated.date,
        validated.amount,
        validated.category,
        validated.currency,
        validated.merchant,
        derived.merchant_canon,
        derived.is_refund,
        derived.is_transfer
      );
      i += 9;
    }

      await pool.query(
        `INSERT INTO transactions (
          transaction_id,
          transaction_date,
          amount,
          category,
          currency,
          merchant_raw,
          merchant_canon,
          is_refund,
          is_transfer
        )
        VALUES ${placeholders.join(", ")}
        ON CONFLICT (transaction_id) DO NOTHING`,
        values
    );
    console.log(`Inserted ${transactions.length} transactions.`);

    // Step 4: flush the in-memory canon cache
    invalidateCanonCache();

    console.log(`Ingestion complete for snapshot: ${snapshotName}`);

  } catch (error) {
    console.error(`Ingestion failed for snapshot "${snapshotName}":`, error);
    process.exit(1);
  }
}

async function ingestFunds() {
  const fundsPath = path.join(SNAPSHOT_PATH, "funds.json");
  const rawData = fs.readFileSync(fundsPath, "utf-8");
  const funds = JSON.parse(rawData);

  const values: any[] = [];
  const placeholders: string[] = [];
  let i = 1;

  for (const fund of funds) {
    // Each fund has a nav_history array: [{ date: "2023-04-01", nav: 123.45 }, ...]
    for (const navPoint of fund.nav) {
      placeholders.push(`($${i},$${i+1},$${i+2},$${i+3})`);
      values.push(fund.id, fund.name, navPoint.date, navPoint.value);
      i += 4;
    }
  }

  if (placeholders.length === 0) return;

  await pool.query(
    `INSERT INTO funds (fund_id, fund_name, nav_date, nav)
     VALUES ${placeholders.join(",")}
     ON CONFLICT (fund_id, nav_date) DO NOTHING`,
    values
  );

  console.log(`Funds ingested: ${funds.length} funds, ${placeholders.length} NAV points`);
}

async function ingestHoldings() {
  const holdingsPath = path.join(SNAPSHOT_PATH, "holdings.json");
  const rawData = fs.readFileSync(holdingsPath, "utf-8");
  const holdings = JSON.parse(rawData);

  const values: any[] = [];
  const placeholders: string[] = [];
  let i = 1;

  for (const holding of holdings) {
    const holdingId = holding.id ?? uuidv4(); // Generate a UUID if no ID is provided
    placeholders.push(`($${i},$${i+1},$${i+2},$${i+3},$${i+4},$${i+5})`);
    values.push(
      holdingId,
      holding.fund_id,
      holding.fund_name,
      holding.units,
      holding.purchase_nav,
      holding.purchase_date
    );
    i += 6;
  }

  if (placeholders.length === 0) return;

  await pool.query(
    `INSERT INTO holdings (holding_id, fund_id, fund_name, units, purchase_nav, purchase_date)
     VALUES ${placeholders.join(",")}
     ON CONFLICT (holding_id) DO NOTHING`,
    values
  );

  console.log(`Holdings ingested: ${holdings.length} holdings`);
}

async function main() {
  await ingestTransactions();
  await ingestFunds();
  await ingestHoldings(); 

  invalidateCanonCache();
  invalidateFundCache();
  console.log(`Snapshot ${snapshotName} ingested successfully`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Ingestion failed:", error);
  process.exit(1);
});