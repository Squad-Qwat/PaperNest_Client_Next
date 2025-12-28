/**
 * Query parameter builder utilities
 */

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

/**
 * Build URL query string from object
 * @param params - Query parameters object
 * @returns Query string (e.g., "?key=value&key2=value2")
 */
export function buildQueryString(params?: QueryParams): string {
  if (!params) return '';

  const filteredParams: Record<string, string> = {};

  // Filter out undefined and null values
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      filteredParams[key] = String(value);
    }
  });

  const queryString = new URLSearchParams(filteredParams).toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Append query string to endpoint
 * @param endpoint - Base endpoint
 * @param params - Query parameters
 * @returns Endpoint with query string
 */
export function withQuery(endpoint: string, params?: QueryParams): string {
  const queryString = buildQueryString(params);
  return `${endpoint}${queryString}`;
}
