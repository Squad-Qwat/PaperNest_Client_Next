/**
 * Users Service
 * Handles all user-related API operations
 */

import { apiClient } from '../clients/api-client'
import { API_ENDPOINTS } from '../config'
import { withQuery } from '../utils/query-builder'
import type { User, UpdateUserDto, UserSearchParams, UserSearchResult } from '../types/user.types'

class UsersService {
	/**
	 * Search users by query
	 */
	async search(params: UserSearchParams): Promise<UserSearchResult> {
		const endpoint = withQuery(API_ENDPOINTS.users.search, params as any)
		return apiClient.get<UserSearchResult>(endpoint)
	}

	/**
	 * Get user by ID
	 */
	async getById(userId: string): Promise<User> {
		return apiClient.get<User>(API_ENDPOINTS.users.byId(userId))
	}

	/**
	 * Update user profile
	 */
	async update(userId: string, data: UpdateUserDto): Promise<User> {
		return apiClient.put<User>(API_ENDPOINTS.users.byId(userId), data)
	}

	/**
	 * Delete user
	 */
	async delete(userId: string): Promise<void> {
		await apiClient.delete<void>(API_ENDPOINTS.users.byId(userId))
	}
}

// Export singleton instance
export const usersService = new UsersService()
