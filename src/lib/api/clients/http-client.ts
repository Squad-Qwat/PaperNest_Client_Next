export interface RequestConfig extends RequestInit {
	timeout?: number
	retry?: number
}

export class ApiError extends Error {
	constructor(
		public message: string,
		public status: number,
		public errors?: Record<string, string[]>
	) {
		super(message)
		this.name = 'ApiError'
	}
}

export class HttpClient {
	protected baseURL: string
	protected defaultHeaders: HeadersInit
	protected timeout: number

	constructor(baseURL: string, timeout = 10000) {
		this.baseURL = baseURL
		this.timeout = timeout
		this.defaultHeaders = {
			'Content-Type': 'application/json',
			'ngrok-skip-browser-warning': 'true',
		}
	}

	private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), this.timeout)

		try {
			return await fetch(url, {
				...options,
				signal: controller.signal,
			})
		} catch (error) {
			if ((error as Error).name === 'AbortError') {
				throw new ApiError('Request timeout', 408)
			}
			throw error
		} finally {
			clearTimeout(timeoutId)
		}
	}

	protected async handleResponse<T>(response: Response): Promise<T> {
		if (!response.ok) {
			let errorData: any = {}
			try {
				errorData = await response.json()
			} catch {
				throw new ApiError(response.statusText || 'An error occurred', response.status)
			}

			const apiError = new ApiError(
				errorData.error || errorData.message || 'An error occurred',
				response.status,
				errorData.errors
			)
			throw apiError
		}

		if (response.status === 204) return {} as T

		try {
			const data = await response.json()
			return data.data ?? data
		} catch {
			return {} as T
		}
	}

	async request<T>(endpoint: string, options: RequestConfig = {}): Promise<T> {
		const url = `${this.baseURL}${endpoint}`
		const { timeout: _timeout, retry: _retry, ...fetchOptions } = options

		const config: RequestInit = {
			...fetchOptions,
			headers: {
				...this.defaultHeaders,
				...fetchOptions.headers,
			},
		}

		const response = await this.fetchWithTimeout(url, config)
		return this.handleResponse<T>(response)
	}

	setAuthToken(token: string): void {
		this.defaultHeaders = {
			...this.defaultHeaders,
			Authorization: `Bearer ${token}`,
		}
	}

	removeAuthToken(): void {
		const { Authorization: _Authorization, ...rest } = this.defaultHeaders as any
		this.defaultHeaders = rest
	}

	getHeaders(): HeadersInit {
		return this.defaultHeaders
	}
}
