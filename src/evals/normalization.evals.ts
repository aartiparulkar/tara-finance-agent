import { normalizeMerchant } from "../ingest/normalizeMerchants";

import { assertEqual } from "./assertions";

export async function runNormalizationEvals() {
  assertEqual(
    normalizeMerchant("SWIGGY*ORDER"),
    "swiggy",
    "Swiggy normalization"
  );

  assertEqual(
    normalizeMerchant("Netflix India"),
    "netflix",
    "Netflix normalization"
  );

  assertEqual(
    normalizeMerchant("Zomato Online"),
    "zomato",
    "Zomato normalization"
  );
}