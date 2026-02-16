import { ApiError } from "@/app/lib/api/ApiError";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/app/lib/api/types";

const API_BASE_URL = "/api";

export abstract class ApiClient {
  protected readonly baseUrl: string;

  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  protected async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  protected async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (!response.ok) {
      if (isJson) {
        const errorBody = (await response.json()) as ApiErrorResponse;
        throw new ApiError(
          errorBody.message || "Request failed",
          response.status,
          errorBody.details,
        );
      }

      const text = await response.text();
      throw new ApiError(text || "Request failed", response.status);
    }

    if (!isJson) {
      throw new ApiError("Invalid API response format", response.status);
    }

    const payload = (await response.json()) as ApiSuccessResponse<T>;
    return payload.data;
  }
}
