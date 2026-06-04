export function normalizeMerchant(rawMerchant: string): string {
  const merchant = rawMerchant.toLowerCase();

  if (merchant.includes("swiggy")) {
    return "swiggy";
  }

  if (merchant.includes("zomato")) {
    return "zomato";
  }

  if (merchant.includes("netflix")) {
    return "netflix";
  }

  return merchant
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}