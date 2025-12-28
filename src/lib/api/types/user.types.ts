/**
 * User Types
 * Types for user-related API operations
 */

/**
 * User role enum
 */
export type UserRole = 'Student' | 'Lecturer';

/**
 * User entity
 */
export interface User {
  userId: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  photoURL?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Update user DTO
 */
export interface UpdateUserDto {
  name?: string;
  username?: string;
  photoURL?: string;
}

/**
 * User search filters
 */
export interface UserSearchParams {
  q: string; // Search query
}

/**
 * User search result
 */
export interface UserSearchResult {
  users: User[];
  count: number;
}
