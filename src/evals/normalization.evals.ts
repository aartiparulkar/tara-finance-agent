import { buildMerchantCanonicals } from "../ingest/normalizeMerchants.js";
import { assertEqual } from "./assertions.js";

function buildMap(merchants: { merchant: string; memo?: string }[]) {
  return buildMerchantCanonicals(merchants);
}

export async function runNormalizationEvals() {
  // ── Swiggy variants ──────────────────────────────────────────────────────
  const swiggyMap = buildMap([
    { merchant: "Swiggy" },
    { merchant: "SWIGGY*ORDER" },
    { merchant: "Swiggy Instamart" },
    { merchant: "SWIGGY BANGALORE" },
  ]);

  const swiggyCanon = swiggyMap.get("Swiggy");
  assertEqual(swiggyMap.get("SWIGGY*ORDER"), swiggyCanon, "SWIGGY*ORDER clusters with Swiggy");
  assertEqual(swiggyMap.get("Swiggy Instamart"), swiggyCanon, "Swiggy Instamart clusters with Swiggy");
  assertEqual(swiggyMap.get("SWIGGY BANGALORE"), swiggyCanon, "SWIGGY BANGALORE clusters with Swiggy");

  // ── Zomato and Zepto must NOT merge ──────────────────────────────────────
  const zMap = buildMap([
    { merchant: "Zomato" },
    { merchant: "Zomato Online" },
    { merchant: "Zepto" },
    { merchant: "Zepto Grocery" },
  ]);

  const zomatoCanon = zMap.get("Zomato");
  const zeptoCanon  = zMap.get("Zepto");

  assertEqual(zMap.get("Zomato Online"), zomatoCanon, "Zomato Online clusters with Zomato");
  assertEqual(zMap.get("Zepto Grocery"), zeptoCanon, "Zepto Grocery clusters with Zepto");

  // The critical assertion — these must be different canons
  assertEqual(
    zomatoCanon !== zeptoCanon,
    true,
    "Zomato and Zepto are separate canons"
  );

  // ── Multi-word brand names ────────────────────────────────────────────────
  const coffeeMap = buildMap([
    { merchant: "Third Wave Coffee" },
    { merchant: "Third Wave Coffee Roasters Koramangala" },
    { merchant: "Third Wave Coffee HSR" },
  ]);

  const coffeeCanon = coffeeMap.get("Third Wave Coffee");
  assertEqual(coffeeMap.get("Third Wave Coffee Roasters Koramangala"), coffeeCanon, "Third Wave Coffee Koramangala clusters");
  assertEqual(coffeeMap.get("Third Wave Coffee HSR"), coffeeCanon, "Third Wave Coffee HSR clusters");

  // ── UPI memo extraction ───────────────────────────────────────────────────
  const upiMap = buildMap([
    { merchant: "571548185986", memo: "UPI/571548185986/SWIGGY/swiggy@ybl" },
    { merchant: "Swiggy" },
  ]);

  assertEqual(
    upiMap.get("571548185986"),
    upiMap.get("Swiggy"),
    "UPI ref number resolves to Swiggy via memo"
  );

  // ── NEFT memo extraction ──────────────────────────────────────────────────
  const neftMap = buildMap([
    { merchant: "NEFT-HDFC-AMAZON SELLER", memo: "NEFT-HDFC-AMAZON SELLER" },
    { merchant: "Amazon" },
  ]);

  assertEqual(
    neftMap.get("NEFT-HDFC-AMAZON SELLER"),
    neftMap.get("Amazon"),
    "NEFT ref resolves to Amazon via memo"
  );

  // ── Short abbreviation via fuzzy ──────────────────────────────────────────
  const amzMap = buildMap([
    { merchant: "Amazon" },
    { merchant: "Amazon Seller Services" },
    { merchant: "AMAZON BANGALORE" },
  ]);

  const amazonCanon = amzMap.get("Amazon");
  assertEqual(amzMap.get("Amazon Seller Services"), amazonCanon, "Amazon Seller Services clusters with Amazon");
  assertEqual(amzMap.get("AMAZON BANGALORE"), amazonCanon, "AMAZON BANGALORE clusters with Amazon");


  // ── Single-occurrence merchant stays as its own canon ────────────────────
  const soloMap = buildMap([{ merchant: "Atria Convergence Technologies" }]);
  assertEqual(
    typeof soloMap.get("Atria Convergence Technologies") === "string",
    true,
    "Solo merchant gets a canon without crashing"
  );

  // ── Ola and 1mg must NOT merge ────────────────────────────────────────────
  const olaMap = buildMap([
    { merchant: "Ola" },
    { merchant: "Ola Cabs" },
    { merchant: "1mg" },
    { merchant: "1mg Pharmacy" },
  ]);

  assertEqual(olaMap.get("Ola Cabs"), olaMap.get("Ola"), "Ola Cabs clusters with Ola");
  assertEqual(olaMap.get("1mg Pharmacy"), olaMap.get("1mg"), "1mg Pharmacy clusters with 1mg");
  assertEqual(
    olaMap.get("Ola") !== olaMap.get("1mg"),
    true,
    "Ola and 1mg are separate canons"
  );
}