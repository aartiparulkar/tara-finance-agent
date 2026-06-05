export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;

  constructor(
    message: string,
    statusCode = 500,
    errorCode = "INTERNAL_ERROR"
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}