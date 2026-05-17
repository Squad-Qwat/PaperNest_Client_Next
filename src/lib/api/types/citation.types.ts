import type { ApiResponse } from './common.types'

export interface Citation {
	citationId: string
	documentId?: string
	type: string
	title: string
	author: string
	publicationInfo: string
	doi: string | null
	accessDate?: string
	publicationDate: string
	url: string | null
	cslJson: Record<string, any>
	createdAt: string
	updatedAt: string
}

export interface CitationData {
	type: string
	title: string
	author: string
	publicationInfo: string
	doi?: string | null
	accessDate?: string
	publicationDate: string
	url?: string | null
	cslJson: Record<string, any>
}

export type CitationResponse = ApiResponse<{
	citation: Citation
}>

export type CitationsResponse = ApiResponse<{
	citations: Citation[]
	count: number
}>
