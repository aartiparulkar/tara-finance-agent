export function assertEqual(
  actual: unknown,
  expected: unknown,
  testName: string
) {

  if (actual !== expected) {
    throw new Error(
      `
[FAILED] ${testName}

Expected:
${expected}

Received:
${actual}
      `
    );
  }

  console.log(
    `[PASSED] ${testName}`
  );
}