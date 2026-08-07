// Shared API response wrappers (mirrors frontend/src/shared/api/types.ts)
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: ApiErrorResponse | null;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface PageResponse<T> {
  items: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
