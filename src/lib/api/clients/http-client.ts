/**
 * HTTP Client - Base layer for making HTTP requests
 * Handles timeouts, retries, and response parsing
 */

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retry?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class HttpClient {
  private baseURL: string;
  private defaultHeaders: HeadersInit;
  private timeout: number;

  constructor(baseURL: string, timeout = 10000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Fetch with timeout support using AbortController
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Handle and parse API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: any = {};
      
      try {
        errorData = await response.json();
      } catch {
        // If response is not JSON, use status text
        throw new ApiError(
          response.statusText || 'An error occurred',
          response.status
        );
      }

      // Backend error format: { success: false, error: string, errors?: [] }
      throw new ApiError(
        errorData.error || errorData.message || 'An error occurred',
        response.status,
        errorData.errors
      );
    }

    // Parse JSON response
    const data = await response.json();
    
    // Backend success format: { success: true, data: {...}, message?: string }
    return data.data ?? data;
  }

  /**
   * Make HTTP request
   */
  async request<T>(
    endpoint: string,
    options: RequestConfig = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const { timeout, retry, ...fetchOptions } = options;

    const config: RequestInit = {
      ...fetchOptions,
      headers: {
        ...this.defaultHeaders,
        ...fetchOptions.headers,
      },
    };

    const response = await this.fetchWithTimeout(url, config);
    return this.handleResponse<T>(response);
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Remove authentication token
   */
  removeAuthToken(): void {
    const { Authorization, ...rest } = this.defaultHeaders as any;
    this.defaultHeaders = rest;
  }

  /**
   * Get current headers
   */
  getHeaders(): HeadersInit {
    return this.defaultHeaders;
  }
}
