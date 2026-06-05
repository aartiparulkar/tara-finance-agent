import { normalizeMerchant } from "./normalizeMerchants.js";

import { detectRefund } from "./detectRefunds.js";
import { detectTransfer } from "./detectTransfers.js";

export function deriveTransactionFields(transaction: any) {
  return {
    merchant_normalized: normalizeMerchant(transaction.merchant),
    is_refund: detectRefund(transaction.amount),
    is_transfer: detectTransfer(transaction.category)
  };
}