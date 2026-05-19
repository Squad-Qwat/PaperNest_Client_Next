const inFlightRequests = new Map<string, Promise<any>>()

export const RequestDeduplicator = {
	async deduplicate<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
		if (inFlightRequests.has(key)) {
			console.log(`♻️ [RequestDeduplicator] Reusing in-flight request: ${key}`)
			return inFlightRequests.get(key) as Promise<T>
		}

		const promise = fetcher().finally(() => {
			inFlightRequests.delete(key)
		})

		inFlightRequests.set(key, promise)
		return promise
	},
}
