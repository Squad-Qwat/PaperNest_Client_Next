import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService } from '../services/users.service'
import type { UpdateUserDto } from '../types/user.types'
import { AUTH_KEYS } from './use-auth'

export function useUpdateUser() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ userId, data }: { userId: string; data: UpdateUserDto }) =>
			usersService.update(userId, data),
		onSuccess: (response: any) => {
			// The response contains { user: User }
			const updatedUser = response.user || response
			
			queryClient.setQueryData(AUTH_KEYS.user, (oldData: any) => ({
				...oldData,
				...updatedUser,
			}))
		},
	})
}
