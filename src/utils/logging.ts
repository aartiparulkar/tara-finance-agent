export function logInfo(message: string, metadata?: unknown) {
  console.log(
    JSON.stringify({
      level: "info",
      message,
      metadata,
      timestamp:
        new Date().toISOString()
    })
  );
}

export function logError(message: string, error?: unknown) {
  console.error(
    JSON.stringify({
      level: "error",
      message,
      error,
      timestamp:
        new Date().toISOString()
    })
  );
}