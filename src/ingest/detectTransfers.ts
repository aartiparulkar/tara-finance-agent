export function detectTransfer(category: string): boolean {
  return category.toLowerCase() === "transfer";
}