'use client'

import { useQueryClient } from '@tanstack/react-query'
import {
	BookOpen,
	Check,
	Edit3,
	ExternalLink,
	FileBox,
	Loader2,
	Plus,
	PlusCircle,
	RefreshCw,
	Search,
	Sparkles,
	Trash2,
	X,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { apiClient } from '@/lib/api/clients/api-client'
import {
	useCreateCitation,
	useDeleteCitation,
	useDocumentCitations,
	useUpdateCitation,
	useWorkspaceCitations,
} from '@/lib/api/hooks/use-citations'
import {
	DOCUMENT_FILE_KEYS,
	useAddDocumentFile,
	useDocumentFiles,
} from '@/lib/api/hooks/use-document-files'
import { formatAuthorName, mapReferenceType } from '@/lib/api/services/citations.service'
import type { Citation, CreateCitationDto } from '@/lib/api/types/citation.types'
import { CitationForm } from './CitationForm'

// Helper to escape special characters for BibTeX/LaTeX syntax
const escapeBibTeX = (str: string | null | undefined): string => {
	if (!str) return ''
	return str
		.replace(/\\/g, '\\\\') // Escape backslash first
		.replace(/&/g, '\\&') // Escape ampersand
		.replace(/_/g, '\\_') // Escape underscore
		.replace(/%/g, '\\%') // Escape percent
		.replace(/\$/g, '\\$') // Escape dollar
		.replace(/#/g, '\\#') // Escape hash
}

// Helper to get raw BibTeX entry block
const getBibTeXEntryString = (c: Citation): string => {
	const rawCiteKey = c.citationId || `cite_${Date.now()}`
	const citeKey = rawCiteKey.replace(/[^a-zA-Z0-9_\-:]/g, '')
	const type = c.type === 'book' ? 'book' : 'article'

	const cleanAuthor = escapeBibTeX(c.author.replace(/;\s*/g, ' and '))
	const cleanTitle = escapeBibTeX(c.title)
	const cleanJournal = escapeBibTeX(c.publicationInfo)

	let entry = `@${type}{${citeKey},\n`
	entry += `  author  = {${cleanAuthor}},\n`
	entry += `  title   = {{${cleanTitle}}},\n`
	entry += `  journal = {${cleanJournal}},\n`
	entry += `  year    = {${c.publicationDate || new Date(c.createdAt).getFullYear()}}`
	if (c.doi) entry += `,\n  doi     = {${escapeBibTeX(c.doi)}}`
	if (c.url) entry += `,\n  url     = {${escapeBibTeX(c.url)}}`
	entry += `\n}\n`
	return entry
}

interface PanelContent3Props {
	onInsertText?: (text: string) => void
	activeFileName?: string
}

const PanelContent3: React.FC<PanelContent3Props> = ({ onInsertText, activeFileName }) => {
	const params = useParams()
	const workspaceId = params.workspaceid as string
	const documentId = params.documentid as string

	const queryClient = useQueryClient()

	const [activeTab, setActiveTab] = useState<'list' | 'search' | 'workspace'>('list')

	const [localSearch, setLocalSearch] = useState('')
	const [scholarQuery, setScholarQuery] = useState('')
	const [scholarResults, setScholarResults] = useState<any[]>([])
	const [isScholarSearching, setIsScholarSearching] = useState(false)
	const [hasSearched, setHasSearched] = useState(false)
	const [scholarError, setScholarError] = useState<any>(null)

	const [isSyncingBib, setIsSyncingBib] = useState(false)
	const [syncSuccess, setSyncSuccess] = useState(false)
	const [editingCitation, setEditingCitation] = useState<Citation | null>(null)
	const isSyncPending = useRef(false)

	const [manualType, setManualType] = useState('article')
	const [manualTitle, setManualTitle] = useState('')
	const [manualAuthor, setManualAuthor] = useState('')
	const [manualVenue, setManualVenue] = useState('')
	const [manualYear, setManualYear] = useState('')
	const [manualDoi, setManualDoi] = useState('')
	const [manualUrl, setManualUrl] = useState('')
	const [citationToDelete, setCitationToDelete] = useState<string | null>(null)

	const { data: citationsData, isLoading: isCitationsLoading } = useDocumentCitations(documentId)
	const { data: filesData } = useDocumentFiles(documentId)
	const { data: workspaceCitationsData, isLoading: isWorkspaceLoading } =
		useWorkspaceCitations(workspaceId)
	const createCitationMutation = useCreateCitation()
	const updateCitationMutation = useUpdateCitation()
	const deleteCitationMutation = useDeleteCitation()
	const addDocumentFileMutation = useAddDocumentFile()

	const citations = ((citationsData as any)?.citations ??
		citationsData?.data?.citations ??
		[]) as Citation[]
	const workspaceCitations = useMemo(() => {
		const raw = ((workspaceCitationsData as any)?.citations ??
			workspaceCitationsData?.data?.citations ??
			[]) as Citation[]
		return raw.filter((c) => c.documentId !== documentId)
	}, [workspaceCitationsData, documentId])
	const files = filesData || []

	// Filter citations in memory
	const filteredCitations = useMemo(() => {
		if (!localSearch.trim()) return citations
		const searchLower = localSearch.toLowerCase()
		return citations.filter(
			(c) =>
				c.title.toLowerCase().includes(searchLower) ||
				c.author.toLowerCase().includes(searchLower) ||
				c.publicationInfo.toLowerCase().includes(searchLower)
		)
	}, [citations, localSearch])

	// Sync to .bib file helper
	const handleSyncBibTeX = useCallback(async () => {
		if (citations.length === 0) {
			toast.error('No citations to sync!')
			return
		}

		setIsSyncingBib(true)
		setSyncSuccess(false)

		try {
			// Convert citations to BibTeX string
			let bibtexString = '%% Auto-generated bibliography by PaperNest %%\n\n'
			citations.forEach((c) => {
				bibtexString += `${getBibTeXEntryString(c)}\n`
			})

			const file = new File([bibtexString], 'references.bib', { type: 'text/plain' })
			const fileName = 'references.bib'

			// Get presigned URL
			const { presignedUrl, publicUrl, key } = await apiClient.post<{
				presignedUrl: string
				publicUrl: string
				key: string
			}>('/upload/presigned-url', {
				filename: fileName,
				contentType: 'text/plain',
				folder: `documents/${documentId}`,
			})

			// Upload to storage
			const uploadResponse = await fetch(presignedUrl, {
				method: 'PUT',
				body: file,
				headers: { 'Content-Type': 'text/plain' },
			})

			if (!uploadResponse.ok) throw new Error('Failed to upload BibTeX file')

			// Find if references.bib already exists in files
			const existingBibFile = files.find((f) => f.name === 'references.bib')

			// Add/Update in Firebase DB files registry
			await addDocumentFileMutation.mutateAsync({
				documentId,
				file: {
					fileId: existingBibFile?.fileId,
					name: fileName,
					type: 'text/plain',
					url: publicUrl,
					r2Key: key,
					size: file.size,
					createdAt: existingBibFile?.createdAt || (new Date() as unknown as Date),
				},
			})

			queryClient.invalidateQueries({ queryKey: DOCUMENT_FILE_KEYS.detail(documentId) })
			setSyncSuccess(true)
			toast.success('Synced successfully to references.bib!')
			setTimeout(() => setSyncSuccess(false), 3000)
		} catch (error) {
			console.error('Error syncing BibTeX:', error)
			toast.error('Failed to sync to references.bib')
		} finally {
			setIsSyncingBib(false)
		}
	}, [citations, documentId, files, addDocumentFileMutation, queryClient])

	// Copy to clipboard cite format
	const handleCopyCite = (citationId: string) => {
		const citeCommand = `\\cite{${citationId}}`
		navigator.clipboard.writeText(citeCommand)
		toast.success(`Copied ${citeCommand} to clipboard`)
	}

	// Insert cite format or full bib block to editor at cursor
	const handleInsertCite = (citation: Citation) => {
		if (onInsertText) {
			const isBibFile = activeFileName?.toLowerCase().endsWith('.bib')
			if (isBibFile) {
				const bibBlock = getBibTeXEntryString(citation)
				onInsertText(bibBlock)
				toast.success(`Inserted BibTeX entry for "${citation.title}"`)
			} else {
				onInsertText(`\\cite{${citation.citationId}}`)
				toast.success(`Inserted \\cite{${citation.citationId}} for "${citation.title}"`)
			}
		} else {
			handleCopyCite(citation.citationId)
		}
	}

	const handleImportFromWorkspace = async (workspaceCite: Citation) => {
		try {
			const citationData: CreateCitationDto = {
				workspaceId,
				documentId,
				type: workspaceCite.type,
				title: workspaceCite.title,
				author: workspaceCite.author,
				publicationInfo: workspaceCite.publicationInfo,
				publicationDate: workspaceCite.publicationDate,
				doi: workspaceCite.doi || null,
				url: workspaceCite.url || null,
				accessDate: new Date().toISOString().split('T')[0],
				cslJson: workspaceCite.cslJson || {},
			}

			await createCitationMutation.mutateAsync(citationData)
			toast.success('Reference imported to document!')
		} catch (err) {
			console.error(err)
			toast.error('Failed to import reference')
		}
	}

	// Update Reference Submit
	const handleUpdateSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!editingCitation) return

		try {
			await updateCitationMutation.mutateAsync({
				citationId: editingCitation.citationId,
				data: {
					type: manualType,
					title: manualTitle,
					author: manualAuthor,
					publicationInfo: manualVenue,
					publicationDate: manualYear,
					doi: manualDoi || null,
					url: manualUrl || null,
				},
			})

			toast.success('Reference updated successfully!')
			setEditingCitation(null)
		} catch (err) {
			console.error(err)
			toast.error('Failed to update reference')
		}
	}

	// Start Edit
	const startEditing = (citation: Citation) => {
		setEditingCitation(citation)
		setManualType(citation.type)
		setManualTitle(citation.title)
		setManualAuthor(citation.author)
		setManualVenue(citation.publicationInfo || '')
		setManualYear(citation.publicationDate || '')
		setManualDoi(citation.doi || '')
		setManualUrl(citation.url || '')
	}

	// Delete citation helper
	const handleDeleteCitation = (citationId: string) => {
		setCitationToDelete(citationId)
	}

	const handleAddScholarPaper = async (paper: any) => {
		try {
			const authorsStr =
				paper.authors?.map((a: any) => formatAuthorName(a.name)).join('; ') || 'Unknown Author'
			const yearStr = paper.year ? paper.year.toString() : ''
			const mappedType = mapReferenceType(paper.publicationTypes, paper.crossRefType || paper.type)

			const citationData: CreateCitationDto = {
				workspaceId,
				documentId,
				type: mappedType,
				title: paper.title || 'Untitled Paper',
				author: authorsStr,
				publicationInfo: paper.venue || 'Academic Journal',
				publicationDate: yearStr,
				doi: paper.externalIds?.DOI || paper.externalIds?.ISBN || null,
				url: paper.url || null,
				accessDate: new Date().toISOString().split('T')[0],
				cslJson: {
					raw: JSON.stringify({
						title: paper.title,
						author: paper.authors?.map((a: any) => {
							const nameFormatted = formatAuthorName(a.name)
							const parts = nameFormatted.split(',')
							return {
								family: parts[0]?.trim() || '',
								given: parts[1]?.trim() || '',
							}
						}),
						containerTitle: paper.venue,
						issued: { 'date-parts': [[yearStr]] },
						DOI: paper.externalIds?.DOI || paper.externalIds?.ISBN || '',
						URL: paper.url,
					}),
				},
			}

			await createCitationMutation.mutateAsync(citationData)
			toast.success('Added scholarly paper to references!')
		} catch (err) {
			console.error(err)
			toast.error('Failed to add reference')
		}
	}

	const triggerScholarSearch = async (e: React.FormEvent) => {
		e.preventDefault()
		const query = scholarQuery.trim()
		if (!query) return

		setIsScholarSearching(true)
		setHasSearched(true)
		setScholarError(null)

		try {
			const { citationsService } = await import('@/lib/api/services/citations.service')
			const results = await citationsService.unifiedSearch(query, 8)
			setScholarResults(results)
		} catch (error) {
			console.error(error)
			setScholarError(error)
			setScholarResults([])
		} finally {
			setIsScholarSearching(false)
		}
	}

	const renderLocalReferences = () => {
		if (isCitationsLoading) {
			return (
				<div className='flex flex-col items-center justify-center py-12 gap-2 text-gray-400'>
					<Loader2 className='h-6 w-6 animate-spin text-primary' />
					<span className='text-xs'>Loading references...</span>
				</div>
			)
		}

		if (filteredCitations.length === 0) {
			return (
				<div className='flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-100 rounded-xl text-center gap-4 text-gray-400 mt-2'>
					<div className='p-3 bg-gray-50 rounded-full text-primary/40'>
						<BookOpen className='h-8 w-8' />
					</div>
					<div>
						<p className='text-xs font-semibold text-gray-600'>No references found</p>
						<p className='text-[10px] text-gray-400 mt-1 max-w-[200px]'>
							Search the library to import scholarly papers or add them manually!
						</p>
					</div>
				</div>
			)
		}

		return filteredCitations.map((c) => (
			<div
				key={c.citationId}
				className='group relative border border-gray-150 hover:border-primary/40 rounded-xl p-3 bg-white hover:shadow-sm transition-all duration-200'
			>
				<div className='pr-12 text-xs'>
					<span className='inline-block px-1.5 py-0.5 bg-gray-100 font-mono text-[9px] text-gray-500 rounded tracking-wider mb-1.5 uppercase'>
						{c.type}
					</span>
					<button
						type='button'
						className='font-bold text-gray-800 leading-snug hover:text-primary transition text-left w-full cursor-pointer'
						onClick={() => handleInsertCite(c)}
					>
						{c.title}
					</button>
					<p className='text-gray-500 font-medium mt-1 text-[11px] line-clamp-1'>{c.author}</p>
					<p className='text-[10px] text-gray-400 mt-0.5 line-clamp-1'>
						{c.publicationInfo} {c.publicationDate ? `(${c.publicationDate})` : ''}
					</p>
					{c.doi && (
						<div className='flex items-center gap-1 mt-1 text-[10px] text-primary/70 font-semibold'>
							<span>DOI:</span>
							<a
								href={`https://doi.org/${c.doi}`}
								target='_blank'
								rel='noopener noreferrer'
								className='hover:underline flex items-center gap-0.5'
							>
								{c.doi}
								<ExternalLink className='h-2.5 w-2.5' />
							</a>
						</div>
					)}
				</div>

				{/* Interactive Actions Overlay */}
				<div className='absolute right-2 top-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity'>
					<button
						type='button'
						onClick={() => handleInsertCite(c)}
						className='p-1.5 hover:bg-primary/10 text-primary hover:text-primary rounded-lg transition'
						title='Insert \cite command in LaTeX editor'
					>
						<PlusCircle className='h-3.5 w-3.5' />
					</button>
					<button
						type='button'
						onClick={() => startEditing(c)}
						className='p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-lg transition'
						title='Edit reference'
					>
						<Edit3 className='h-3.5 w-3.5' />
					</button>
					<button
						type='button'
						onClick={() => handleDeleteCitation(c.citationId)}
						className='p-1.5 hover:bg-red-50 text-red-500 hover:text-red-600 rounded-lg transition'
						title='Delete reference'
					>
						<Trash2 className='h-3.5 w-3.5' />
					</button>
				</div>
			</div>
		))
	}

	const renderWorkspaceReferences = () => {
		if (isWorkspaceLoading) {
			return (
				<div className='flex flex-col items-center justify-center py-12 gap-2 text-gray-400'>
					<Loader2 className='h-6 w-6 animate-spin text-primary' />
					<span className='text-xs'>Loading workspace library...</span>
				</div>
			)
		}

		if (workspaceCitations.length === 0) {
			return (
				<div className='flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-100 rounded-xl text-center gap-4 text-gray-400 mt-2'>
					<div className='p-3 bg-gray-50 rounded-full text-primary/40'>
						<BookOpen className='h-8 w-8' />
					</div>
					<div>
						<p className='text-xs font-semibold text-gray-600'>No workspace references</p>
						<p className='text-[10px] text-gray-400 mt-1 max-w-[200px]'>
							Your workspace library is empty. Add references from the dashboard first!
						</p>
					</div>
				</div>
			)
		}

		return workspaceCitations.map((c) => {
			const hasBeenAdded = citations.some(
				(docCite) =>
					(docCite.doi && docCite.doi === c.doi) ||
					docCite.title.toLowerCase() === c.title.toLowerCase()
			)

			return (
				<div
					key={c.citationId}
					className='group relative border border-gray-150 hover:border-primary/40 rounded-xl p-3 bg-white hover:shadow-sm transition-all duration-200'
				>
					<div className='pr-24 text-xs'>
						<span className='inline-block px-1.5 py-0.5 bg-gray-100 font-mono text-[9px] text-gray-500 rounded tracking-wider mb-1.5 uppercase'>
							{c.type}
						</span>
						<h5 className='font-bold text-gray-800 leading-snug'>{c.title}</h5>
						<p className='text-gray-500 font-medium mt-1 text-[11px] line-clamp-1'>{c.author}</p>
						<p className='text-[10px] text-gray-400 mt-0.5 line-clamp-1'>
							{c.publicationInfo} {c.publicationDate ? `(${c.publicationDate})` : ''}
						</p>
					</div>

					<div className='absolute right-2 top-1/2 -translate-y-1/2'>
						<button
							type='button'
							onClick={() => handleImportFromWorkspace(c)}
							disabled={hasBeenAdded || createCitationMutation.isPending}
							className={`py-1 px-2.5 rounded-md font-bold text-[10px] transition-all flex items-center gap-1 ${
								hasBeenAdded
									? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
									: 'bg-primary hover:bg-primary/95 text-white shadow-sm'
							}`}
						>
							{hasBeenAdded ? (
								<>
									<Check className='h-3 w-3' />
									Imported
								</>
							) : (
								<>
									<Plus className='h-3 w-3' />
									Import
								</>
							)}
						</button>
					</div>
				</div>
			)
		})
	}

	const renderScholarContent = () => {
		if (isScholarSearching) {
			return (
				<div className='flex flex-col items-center justify-center py-12 gap-2 text-gray-400'>
					<Loader2 className='h-6 w-6 animate-spin text-primary' />
					<span className='text-xs'>Searching Semantic Scholar library...</span>
				</div>
			)
		}

		if (scholarError) {
			return (
				<div className='text-center py-8 text-xs text-red-500'>
					<p>Failed to load academic search results.</p>
					<p className='text-[10px] text-gray-400 mt-1'>
						Please verify your server key or query terms.
					</p>
				</div>
			)
		}

		if (!hasSearched) {
			return (
				<div className='flex flex-col items-center justify-center py-12 px-4 text-center text-gray-400 gap-3'>
					<div className='p-3 bg-blue-50 text-primary/60 rounded-full animate-pulse'>
						<Sparkles className='h-7 w-7' />
					</div>
					<p className='text-[11px] font-medium max-w-[220px]'>
						Find papers indexed on Semantic Scholar database and save them instantly as LaTeX bib
						entries!
					</p>
				</div>
			)
		}

		if (scholarResults.length === 0) {
			return (
				<div className='text-center py-12 text-xs text-gray-400'>
					No papers found. Try different search terms.
				</div>
			)
		}

		return scholarResults.map((p: any) => {
			const authors = p.authors?.map((a: any) => a.name).join(', ') || 'Unknown Author'
			const hasBeenAdded = citations.some((c) => c.title.toLowerCase() === p.title?.toLowerCase())

			return (
				<div
					key={p.paperId}
					className='group border border-gray-150 hover:border-blue-300 rounded-xl p-3 bg-white hover:shadow-sm transition duration-200'
				>
					<div className='text-xs pr-8'>
						<div className='flex items-center gap-1.5 mb-1.5 flex-wrap'>
							{p.year && (
								<span className='inline-block px-1.5 py-0.5 bg-blue-50 font-bold text-[9px] text-primary rounded'>
									{p.year}
								</span>
							)}
							{p.citationCount !== undefined && (
								<span className='inline-block px-1.5 py-0.5 bg-gray-50 text-[9px] text-gray-500 rounded font-medium'>
									Citations: {p.citationCount}
								</span>
							)}
						</div>
						<h5 className='font-bold text-gray-800 leading-snug'>{p.title}</h5>
						<p className='text-gray-500 mt-1 text-[11px] line-clamp-1'>{authors}</p>
						<p className='text-[10px] text-gray-400 mt-0.5 line-clamp-1'>{p.venue}</p>

						{p.abstract && (
							<p className='text-[10px] text-gray-400/80 bg-gray-50/50 p-2 rounded border border-gray-100 mt-2 line-clamp-2 leading-relaxed'>
								{p.abstract}
							</p>
						)}
					</div>

					<div className='mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between'>
						{p.openAccessPdf?.url ? (
							<a
								href={p.openAccessPdf.url}
								target='_blank'
								rel='noopener noreferrer'
								className='text-[10px] text-primary font-semibold flex items-center gap-1 hover:underline'
							>
								<FileBox className='h-3 w-3' />
								Open Access PDF
							</a>
						) : (
							<span className='text-[10px] text-gray-400'>No direct PDF link</span>
						)}

						<button
							type='button'
							onClick={() => handleAddScholarPaper(p)}
							disabled={hasBeenAdded || createCitationMutation.isPending}
							className={`py-1 px-2.5 rounded-md font-bold text-[10px] transition-all flex items-center gap-1 ${
								hasBeenAdded
									? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
									: 'bg-primary hover:bg-primary/95 text-white shadow-sm'
							}`}
						>
							{hasBeenAdded ? (
								<>
									<Check className='h-3 w-3' />
									Imported
								</>
							) : (
								<>
									<Plus className='h-3 w-3' />
									Import Reference
								</>
							)}
						</button>
					</div>
				</div>
			)
		})
	}

	return (
		<div className='flex flex-col h-full bg-white'>
			{/* Edit Citation Modal Cover Overlay */}
			{editingCitation && (
				<div className='absolute inset-0 bg-white/95 backdrop-blur-sm z-50 p-4 overflow-y-auto flex flex-col'>
					<div className='flex justify-between items-center mb-4 border-b pb-2 shrink-0'>
						<h4 className='text-sm font-bold text-gray-800 flex items-center gap-1.5'>
							<Edit3 className='h-4 w-4 text-primary' />
							Edit Reference
						</h4>
						<button
							type='button'
							onClick={() => setEditingCitation(null)}
							className='p-1 hover:bg-gray-150 rounded'
						>
							<X className='h-4 w-4 text-gray-500' />
						</button>
					</div>

					<CitationForm
						onSubmit={handleUpdateSubmit}
						isPending={updateCitationMutation.isPending}
						submitLabel='Save Changes'
						showCancel={true}
						onCancel={() => setEditingCitation(null)}
						authorPlaceholder='e.g. Smith, J. and Doe, A.'
						type={manualType}
						setType={setManualType}
						title={manualTitle}
						setTitle={setManualTitle}
						author={manualAuthor}
						setAuthor={setManualAuthor}
						venue={manualVenue}
						setVenue={setManualVenue}
						year={manualYear}
						setYear={setManualYear}
						doi={manualDoi}
						setDoi={setManualDoi}
						url={manualUrl}
						setUrl={setManualUrl}
					/>
				</div>
			)}

			{/* Sub Tabs Navigation */}
			<div className='flex border-b border-gray-150 bg-gray-50/50 p-1 shrink-0'>
				<button
					type='button'
					onClick={() => setActiveTab('list')}
					className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all ${
						activeTab === 'list'
							? 'bg-white shadow text-primary border border-gray-200'
							: 'text-gray-500 hover:text-gray-800'
					}`}
				>
					My References
				</button>
				<button
					type='button'
					onClick={() => setActiveTab('search')}
					className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all ${
						activeTab === 'search'
							? 'bg-white shadow text-primary border border-gray-200'
							: 'text-gray-500 hover:text-gray-800'
					}`}
				>
					Academic Search
				</button>
				<button
					type='button'
					onClick={() => setActiveTab('workspace')}
					className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all ${
						activeTab === 'workspace'
							? 'bg-white shadow text-primary border border-gray-200'
							: 'text-gray-500 hover:text-gray-800'
					}`}
				>
					Workspace Library
				</button>
			</div>

			{/* Main Scrollable View Area */}
			<div className='flex-1 overflow-y-auto p-3'>
				{/* Tab 1: My References */}
				{activeTab === 'list' && (
					<div className='space-y-3 flex flex-col h-full'>
						{/* Search & Actions Bar */}
						<div className='flex items-center gap-2 shrink-0'>
							<div className='flex-1 relative'>
								<Search className='absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400' />
								<input
									type='text'
									placeholder='Search references...'
									value={localSearch}
									onChange={(e) => setLocalSearch(e.target.value)}
									className='w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-md outline-none text-xs focus:ring-1 focus:ring-primary bg-gray-50/50'
								/>
							</div>

							<button
								type='button'
								onClick={handleSyncBibTeX}
								disabled={isSyncingBib}
								className={`p-2 rounded-md border text-xs flex items-center justify-center transition ${
									syncSuccess
										? 'border-green-300 bg-green-50 text-green-600'
										: 'border-gray-200 hover:bg-gray-50 text-gray-600'
								}`}
								title='Export and sync references to references.bib file'
							>
								{isSyncingBib ? (
									<Loader2 className='h-3.5 w-3.5 animate-spin' />
								) : syncSuccess ? (
									<Check className='h-3.5 w-3.5 animate-bounce' />
								) : (
									<RefreshCw className='h-3.5 w-3.5' />
								)}
							</button>
						</div>

						{/* References List */}
						<div className='flex-1 overflow-y-auto min-h-0 space-y-2 mt-1'>
							{renderLocalReferences()}
						</div>
					</div>
				)}

				{/* Tab 2: Academic Search */}
				{activeTab === 'search' && (
					<div className='space-y-3 flex flex-col h-full'>
						{/* Search Bar */}
						<form onSubmit={triggerScholarSearch} className='flex items-center gap-2 shrink-0'>
							<div className='flex-1 relative'>
								<Search className='absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400' />
								<input
									type='text'
									placeholder='Search articles by title or keywords...'
									value={scholarQuery}
									onChange={(e) => {
										setScholarQuery(e.target.value)
										setHasSearched(false)
									}}
									className='w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-md outline-none text-xs focus:ring-1 focus:ring-primary bg-gray-50/50'
								/>
							</div>
							<button
								type='submit'
								disabled={isScholarSearching || !scholarQuery.trim()}
								className='py-1.5 px-3 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-md transition shadow flex items-center justify-center shrink-0'
							>
								{isScholarSearching ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : 'Search'}
							</button>
						</form>

						{/* Results list */}
						<div className='flex-1 overflow-y-auto min-h-0 space-y-2 mt-1'>
							{renderScholarContent()}
						</div>
					</div>
				)}

				{activeTab === 'workspace' && (
					<div className='space-y-2 overflow-y-auto h-full'>{renderWorkspaceReferences()}</div>
				)}
			</div>

			<ConfirmDialog
				isOpen={!!citationToDelete}
				onClose={() => setCitationToDelete(null)}
				onConfirm={async () => {
					if (!citationToDelete) return
					try {
						await deleteCitationMutation.mutateAsync({
							citationId: citationToDelete,
							documentId,
						})
						isSyncPending.current = true
						toast.success('Reference removed')
					} catch (err) {
						console.error(err)
						toast.error('Failed to delete reference')
					}
				}}
				title='Remove Reference'
				message='Are you sure you want to remove this reference from the document?'
				confirmText='Remove'
				cancelText='Cancel'
				variant='danger'
			/>
		</div>
	)
}

export default PanelContent3
