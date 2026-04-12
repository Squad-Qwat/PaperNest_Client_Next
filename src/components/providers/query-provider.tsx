'use client'

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api/utils/error-handler'

export function QueryProvider({ children }: { children: React.ReactNode }) {
	// Create a new QueryClient for each session but reuse it during the session
	const [queryClient] = useState(
		() =>
			new QueryClient({
				queryCache: new QueryCache({
					onError: (error, query) => {
						// Only show toast if explicitly requested via meta or by default
						if (query.meta?.errorMessage !== false) {
							const message = getErrorMessage(error)
							toast.error(message, {
								id: query.queryKey.join('-'), // Prevent duplicate toasts
							})
						}
					},
				}),
				mutationCache: new MutationCache({
					onError: (error, _variables, _context, mutation) => {
						if (mutation.options?.meta?.errorMessage !== false) {
							const message = getErrorMessage(error)
							toast.error(message)
						}
					},
				}),
				defaultOptions: {
					queries: {
						staleTime: 60 * 1000,
						retry: 1,
						refetchOnWindowFocus: false,
					},
				},
			})
	)

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			<ReactQueryDevtools initialIsOpen={false} position="bottom" />
		</QueryClientProvider>
	)
}
