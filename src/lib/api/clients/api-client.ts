import { useAuthStore } from '@/lib/store/auth-store'
import { API_CONFIG } from '../config'
import { ApiError, HttpClient } from './http-client'

class ApiClient extends HttpClient {
	private isRefreshing = false
	private refreshSubscribers: ((token: string) => void)[] = []

	constructor() {
		super(API_CONFIG.baseURL, API_CONFIG.timeout)
	}

	private onRefreshed(token: string) {
		this.refreshSubscribers.forEach((callback) => {
			callback(token)
		})
		this.refreshSubscribers = []
	}

	private addRefreshSubscriber(callback: (token: string) => void) {
		this.refreshSubscribers.push(callback)
	}

	async request<T>(endpoint: string, options: any = {}): Promise<T> {
		try {
			return await super.request<T>(endpoint, options)
		} catch (error) {
			if (error instanceof ApiError && error.status === 401 && endpoint !== '/auth/refresh') {
				return this.handle401<T>(endpoint, options)
			}
			throw error
		}
	}

	private async handle401<T>(endpoint: string, options: any): Promise<T> {
		const { refreshToken, setAccessToken, clearAuth } = useAuthStore.getState()

		if (!refreshToken) {
			clearAuth()
			throw new ApiError('Unauthorized', 401)
		}

		if (!this.isRefreshing) {
			this.isRefreshing = true
			try {
				const response = await fetch(`${API_CONFIG.baseURL}/auth/refresh`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ refreshToken }),
				})

				if (!response.ok) throw new Error('Refresh failed')

				const data = await response.json()
				const newToken = data.data.token || data.data.accessToken

				setAccessToken(newToken)
				this.setAuthToken(newToken)
				this.onRefreshed(newToken)

				return await super.request<T>(endpoint, options)
			} catch (err) {
				clearAuth()
				throw err
			} finally {
				this.isRefreshing = false
			}
		}

		return new Promise((resolve) => {
			this.addRefreshSubscriber((token: string) => {
				options.headers = {
					...options.headers,
					Authorization: `Bearer ${token}`,
				}
				resolve(super.request<T>(endpoint, options))
			})
		})
	}

	async get<T>(endpoint: string, cache?: RequestCache): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'GET',
			cache: cache || 'no-store',
		})
	}

	async post<T>(endpoint: string, data?: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'POST',
			body: data ? JSON.stringify(data) : undefined,
		})
	}

	async put<T>(endpoint: string, data: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'PUT',
			body: JSON.stringify(data),
		})
	}

	async patch<T>(endpoint: string, data: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'PATCH',
			body: JSON.stringify(data),
		})
	}

	async delete<T>(endpoint: string): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'DELETE',
		})
	}
}

export const apiClient = new ApiClient()
