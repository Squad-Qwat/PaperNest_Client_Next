/**
 * API Barrel Export
 * Centralized exports for clean imports
 */

// ============= Clients =============
export { apiClient } from './clients/api-client'
export { ApiError, HttpClient } from './clients/http-client'
// ============= Config =============
export { API_CONFIG, API_ENDPOINTS } from './config'
// ============= Services =============
export { authService } from './services/auth.service'
export { invitationsService } from './services/invitations.service'
export { usersService } from './services/users.service'
export { workspacesService } from './services/workspaces.service'

// ============= Types - Auth =============
export type {
	AuthResponse,
	LoginDto,
	LoginEmailDto,
	PasswordResetDto,
	RefreshTokenDto,
	RefreshTokenResponse,
	RegisterDto,
	UpdateEmailDto,
	VerifyTokenDto,
} from './types/auth.types'
// ============= Types - Common =============
export type {
	ApiErrorResponse,
	ApiResponse,
	PaginatedResponse,
	PaginationMeta,
	RequestConfig,
} from './types/common.types'
// ============= Types - Invitation =============
export type {
	Invitation,
	InvitationsResponse,
	UpdateInvitationDto,
} from './types/invitation.types'
// ============= Types - User =============
export type {
	UpdateUserDto,
	User,
	UserRole,
	UserSearchParams,
	UserSearchResult,
} from './types/user.types'
// ============= Types - Workspace =============
export type {
	CreateWorkspaceDto,
	InviteMemberDto,
	UpdateMemberRoleDto,
	UpdateWorkspaceDto,
	UserWorkspace,
	Workspace,
	WorkspaceMember,
	WorkspaceMembersResponse,
	WorkspaceRole,
	WorkspaceWithRole,
} from './types/workspace.types'
export type { ErrorResponse } from './utils/error-handler'
// ============= Utils =============
export {
	getErrorMessage,
	isAuthError,
	isErrorStatus,
	isValidationError,
	parseError,
} from './utils/error-handler'
export type { QueryParams } from './utils/query-builder'
export { buildQueryString, withQuery } from './utils/query-builder'
