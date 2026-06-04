export function detectRefund(amount: number): boolean {
  return amount < 0;
}