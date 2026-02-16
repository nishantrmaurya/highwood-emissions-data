import { ApiError } from "@/app/lib/api/ApiError";
import { UI_LABELS } from "@/app/lib/constants/labels";

export interface DialogErrorState {
  message: string;
  details?: string;
}

export function formatErrorForDialog(
  error: unknown,
  fallbackMessage = UI_LABELS.common.unexpectedError,
): DialogErrorState {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      details: error.details
        ? JSON.stringify(error.details, null, 2)
        : undefined,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: fallbackMessage };
}
