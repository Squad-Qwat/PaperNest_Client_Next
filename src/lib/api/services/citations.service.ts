/**
 * Citations Service
 * Handles all citation and academic paper-related API operations
 */

import { apiClient } from '../clients/api-client'
import { API_ENDPOINTS } from '../config'
import type {
	CitationResponse,
	CitationsResponse,
	CreateCitationDto,
	SemanticScholarPaperResponse,
	SemanticScholarSearchResponse,
	UpdateCitationDto,
} from '../types/citation.types'
import { RequestDeduplicator } from '../utils/deduplicator'

const generateSecureRandomString = (): string => {
	if (typeof window !== 'undefined' && window.crypto) {
		const array = new Uint32Array(1)
		window.crypto.getRandomValues(array)
		return array[0].toString(36).substring(0, 7)
	}
	try {
		const cryptoNode = require('node:crypto')
		return cryptoNode.randomBytes(4).toString('hex')
	} catch {
		return Date.now().toString(36)
	}
}

class CitationsService {
	/**
	 * Get all citations for a workspace
	 */
	async getWorkspaceCitations(workspaceId: string): Promise<CitationsResponse> {
		return RequestDeduplicator.deduplicate(`getWorkspaceCitations:${workspaceId}`, () =>
			apiClient.get<CitationsResponse>(API_ENDPOINTS.citations.byWorkspace(workspaceId))
		)
	}

	/**
	 * Get all citations for a document
	 */
	async getDocumentCitations(documentId: string, type?: string): Promise<CitationsResponse> {
		return RequestDeduplicator.deduplicate(
			`getDocumentCitations:${documentId}:${type || ''}`,
			() => {
				const baseUrl = API_ENDPOINTS.citations.byDocument(documentId)
				const url = type ? `${baseUrl}?type=${encodeURIComponent(type)}` : baseUrl
				return apiClient.get<CitationsResponse>(url)
			}
		)
	}

	/**
	 * Create a citation in a workspace
	 */
	async createWorkspaceCitation(
		workspaceId: string,
		data: CreateCitationDto
	): Promise<CitationResponse> {
		const normalized = this.normalizePayload(data)
		return apiClient.post<CitationResponse>(
			API_ENDPOINTS.citations.byWorkspace(workspaceId),
			normalized
		)
	}

	/**
	 * Create a citation in a document
	 */
	async createDocumentCitation(
		documentId: string,
		data: CreateCitationDto
	): Promise<CitationResponse> {
		const normalized = this.normalizePayload(data)
		return apiClient.post<CitationResponse>(
			API_ENDPOINTS.citations.byDocument(documentId),
			normalized
		)
	}

	/**
	 * Create a citation (supporting either workspace or document context)
	 */
	async create(
		data: CreateCitationDto & { workspaceId?: string; documentId?: string }
	): Promise<CitationResponse> {
		const normalized = this.normalizePayload(data)
		if (normalized.documentId) {
			return this.createDocumentCitation(normalized.documentId, normalized)
		}
		if (normalized.workspaceId) {
			return this.createWorkspaceCitation(normalized.workspaceId, normalized)
		}
		throw new Error('Either documentId or workspaceId must be provided to create a citation')
	}

	/**
	 * Get a citation by ID
	 */
	async getById(citationId: string, documentId?: string): Promise<CitationResponse> {
		return RequestDeduplicator.deduplicate(`getById:${citationId}:${documentId || ''}`, () =>
			apiClient.get<CitationResponse>(API_ENDPOINTS.citations.byId(citationId, documentId))
		)
	}

	/**
	 * Get a citation by ID (alias)
	 */
	async getCitationById(citationId: string, documentId?: string): Promise<CitationResponse> {
		return this.getById(citationId, documentId)
	}

	/**
	 * Update an existing citation
	 */
	async update(
		citationId: string,
		data: Partial<UpdateCitationDto>,
		documentId?: string
	): Promise<CitationResponse> {
		const normalized = this.normalizePayload(data)
		return apiClient.put<CitationResponse>(
			API_ENDPOINTS.citations.byId(citationId, documentId),
			normalized
		)
	}

	private normalizeUrl(url: string | null | undefined): string | null {
		if (url === null || url === undefined) return null
		const trimmed = url.trim()
		if (!trimmed) return null
		if (/^https?:\/\//i.test(trimmed)) {
			return trimmed
		}
		return `https://${trimmed}`
	}

	private normalizePayload<T extends { url?: string | null }>(data: T): T {
		if ('url' in data) {
			return {
				...data,
				url: this.normalizeUrl(data.url),
			}
		}
		return data
	}

	/**
	 * Delete a citation
	 */
	async delete(citationId: string, documentId?: string): Promise<void> {
		return apiClient.delete(API_ENDPOINTS.citations.byId(citationId, documentId))
	}

	/**
	 * Search citations by title or author
	 */
	async search(documentId: string, query: string): Promise<CitationsResponse> {
		return apiClient.get<CitationsResponse>(
			`${API_ENDPOINTS.citations.search(documentId)}?q=${encodeURIComponent(query)}`
		)
	}

	/**
	 * Find citation by DOI
	 */
	async getByDoi(documentId: string, doi: string): Promise<CitationResponse> {
		return apiClient.get<CitationResponse>(
			API_ENDPOINTS.citations.doi(documentId, encodeURIComponent(doi))
		)
	}

	/**
	 * Search papers on Semantic Scholar
	 */
	async searchSemanticScholar(
		query: string,
		limit: number = 10,
		offset: number = 0
	): Promise<SemanticScholarSearchResponse> {
		return RequestDeduplicator.deduplicate(
			`searchSemanticScholar:${query}:${limit}:${offset}`,
			() =>
				apiClient.get<SemanticScholarSearchResponse>(
					`${API_ENDPOINTS.citations.semanticScholarSearch}?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`
				)
		)
	}

	/**
	 * Get paper details from Semantic Scholar
	 */
	async getSemanticScholarPaper(paperId: string): Promise<SemanticScholarPaperResponse> {
		return RequestDeduplicator.deduplicate(`getSemanticScholarPaper:${paperId}`, () =>
			apiClient.get<SemanticScholarPaperResponse>(
				API_ENDPOINTS.citations.semanticScholarDetails(paperId)
			)
		)
	}

	async getCrossRefPaper(doi: string): Promise<any> {
		return RequestDeduplicator.deduplicate(`getCrossRefPaper:${doi}`, async () => {
			const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`)
			if (!res.ok) {
				throw new Error(`CrossRef API responded with status: ${res.status}`)
			}
			return res.json()
		})
	}

	async getGoogleBooksPaper(isbn: string): Promise<any> {
		return RequestDeduplicator.deduplicate(`getGoogleBooksPaper:${isbn}`, async () => {
			const res = await fetch(
				`https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}`
			)
			if (!res.ok) {
				throw new Error(`Google Books API responded with status: ${res.status}`)
			}
			return res.json()
		})
	}

	async unifiedSearch(query: string, limit: number = 8): Promise<any[]> {
		const isbnCleaned = query.replace(/[- ]/g, '')
		const isIsbn = /^(978|979)?\d{9}[\dX]$/i.test(isbnCleaned)

		if (isIsbn) {
			try {
				const bookData = await this.getGoogleBooksPaper(isbnCleaned)
				if (bookData?.items && bookData.items.length > 0) {
					return bookData.items.map((item: any) => {
						const info = item.volumeInfo || {}
						return {
							paperId: `isbn-${isbnCleaned}-${item.id || generateSecureRandomString()}`,
							title: info.title || '',
							externalIds: { ISBN: isbnCleaned },
							year: info.publishedDate ? info.publishedDate.substring(0, 4) : '',
							url: info.infoLink || '',
							venue: info.publisher || '',
							authors: info.authors?.map((name: string) => ({ name })) || [],
							type: 'book',
							journal: {
								volume: '',
								pages: '',
							},
						}
					})
				}
			} catch (gbError) {
				console.error(gbError)
			}
			return []
		}

		const response = (await this.searchSemanticScholar(query, limit)) as any
		let results = response?.data || []

		const isDoi = query.startsWith('10.') && query.includes('/')

		if (results.length === 0 && isDoi) {
			try {
				const crossRefData = await this.getCrossRefPaper(query)
				if (crossRefData?.message) {
					const msg = crossRefData.message

					const mappedAuthors =
						msg.author
							?.map((a: any) => {
								if (a.given || a.family) {
									return { name: `${a.given || ''} ${a.family || ''}`.trim() }
								}
								if (a.name && !isAffiliation(a.name)) {
									return { name: a.name.trim() }
								}
								return null
							})
							.filter(Boolean) || []

					const simulatedPaper = {
						paperId: `crossref-${msg.DOI || generateSecureRandomString()}`,
						title: msg.title?.[0] || '',
						externalIds: { DOI: msg.DOI || query },
						year:
							msg.issued?.['date-parts']?.[0]?.[0] ||
							msg['published-print']?.['date-parts']?.[0]?.[0] ||
							msg['published-online']?.['date-parts']?.[0]?.[0] ||
							'',
						url: msg.URL || '',
						venue: msg['container-title']?.[0] || '',
						authors: mappedAuthors,
						journal: {
							volume: msg.volume || '',
							pages: msg.page || '',
						},
						crossRefType: msg.type,
					}
					results = [simulatedPaper]
				}
			} catch (crError) {
				console.error(crError)
			}
		}

		return results
	}
}

export const isAffiliation = (name: string): boolean => {
	const lower = name.toLowerCase()
	const keywords = [
		'university',
		'institute',
		'sciences',
		'centre',
		'center',
		'school',
		'department',
		'laboratory',
		'association',
		'society',
		'foundation',
		'group',
		'consortium',
		'committee',
		'collaboration',
		'commission',
		'organization',
		'clinic',
		'hospital',
		'south africa',
	]
	return keywords.some((kw) => lower.includes(kw)) || name.length > 40
}

export const mapReferenceType = (pubTypes?: string[], crossRefType?: string): string => {
	if (crossRefType) {
		const typeMap: Record<string, string> = {
			'journal-article': 'article',
			book: 'book',
			'book-chapter': 'book',
			monograph: 'book',
			'edited-book': 'book',
			'proceedings-article': 'conference',
			report: 'report',
			dissertation: 'thesis',
		}
		if (typeMap[crossRefType]) {
			return typeMap[crossRefType]
		}
	}

	if (pubTypes && pubTypes.length > 0) {
		const lowerTypes = pubTypes.map((t) => t.toLowerCase())
		if (lowerTypes.some((t) => t.includes('journal') || t.includes('review'))) return 'article'
		if (lowerTypes.some((t) => t.includes('book'))) return 'book'
		if (lowerTypes.some((t) => t.includes('conference') || t.includes('proceedings')))
			return 'conference'
		if (lowerTypes.some((t) => t.includes('report'))) return 'report'
		if (lowerTypes.some((t) => t.includes('thesis') || t.includes('dissertation'))) return 'thesis'
	}

	return 'article'
}

export const formatAuthorName = (name: string): string => {
	const parts = name.trim().split(/\s+/)
	if (parts.length > 1) {
		const last = parts.pop()
		const first = parts.join(' ')
		return `${last}, ${first}`
	}
	return name
}

export const citationsService = new CitationsService()
