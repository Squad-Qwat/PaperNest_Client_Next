/**
 * Centralized error handling utilities
 */

import { ApiError } from '../clients/http-client';

export interface ErrorResponse {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

/**
 * Parse error object into user-friendly message
 */
export function parseError(error: unknown): ErrorResponse {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      status: error.status,
      errors: error.errors,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      status: 500,
    };
  }

  return {
    message: 'An unexpected error occurred',
    status: 500,
  };
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  const parsed = parseError(error);
  
  // If there are validation errors, return the first one
  if (parsed.errors) {
    const firstError = Object.values(parsed.errors)[0];
    if (firstError && firstError.length > 0) {
      return firstError[0];
    }
  }

  return parsed.message;
}

/**
 * Check if error is a specific status code
 */
export function isErrorStatus(error: unknown, status: number): boolean {
  const parsed = parseError(error);
  return parsed.status === status;
}

/**
 * Check if error is authentication related
 */
export function isAuthError(error: unknown): boolean {
  return isErrorStatus(error, 401) || isErrorStatus(error, 403);
}

/**
 * Check if error is validation error
 */
export function isValidationError(error: unknown): boolean {
  return isErrorStatus(error, 422) || isErrorStatus(error, 400);
}
