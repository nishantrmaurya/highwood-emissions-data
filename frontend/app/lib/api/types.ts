export interface ApiSuccessResponse<T> {
  status: "success";
  data: T;
}

export interface ApiErrorResponse {
  status: "error";
  message: string;
  details?: unknown;
}
