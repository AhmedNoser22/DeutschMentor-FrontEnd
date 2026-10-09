import { HttpErrorResponse } from '@angular/common/http';

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as Partial<ApiError> | null;
    if (body && typeof body.code === 'string' && typeof body.message === 'string') {
      return { code: body.code, message: body.message, status: error.status };
    }
    if (error.status === 0) {
      return { code: 'network_error', message: 'Cannot reach the server. Check your connection.', status: 0 };
    }
    if (error.status === 429) {
      return { code: 'rate_limited', message: 'Too many requests. Please wait a moment.', status: 429 };
    }
  }
  return { code: 'unknown', message: 'Something went wrong. Try again.', status: 500 };
}