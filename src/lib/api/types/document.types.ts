/**
 * Document Types
 * Types for document-related API operations
 */

/**
 * Document entity - matches Firestore 'documents' collection structure
 */
export interface Document {
	documentId: string
	workspaceId: string
	title: string
	description?: string
	savedContent: any // TipTap JSON content
	currentVersionId: string
	createdBy: string
	createdAt: Date
	updatedAt: Date
}

/**
 * Create document DTO
 */
export interface CreateDocumentDto {
	title: string
	description?: string
	savedContent?: any // TipTap JSON content (optional on create)
}

/**
 * Update document DTO
 */
export interface UpdateDocumentDto {
	title?: string
	description?: string
}

/**
 * Update document content DTO
 */
export interface UpdateDocumentContentDto {
	savedContent: any // TipTap JSON content (standardized field name)
	versionNote?: string
}

/**
 * Document search params
 */
export interface DocumentSearchParams {
	q: string // Search query
}

/**
 * Documents response
 */
export interface DocumentsResponse {
	documents: Document[]
	count: number
}

/**
 * Version entity
 */
export interface Version {
	documentBodyId: string
	documentId: string
	versionNumber: number
	content: any
	message?: string
	createdAt: string
	createdBy: string
}

/**
 * Versions response
 */
export interface VersionsResponse {
	versions: Version[]
}

/**
 * Single Version response
 */
export interface VersionResponse {
	version: Version
}

/**
 * Room info from Liveblocks
 */
export interface RoomInfo {
	id: string
	activeUsers: number
	status?: 'active' | 'inactive'
}

/**
 * Document with room state response
 * Used for checking active users in Liveblocks room before initializing editor
 */
export interface DocumentWithRoomStateResponse {
	document: Document
	currentVersion?: Version
	room: RoomInfo
}
