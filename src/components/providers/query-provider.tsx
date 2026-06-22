'use client'

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { toast } from 'sonner'
import { getErrorMessage, isAuthError } from '@/lib/api/utils/error-handler'
import { useAuthStore } from '@/lib/store/auth-store'

export function QueryProvider({ children }: { children: React.ReactNode }) {
	// Create a new QueryClient for each session but reuse it during the session
	const [queryClient] = useState(
		() =>
			new QueryClient({
				queryCache: new QueryCache({
					onError: (error, query) => {
						// Skip unauthorized errors if the user is not authenticated
						const isAuthenticated = useAuthStore.getState().isAuthenticated
						if (isAuthError(error) && !isAuthenticated) {
							return
						}

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
						// Skip unauthorized errors if the user is not authenticated
						const isAuthenticated = useAuthStore.getState().isAuthenticated
						if (isAuthError(error) && !isAuthenticated) {
							return
						}

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
			<ReactQueryDevtools initialIsOpen={false} position='bottom' />
		</QueryClientProvider>
	)
}
