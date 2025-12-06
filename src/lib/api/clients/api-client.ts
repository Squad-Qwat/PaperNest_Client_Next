/**
 * API Client - Wrapper around HTTP client with REST methods
 * Provides GET, POST, PUT, PATCH, DELETE methods
 */

import { HttpClient } from './http-client'
import { API_CONFIG } from '../config'

class ApiClient extends HttpClient {
	constructor() {
		super(API_CONFIG.baseURL, API_CONFIG.timeout)
	}

	/**
	 * GET request
	 * @param endpoint - API endpoint
	 * @param cache - Next.js cache strategy
	 */
	async get<T>(endpoint: string, cache?: RequestCache): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'GET',
			cache: cache || 'default',
			next: { revalidate: 3600 }, // Revalidate every hour by default
		})
	}

	/**
	 * POST request
	 * @param endpoint - API endpoint
	 * @param data - Request body
	 */
	async post<T>(endpoint: string, data?: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'POST',
			body: data ? JSON.stringify(data) : undefined,
			cache: 'no-store', // Don't cache POST requests
		})
	}

	/**
	 * PUT request
	 * @param endpoint - API endpoint
	 * @param data - Request body
	 */
	async put<T>(endpoint: string, data: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'PUT',
			body: JSON.stringify(data),
			cache: 'no-store',
		})
	}

	/**
	 * PATCH request
	 * @param endpoint - API endpoint
	 * @param data - Request body
	 */
	async patch<T>(endpoint: string, data: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'PATCH',
			body: JSON.stringify(data),
			cache: 'no-store',
		})
	}

	/**
	 * DELETE request
	 * @param endpoint - API endpoint
	 */
	async delete<T>(endpoint: string): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'DELETE',
			cache: 'no-store',
		})
	}
}

// Export singleton instance
export const apiClient = new ApiClient()
