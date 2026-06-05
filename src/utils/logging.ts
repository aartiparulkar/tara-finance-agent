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