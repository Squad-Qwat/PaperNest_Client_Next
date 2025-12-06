/**
 * useUsers Hook
 * Custom hook for user operations
 */

'use client'

import { useState, useCallback } from 'react'
import { usersService } from '@/lib/api/services/users.service'
import type {
	User,
	UpdateUserDto,
	UserSearchParams,
	UserSearchResult,
} from '@/lib/api/types/user.types'
import { getErrorMessage } from '@/lib/api/utils/error-handler'

interface UseUsersReturn {
	loading: boolean
	error: string | null

	// Actions
	searchUsers: (params: UserSearchParams) => Promise<UserSearchResult>
	getUser: (userId: string) => Promise<User>
	updateUser: (userId: string, data: UpdateUserDto) => Promise<User>
	deleteUser: (userId: string) => Promise<void>
	clearError: () => void
}

export function useUsers(): UseUsersReturn {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Search users
	const searchUsers = useCallback(async (params: UserSearchParams) => {
		try {
			setLoading(true)
			setError(null)
			const result = await usersService.search(params)
			return result
		} catch (err) {
			const message = getErrorMessage(err)
			setError(message)
			throw err
		} finally {
			setLoading(false)
		}
	}, [])

	// Get user by ID
	const getUser = useCallback(async (userId: string) => {
		try {
			setLoading(true)
			setError(null)
			const user = await usersService.getById(userId)
			return user
		} catch (err) {
			const message = getErrorMessage(err)
			setError(message)
			throw err
		} finally {
			setLoading(false)
		}
	}, [])

	// Update user
	const updateUser = useCallback(async (userId: string, data: UpdateUserDto) => {
		try {
			setLoading(true)
			setError(null)
			const user = await usersService.update(userId, data)
			return user
		} catch (err) {
			const message = getErrorMessage(err)
			setError(message)
			throw err
		} finally {
			setLoading(false)
		}
	}, [])

	// Delete user
	const deleteUser = useCallback(async (userId: string) => {
		try {
			setLoading(true)
			setError(null)
			await usersService.delete(userId)
		} catch (err) {
			const message = getErrorMessage(err)
			setError(message)
			throw err
		} finally {
			setLoading(false)
		}
	}, [])

	// Clear error
	const clearError = useCallback(() => {
		setError(null)
	}, [])

	return {
		loading,
		error,
		searchUsers,
		getUser,
		updateUser,
		deleteUser,
		clearError,
	}
}
