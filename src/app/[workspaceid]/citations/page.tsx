'use client'

import {
	Calendar,
	Plus,
	Settings2,
	Tag,
	User,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import React, { useMemo, useCallback, useState } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { CitationSheet, type Citation as CitationType } from '@/components/citations/citation-sheet'
import { CitationDetailsSheet } from '@/components/citations/citation-details-sheet'
import { CitationTable, type CitationDisplay } from '@/components/citations/citation-table'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
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
import { useWorkspace } from '@/lib/api/hooks/use-workspaces'
import { useCitations, useCreateCitation, useDeleteCitation, useUpdateCitation } from '@/lib/api/hooks/use-citations'
import { useWorkspaceDocuments } from '@/lib/api/hooks/use-documents'

export default function Page() {
	const params = useParams()
	const workspaceId = params.workspaceid as string
	const { data: workspace } = useWorkspace(workspaceId)
	const [searchQuery, setSearchQuery] = useState('')
	const [isSheetOpen, setIsSheetOpen] = useState(false)
	const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false)
	const [editingCitation, setEditingCitation] = useState<Partial<CitationType> | undefined>()
	const [viewingCitation, setViewingCitation] = useState<CitationDisplay | undefined>()

	// Fetch documents to get a documentId for citations
	const { data: documentsData } = useWorkspaceDocuments(workspaceId)
	const documentId = documentsData?.documents?.[0]?.documentId
	
	const { data: citationsData, isLoading: isCitationsLoading } = useCitations(documentId)
	const citations = useMemo(() => (citationsData?.data?.citations as CitationDisplay[]) || [], [citationsData])

	const { mutate: createCitation } = useCreateCitation()
	const { mutate: updateCitation } = useUpdateCitation()
	const { mutate: deleteCitation } = useDeleteCitation()

	const handleAdd = () => {
		setEditingCitation(undefined)
		setIsSheetOpen(true)
	}

	const handleSave = (data: Partial<CitationType>) => {
		if (!documentId) return

		if (viewingCitation?.citationId) {
			updateCitation({
				documentId,
				citationId: viewingCitation.citationId,
				data: data as any,
			})
		} else {
			createCitation({
				documentId,
				data: data as any,
			})
		}
	}

	const handleDelete = useCallback((citationId: string) => {
		if (!documentId || !citationId) return
		if (window.confirm('Apakah Anda yakin ingin menghapus sitasi ini?')) {
			deleteCitation({ documentId, citationId })
		}
	}, [documentId, deleteCitation])

	const handleRowClick = useCallback((citation: CitationDisplay) => {
		setViewingCitation(citation)
		setIsDetailsSheetOpen(true)
	}, [])


	const BreadcrumbSection = useMemo(() => (
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
					<BreadcrumbPage>Sitasi</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	), [workspaceId, workspace?.title])

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
							<h2 className='text-2xl font-bold text-gray-900'>Sitasi</h2>
							<p className='text-sm text-gray-500 mt-1'>
								Kelola sitasi Anda di workspace {workspace?.title}
							</p>
						</div>

						<Button onClick={handleAdd}>
							Tambah referensi
							<Plus />
						</Button>
					</div>

					<CitationSheet
						open={isSheetOpen}
						onOpenChange={setIsSheetOpen}
						onSave={handleSave}
						initialData={editingCitation}
						documentId={documentId}
					/>

					<CitationDetailsSheet
						open={isDetailsSheetOpen}
						onOpenChange={setIsDetailsSheetOpen}
						citation={viewingCitation}
					/>

					<div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8'>
						<div className='flex-1 w-full lg:max-w-md'>
							<SearchInput
								value={searchQuery}
								onChange={setSearchQuery}
								placeholder='Cari sitasi...'
							/>
						</div>

						<div className='flex flex-wrap items-center gap-3'>
							<div className='flex items-center gap-2 overflow-x-auto pb-1 md:pb-0'>
								<Select key="author-select">
									<SelectTrigger className='bg-white h-10'>
										<User className='h-4 w-4 mr-2' />
										<SelectValue placeholder='Semua Penulis' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>Semua Penulis</SelectItem>
									</SelectContent>
								</Select>

								<Select key="year-select">
									<SelectTrigger className='bg-white h-10'>
										<Calendar className='h-4 w-4 mr-2' />
										<SelectValue placeholder='Semua Tahun' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>Semua Tahun</SelectItem>
									</SelectContent>
								</Select>

								<Select key="type-select">
									<SelectTrigger className='bg-white h-10'>
										<Tag className='h-4 w-4 mr-2' />
										<SelectValue placeholder='Semua Tipe' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>Semua Tipe</SelectItem>
										<SelectItem value='journal'>Jurnal</SelectItem>
										<SelectItem value='book'>Buku</SelectItem>
										<SelectItem value='conference'>Konferensi</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<Select defaultValue='full' key="view-settings">
								<SelectTrigger className='bg-white h-10'>
									<Settings2 className='h-4 w-4 mr-2' />
									<SelectValue placeholder='Pengaturan' />
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
						data={citations}
						isLoading={isCitationsLoading}
						onRowClick={handleRowClick}
						onDelete={handleDelete}
					/>
				</main>
			</SidebarInset>
		</SidebarProvider>
	)
}
