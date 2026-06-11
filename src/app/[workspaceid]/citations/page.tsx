'use client'

import { Calendar, Plus, Settings2, Tag, User } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AppSidebar } from '@/components/app-sidebar'
import { CitationDetailsSheet } from '@/components/citations/citation-details-sheet'
import { CitationSheet, type Citation as CitationType } from '@/components/citations/citation-sheet'
import { type CitationDisplay, CitationTable } from '@/components/citations/citation-table'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { SearchInput } from '@/components/ui/search-input'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import {
	useCreateCitation,
	useDeleteCitation,
	useUpdateCitation,
	useWorkspaceCitations,
} from '@/lib/api/hooks/use-citations'

import { useWorkspace } from '@/lib/api/hooks/use-workspaces'

export default function Page() {
	const params = useParams()
	const workspaceId = params.workspaceid as string
	const { data: workspace } = useWorkspace(workspaceId)
	const [searchQuery, setSearchQuery] = useState('')
	const [selectedAuthor, setSelectedAuthor] = useState('all')
	const [selectedYear, setSelectedYear] = useState('all')
	const [selectedType, setSelectedType] = useState('all')
	const [viewMode, setViewMode] = useState('full')
	const [isSheetOpen, setIsSheetOpen] = useState(false)
	const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false)
	const [editingCitation, setEditingCitation] = useState<Partial<CitationType> | undefined>()
	const [viewingCitation, setViewingCitation] = useState<CitationDisplay | undefined>()
	const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

	// Get citations for the entire workspace
	const { data: citationsData, isLoading: isCitationsLoading } = useWorkspaceCitations(workspaceId)

	const citations = useMemo(() => {
		const list = ((citationsData as any)?.citations ?? citationsData?.data?.citations) as
			| CitationDisplay[]
			| undefined
		return list || []
	}, [citationsData])

	const uniqueAuthors = useMemo(() => {
		const authors = new Set<string>()
		citations.forEach((c) => {
			if (c.author) {
				authors.add(c.author.trim())
			}
		})
		return Array.from(authors).sort((a, b) => a.localeCompare(b))
	}, [citations])

	const uniqueYears = useMemo(() => {
		const years = new Set<string>()
		citations.forEach((c) => {
			if (c.publicationDate) {
				const match = c.publicationDate.match(/\b\d{4}\b/)
				if (match) {
					years.add(match[0])
				} else {
					years.add(c.publicationDate.trim())
				}
			}
		})
		return Array.from(years).sort((a, b) => b.localeCompare(a))
	}, [citations])

	const filteredCitations = useMemo(() => {
		return citations.filter((c) => {
			if (searchQuery) {
				const query = searchQuery.toLowerCase()
				const matchesSearch =
					(c.title?.toLowerCase() || '').includes(query) ||
					(c.author?.toLowerCase() || '').includes(query) ||
					(c.publicationInfo?.toLowerCase() || '').includes(query) ||
					(c.doi?.toLowerCase() || '').includes(query)
				if (!matchesSearch) return false
			}
			if (selectedAuthor !== 'all') {
				if (c.author !== selectedAuthor) return false
			}
			if (selectedYear !== 'all') {
				const yearMatch = c.publicationDate?.match(/\b\d{4}\b/)
				const year = yearMatch ? yearMatch[0] : c.publicationDate
				if (year !== selectedYear) return false
			}
			if (selectedType !== 'all') {
				if (c.type !== selectedType) return false
			}
			return true
		})
	}, [citations, searchQuery, selectedAuthor, selectedYear, selectedType])

	// Still need documents to assign new citations to a document
	// const { data: documentsData } = useWorkspaceDocuments(workspaceId)
	// const documentId = documentsData?.documents?.[0]?.documentId

	const { mutate: createCitation } = useCreateCitation()
	const { mutate: updateCitation } = useUpdateCitation()
	const { mutate: deleteCitation } = useDeleteCitation()

	const handleAdd = () => {
		setEditingCitation(undefined)
		setIsSheetOpen(true)
	}

	const handleSave = (data: Partial<CitationType>) => {
		if (viewingCitation?.citationId) {
			updateCitation(
				{
					citationId: viewingCitation.citationId,
					documentId: viewingCitation.documentId,
					data: data as any,
				},
				{
					onSuccess: () => {
						setIsSheetOpen(false)
						setIsDetailsSheetOpen(false)
						toast.success('Reference updated successfully')
					},
					onError: (err) => {
						console.error(err)
						toast.error('Failed to update reference')
					},
				}
			)
		} else {
			createCitation(
				{
					workspaceId,
					// documentId, <- This might be undefined, which is now allowed
					...(data as any),
				},
				{
					onSuccess: () => {
						setIsSheetOpen(false)
						toast.success('Reference added successfully')
					},
					onError: (err) => {
						console.error(err)
						toast.error('Failed to add reference')
					},
				}
			)
		}
	}

	const handleDelete = useCallback((citationId: string) => {
		if (!citationId) return
		setDeleteConfirm(citationId)
	}, [])

	const handleConfirmDelete = useCallback(() => {
		if (!deleteConfirm) return
		const citation = citations.find((c) => c.citationId === deleteConfirm)
		deleteCitation(
			{
				citationId: deleteConfirm,
				documentId: citation?.documentId,
			},
			{
				onSuccess: () => {
					setDeleteConfirm(null)
					toast.success('Reference deleted successfully')
				},
				onError: (err) => {
					console.error(err)
					toast.error('Failed to delete reference')
				},
			}
		)
	}, [deleteConfirm, deleteCitation, citations])

	const handleRowClick = useCallback((citation: CitationDisplay) => {
		setViewingCitation(citation)
		setIsDetailsSheetOpen(true)
	}, [])

	const BreadcrumbSection = useMemo(
		() => (
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem className='hidden md:block'>
						<BreadcrumbLink href='#'>PaperNest</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator className='hidden md:block' />
					<BreadcrumbItem>
						<BreadcrumbLink href={`/${workspaceId}`}>{workspace?.title}</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator className='hidden md:block' />
					<BreadcrumbItem>
						<BreadcrumbPage>Citations</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
		),
		[workspaceId, workspace?.title]
	)

	return (
		<SidebarProvider className='h-svh overflow-hidden bg-sidebar'>
			<AppSidebar />
			<SidebarInset className='flex flex-col min-h-0 overflow-hidden border border-gray-200/50 transition-all duration-300 isolate rounded-2xl m-2'>
				<header className='flex h-16 shrink-0 items-center gap-2 px-4 bg-white border-b sticky top-0 z-30 rounded-t-2xl'>
					<SidebarTrigger className='-ml-1' />
					<Separator orientation='vertical' className='mr-2 h-4' />
					{BreadcrumbSection}
				</header>

				<main className='flex-1 p-6 w-full overflow-y-auto'>
					<div className='mb-8 flex items-center justify-between'>
						<div>
							<h2 className='text-2xl font-bold text-gray-900'>Citations</h2>
							<p className='text-sm text-gray-500 mt-1'>
								Manage your citations in the workspace {workspace?.title}
							</p>
						</div>

						<Button onClick={handleAdd}>
							Add reference
							<Plus />
						</Button>
					</div>

					<CitationSheet
						open={isSheetOpen}
						onOpenChange={setIsSheetOpen}
						onSave={handleSave}
						initialData={editingCitation}
					// documentId={documentId}
					/>

					<CitationDetailsSheet
						open={isDetailsSheetOpen}
						onOpenChange={setIsDetailsSheetOpen}
						citation={viewingCitation}
					/>

					<div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8'>
						<div className='flex-1 w-full lg:max-w-full'>
							<SearchInput
								value={searchQuery}
								onChange={setSearchQuery}
								placeholder='Search citations...'
							/>
						</div>

						<div className='flex flex-wrap items-center gap-3'>
							<div className='flex items-center gap-2 overflow-x-auto pb-1 md:pb-0'>
								<Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
									<SelectTrigger className='bg-white h-10 min-w-[140px]'>
										<User className='h-4 w-4 mr-2' />
										<SelectValue placeholder='All Authors' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>All Authors</SelectItem>
										{uniqueAuthors.map((author) => (
											<SelectItem key={author} value={author}>
												{author}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								<Select value={selectedYear} onValueChange={setSelectedYear}>
									<SelectTrigger className='bg-white h-10 min-w-[130px]'>
										<Calendar className='h-4 w-4 mr-2' />
										<SelectValue placeholder='All Years' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>All Years</SelectItem>
										{uniqueYears.map((year) => (
											<SelectItem key={year} value={year}>
												{year}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								<Select value={selectedType} onValueChange={setSelectedType}>
									<SelectTrigger className='bg-white h-10 min-w-[120px]'>
										<Tag className='h-4 w-4 mr-2' />
										<SelectValue placeholder='All Types' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>All Types</SelectItem>
										<SelectItem value='journal'>Journal</SelectItem>
										<SelectItem value='book'>Book</SelectItem>
										<SelectItem value='conference'>Conference</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<Select value={viewMode} onValueChange={setViewMode}>
								<SelectTrigger className='bg-white h-10 min-w-[130px]'>
									<Settings2 className='h-4 w-4 mr-2' />
									<SelectValue placeholder='Settings' />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel className='text-[11px] font-bold uppercase px-2 py-1.5'>
											TABLE ROW SETTINGS
										</SelectLabel>
										<SelectItem value='compact'>Compact view</SelectItem>
										<SelectItem value='expanded'>Expanded view</SelectItem>
										<SelectItem value='full'>Full view</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
					</div>

					<CitationTable
						data={filteredCitations}
						isLoading={isCitationsLoading}
						onRowClick={handleRowClick}
						onDelete={handleDelete}
						viewMode={viewMode}
					/>

					<ConfirmDialog
						isOpen={deleteConfirm !== null}
						onClose={() => setDeleteConfirm(null)}
						onConfirm={handleConfirmDelete}
						title='Delete Reference'
						message='Are you sure you want to delete this reference? This action cannot be undone.'
						confirmText='Delete'
						cancelText='Cancel'
						variant='danger'
					/>
				</main>
			</SidebarInset>
		</SidebarProvider>
	)
}
