import { buildMerchantCanonicals } from "./normalizeMerchants.js";
import { detectRefund } from "./detectRefunds.js";
import { detectTransfer } from "./detectTransfers.js";


export function buildCanonicalLookup(
  transactions: { merchant: string; memo?: string }[]
): Map<string, string> {
  return buildMerchantCanonicals(transactions);
}

export function deriveTransactionFields(
  transaction: any,
  canonicalMap: Map<string, string>
) {
  return {
    merchant_raw: transaction.merchant,
    merchant_canon: canonicalMap.get(transaction.merchant) ?? transaction.merchant.toLowerCase().trim(),
    is_refund: detectRefund(transaction.amount),
    is_transfer: detectTransfer(transaction.category),
  };
}