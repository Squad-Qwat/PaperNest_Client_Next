/**
 * Document Types
 * Types for document-related API operations
 */

/**
 * Document entity
 */
export interface Document {
  documentId: string;
  workspaceId: string;
  title: string;
  description?: string | null;
  currentVersionId?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create document DTO
 */
export interface CreateDocumentDto {
  title: string;
  description?: string;
  content?: string;
}

/**
 * Update document DTO
 */
export interface UpdateDocumentDto {
  title?: string;
  description?: string;
}

/**
 * Update document content DTO
 */
export interface UpdateDocumentContentDto {
  content: string;
  versionNote?: string;
}

/**
 * Document search params
 */
export interface DocumentSearchParams {
  q: string; // Search query
}

/**
 * Documents response
 */
export interface DocumentsResponse {
  documents: Document[];
  count: number;
}
