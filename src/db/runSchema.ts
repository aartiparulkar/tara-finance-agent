import fs from "fs";

import { pool } from "./connection";

async function runSchema() {
  try {
    const schema = fs.readFileSync(
      new URL("./schema.sql", import.meta.url), 
      "utf-8"
    );

    await pool.query(schema);

    console.log("Schema created successfully");

    process.exit(0);

  } catch (error) {
    console.error("Schema creation failed:", error);
    process.exit(1);
  }
}

runSchema();