/**
 * API Barrel Export
 * Centralized exports for clean imports
 */

// ============= Clients =============
export { apiClient } from './clients/api-client'
export { HttpClient, ApiError } from './clients/http-client'

// ============= Services =============
export { authService } from './services/auth.service'
export { usersService } from './services/users.service'
export { workspacesService } from './services/workspaces.service'
export { invitationsService } from './services/invitations.service'

// ============= Types - Common =============
export type {
	ApiResponse,
	PaginatedResponse,
	PaginationMeta,
	ApiErrorResponse,
	RequestConfig,
} from './types/common.types'

// ============= Types - Auth =============
export type {
	RegisterDto,
	LoginDto,
	LoginEmailDto,
	AuthResponse,
	RefreshTokenDto,
	RefreshTokenResponse,
	PasswordResetDto,
	UpdateEmailDto,
	VerifyTokenDto,
} from './types/auth.types'

// ============= Types - User =============
export type {
	User,
	UserRole,
	UpdateUserDto,
	UserSearchParams,
	UserSearchResult,
} from './types/user.types'

// ============= Types - Workspace =============
export type {
	Workspace,
	WorkspaceWithRole,
	WorkspaceRole,
	CreateWorkspaceDto,
	UpdateWorkspaceDto,
	UserWorkspace,
	WorkspaceMember,
	InviteMemberDto,
	UpdateMemberRoleDto,
	WorkspaceMembersResponse,
} from './types/workspace.types'

// ============= Types - Invitation =============
export type {
	Invitation,
	UpdateInvitationDto,
	InvitationsResponse,
} from './types/invitation.types'

// ============= Config =============
export { API_CONFIG, API_ENDPOINTS } from './config'

// ============= Utils =============
export {
	parseError,
	getErrorMessage,
	isErrorStatus,
	isAuthError,
	isValidationError,
} from './utils/error-handler'
export type { ErrorResponse } from './utils/error-handler'

export { buildQueryString, withQuery } from './utils/query-builder'
export type { QueryParams } from './utils/query-builder'
