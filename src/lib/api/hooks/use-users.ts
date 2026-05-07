import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usersService } from '../services/users.service'
import type { UpdateUserDto } from '../types/user.types'
import { AUTH_KEYS } from './use-auth'

export function useUpdateUser() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ userId, data }: { userId: string; data: UpdateUserDto }) =>
			usersService.update(userId, data),
		onSuccess: (updatedUser) => {
			queryClient.setQueryData(AUTH_KEYS.user, (oldData: any) => ({
				...oldData,
				...updatedUser,
			}))
			toast.success('Profil berhasil diperbarui!')
		},
		onError: (error: any) => {
			toast.error(error.message || 'Gagal memperbarui profil.')
		},
	})
}
