import { normalizeMerchant } from "./normalizeMerchants";

import { detectRefund } from "./detectRefunds";
import { detectTransfer } from "./detectTransfers";

export function deriveTransactionFields(transaction: any) {
  return {
    merchant_normalized: normalizeMerchant(transaction.merchant),
    is_refund: detectRefund(transaction.amount),
    is_transfer: detectTransfer(transaction.category)
  };
}