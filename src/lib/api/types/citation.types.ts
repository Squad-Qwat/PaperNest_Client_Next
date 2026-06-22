export interface Citation {
	citationId: string
	workspaceId: string
	documentId?: string
	type: 'article' | 'book' | 'website' | string
	title: string
	author: string
	publicationInfo: string
	doi: string | null
	accessDate: string
	publicationDate: string
	url: string | null
	cslJson: Record<string, any>
	createdAt: string | Date
	updatedAt: string | Date
}

export type CitationData = Omit<Citation, 'citationId' | 'createdAt' | 'updatedAt'>

export interface CreateCitationDto {
	workspaceId: string
	documentId?: string
	type: string
	title: string
	author: string
	publicationInfo: string
	doi?: string | null
	accessDate?: string
	publicationDate?: string
	url?: string | null
	cslJson?: Record<string, any>
}

export interface UpdateCitationDto {
	type?: string
	title?: string
	author?: string
	publicationInfo?: string
	doi?: string | null
	accessDate?: string
	publicationDate?: string
	url?: string | null
	cslJson?: Record<string, any>
}

export interface CitationsResponse {
	success: boolean
	message: string
	data: {
		citations: Citation[]
		count: number
	}
}

export interface CitationResponse {
	success: boolean
	message: string
	data: {
		citation: Citation
	}
}

export interface SemanticScholarPaper {
	paperId: string
	externalIds?: Record<string, string>
	url?: string
	title?: string
	abstract?: string
	venue?: string
	year?: number
	citationCount?: number
	openAccessPdf?: {
		url: string
		status: string
	}
	authors?: Array<{
		authorId: string
		name: string
	}>
	fieldsOfStudy?: string[]
	crossRefType?: string
	type?: string
}

export interface SemanticScholarSearchResponse {
	success: boolean
	message: string
	data: {
		data: SemanticScholarPaper[]
		total: number
	}
}

export interface SemanticScholarPaperResponse {
	success: boolean
	message: string
	data: {
		paper: SemanticScholarPaper
	}
}
