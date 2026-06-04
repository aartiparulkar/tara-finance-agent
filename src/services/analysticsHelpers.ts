export function calculatePercentageChange(
  oldValue: number,
  newValue: number
): number {

  if (oldValue === 0) {
    return 0;
  }

  return ((newValue - oldValue) / oldValue) * 100;
}

