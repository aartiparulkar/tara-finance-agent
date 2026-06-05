import fs from "fs";

import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

import { pool } from "../db/connection.js";
import { transactionSchema } from "./validators.js";
import { deriveTransactionFields } from "./derivedFields.js";

dotenv.config();

const snapshotName = process.argv[2] || "sample_a";

const SNAPSHOT_PATH = fileURLToPath(
    new URL(`../../data/${snapshotName}`, import.meta.url)
);

async function ingestTransactions() {
  try {
    const transactionsPath = path.join(
      SNAPSHOT_PATH,
      "transactions.json"
    );

    const rawData = fs.readFileSync(
      transactionsPath,
      "utf-8"
    );

    const transactions = JSON.parse(rawData);

    console.log(transactions);
    console.log(transactions[0]);

    for (const transaction of transactions) {
      const validated = transactionSchema.parse(transaction);
      const derived = deriveTransactionFields(transaction);

      await pool.query(
        `
        INSERT INTO transactions (
          transaction_id,
          transaction_date,
          amount,
          category,
          currency,
          merchant_raw,
          merchant_normalized,
          is_refund,
          is_transfer
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8, $9)
        `,
        [
          validated.id,
          validated.date,
          validated.amount,
          validated.category,
          validated.currency,
          validated.merchant,

          derived.merchant_normalized,
          derived.is_refund,
          derived.is_transfer
        ]
      );
    }

    console.log("Transactions ingested successfully");
    process.exit(0);

  } catch (error) {
    console.error("Ingestion failed:", error);
    process.exit(1);
  }
}

ingestTransactions();