export interface ToolSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ToolErrorResponse {
  success: false;
  error: string;
  message: string;
}

export type ToolResponse<T> = | ToolSuccessResponse<T> | ToolErrorResponse;