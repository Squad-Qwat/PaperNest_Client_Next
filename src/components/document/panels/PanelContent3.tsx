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
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/clients/api-client'
import {
	useCreateCitation,
	useDeleteCitation,
	useDocumentCitations,
	useSearchSemanticScholar,
	useUpdateCitation,
} from '@/lib/api/hooks/use-citations'
import {
	DOCUMENT_FILE_KEYS,
	useAddDocumentFile,
	useDocumentFiles,
} from '@/lib/api/hooks/use-document-files'
import type { Citation, CreateCitationDto } from '@/lib/api/types/citation.types'
import { CitationForm } from './CitationForm'

interface PanelContent3Props {
	onInsertText?: (text: string) => void
}

const PanelContent3: React.FC<PanelContent3Props> = ({ onInsertText }) => {
	const params = useParams()
	const workspaceId = params.workspaceid as string
	const documentId = params.documentid as string

	const queryClient = useQueryClient()

	// Tabs: 'list' (My References), 'search' (Search Academic Library), 'manual' (Manual Import)
	const [activeTab, setActiveTab] = useState<'list' | 'search' | 'manual'>('list')

	// Search & Query States
	const [localSearch, setLocalSearch] = useState('')
	const [scholarQuery, setScholarQuery] = useState('')
	const [scholarSearchActive, setScholarSearchActive] = useState(false)

	// Action States
	const [isSyncingBib, setIsSyncingBib] = useState(false)
	const [syncSuccess, setSyncSuccess] = useState(false)
	const [editingCitation, setEditingCitation] = useState<Citation | null>(null)

	// Form States for Manual Input / Editing
	const [manualType, setManualType] = useState('article')
	const [manualTitle, setManualTitle] = useState('')
	const [manualAuthor, setManualAuthor] = useState('')
	const [manualVenue, setManualVenue] = useState('')
	const [manualYear, setManualYear] = useState('')
	const [manualDoi, setManualDoi] = useState('')
	const [manualUrl, setManualUrl] = useState('')

	// Hooks
	const { data: citationsData, isLoading: isCitationsLoading } = useDocumentCitations(documentId)
	const { data: filesData } = useDocumentFiles(documentId)
	const createCitationMutation = useCreateCitation()
	const updateCitationMutation = useUpdateCitation()
	const deleteCitationMutation = useDeleteCitation()
	const addDocumentFileMutation = useAddDocumentFile()

	const citations = citationsData?.citations || []
	const files = filesData || []

	// Semantic Scholar Hook
	const {
		data: scholarData,
		isLoading: isScholarSearching,
		error: scholarError,
	} = useSearchSemanticScholar(scholarQuery, scholarSearchActive, 8)

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
	const handleSyncBibTeX = async () => {
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
				const citeKey = c.citationId || `cite_${Date.now()}`
				const type = c.type === 'book' ? 'book' : 'article'

				bibtexString += `@${type}{${citeKey},\n`
				bibtexString += `  author  = {${c.author}},\n`
				bibtexString += `  title   = {${c.title}},\n`
				bibtexString += `  journal = {${c.publicationInfo}},\n`
				bibtexString += `  year    = {${c.publicationDate || new Date(c.createdAt).getFullYear()}}`
				if (c.doi) bibtexString += `,\n  doi     = {${c.doi}}`
				if (c.url) bibtexString += `,\n  url     = {${c.url}}`
				bibtexString += `\n}\n\n`
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
	}

	// Copy to clipboard cite format
	const handleCopyCite = (citationId: string) => {
		const citeCommand = `\\cite{${citationId}}`
		navigator.clipboard.writeText(citeCommand)
		toast.success(`Copied ${citeCommand} to clipboard`)
	}

	// Insert cite format to editor at cursor
	const handleInsertCite = (citationId: string) => {
		if (onInsertText) {
			onInsertText(`\\cite{${citationId}}`)
			toast.success(`Inserted \\cite{${citationId}}`)
		} else {
			handleCopyCite(citationId)
		}
	}

	// Manual Reference Submit
	const handleManualSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!manualTitle || !manualAuthor) {
			toast.error('Title and Author are required!')
			return
		}

		try {
			const citationData: CreateCitationDto = {
				workspaceId,
				documentId,
				type: manualType,
				title: manualTitle,
				author: manualAuthor,
				publicationInfo: manualVenue,
				publicationDate: manualYear,
				doi: manualDoi || null,
				url: manualUrl || null,
				accessDate: new Date().toISOString().split('T')[0],
				cslJson: {},
			}

			await createCitationMutation.mutateAsync({
				workspaceId,
				documentId,
				data: citationData,
			})

			toast.success('Reference added successfully!')
			// Clear fields
			setManualTitle('')
			setManualAuthor('')
			setManualVenue('')
			setManualYear('')
			setManualDoi('')
			setManualUrl('')
			setActiveTab('list')
		} catch (err) {
			console.error(err)
			toast.error('Failed to create manual reference')
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
	const handleDeleteCitation = async (citationId: string) => {
		if (confirm('Are you sure you want to remove this reference?')) {
			try {
				await deleteCitationMutation.mutateAsync({
					citationId,
					workspaceId,
					documentId,
				})
				toast.success('Reference removed')
			} catch (err) {
				console.error(err)
				toast.error('Failed to delete reference')
			}
		}
	}

	// Add paper from Semantic Scholar
	const handleAddScholarPaper = async (paper: any) => {
		try {
			const authorsStr = paper.authors?.map((a: any) => a.name).join(', ') || 'Unknown Author'
			const yearStr = paper.year ? paper.year.toString() : ''

			const citationData: CreateCitationDto = {
				workspaceId,
				documentId,
				type: 'article-journal',
				title: paper.title || 'Untitled Paper',
				author: authorsStr,
				publicationInfo: paper.venue || 'Academic Journal',
				publicationDate: yearStr,
				doi: paper.externalIds?.DOI || null,
				url: paper.url || null,
				accessDate: new Date().toISOString().split('T')[0],
				cslJson: paper,
			}

			await createCitationMutation.mutateAsync({
				workspaceId,
				documentId,
				data: citationData,
			})

			toast.success('Added scholarly paper to references!')
		} catch (err) {
			console.error(err)
			toast.error('Failed to add reference')
		}
	}

	const triggerScholarSearch = (e: React.FormEvent) => {
		e.preventDefault()
		if (!scholarQuery.trim()) return
		setScholarSearchActive(true)
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
						onClick={() => handleInsertCite(c.citationId)}
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
						onClick={() => handleInsertCite(c.citationId)}
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

		if (!scholarSearchActive) {
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

		if (scholarData?.data?.data?.length === 0) {
			return (
				<div className='text-center py-12 text-xs text-gray-400'>
					No papers found. Try different search terms.
				</div>
			)
		}

		return scholarData?.data?.data?.map((p) => {
			const authors = p.authors?.map((a) => a.name).join(', ') || 'Unknown Author'
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

					{/* Action button */}
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
					onClick={() => setActiveTab('manual')}
					className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all ${
						activeTab === 'manual'
							? 'bg-white shadow text-primary border border-gray-200'
							: 'text-gray-500 hover:text-gray-800'
					}`}
				>
					Manual Entry
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
										setScholarSearchActive(false) // Reset search active so we wait for enter/click
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

				{/* Tab 3: Manual Entry */}
				{activeTab === 'manual' && (
					<CitationForm
						onSubmit={handleManualSubmit}
						isPending={createCitationMutation.isPending}
						submitLabel='Add to Bibliography'
						submitIcon={<Plus className='h-3.5 w-3.5' />}
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
				)}
			</div>
		</div>
	)
}

export default PanelContent3
