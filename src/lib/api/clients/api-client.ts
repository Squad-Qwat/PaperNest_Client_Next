/**
 * API Client - Wrapper around HTTP client with REST methods
 * Provides GET, POST, PUT, PATCH, DELETE methods
 */

import { API_CONFIG } from '../config'
import { HttpClient } from './http-client'

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
			cache: cache || 'no-store',
			next: { revalidate: 0 }, // Disable cache by default for real-time updates
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				Pragma: 'no-cache',
				Expires: '0',
			},
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
