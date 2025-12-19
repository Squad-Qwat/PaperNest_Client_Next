/**
 * Common API Types
 * Shared types used across all API endpoints
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  errors?: Record<string, string[]>;
}

/**
 * Request configuration
 */
export interface RequestConfig extends RequestInit {
  timeout?: number;
  retry?: number;
}
