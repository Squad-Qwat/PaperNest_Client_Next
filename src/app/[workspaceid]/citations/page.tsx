'use client'

import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	Calendar,
	ExternalLink,
	Plus,
	Settings2,
	Tag,
	User,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import {
	type ColumnDef,
	type ColumnOrderState,
	type SortingState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table'
import { AppSidebar } from '@/components/app-sidebar'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
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
import { Checkbox } from '@/components/ui/checkbox'
import { useWorkspace } from '@/lib/api/hooks/use-workspaces'

type Citation = {
	id: string
	type: string
	title: string
	author: string
	publicationInfo: string
	doi: string
	date: string
	year: string
	url: string
}

const data: Citation[] = [
	{
		id: '1',
		type: 'article',
		title: 'A Study of AI in EducationA Study of AI in EducationA Study of AI in EducationA Study of AI in EducationA Study of AI in EducationA Study of AI in EducationA Study of AI in EducationA Study of AI in EducationA Study of AI in EducationA Study of AI in EducationA Study of AI in EducationA Study of AI in EducationA Study of AI in EducationA Study of AI in EducationA Study of AI in EducationA Study of AI in EducationA Study of AI in EducationA Study of AI in EducationA Study of AI in EducationA Study of AI in EducationA Study of AI in EducationA Study of AI in EducationA Study of AI in Education',
		author: 'John Doe',
		publicationInfo: 'International Journal of Science',
		doi: '10.1000/xyz123',
		date: '10 Mei',
		year: '2023',
		url: 'https://example.com/paper',
	},
	{
		id: '2',
		type: 'book',
		title: 'Introduction to Machine Learning',
		author: 'Jane Smith',
		publicationInfo: 'Academic Press',
		doi: '10.1001/ml2022',
		date: '15 Mar',
		year: '2022',
		url: 'https://example.com/ml-book',
	},
]

const columns: ColumnDef<Citation>[] = [
	{
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected()}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label='Select all'
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label='Select row'
			/>
		),
		enableResizing: false,
		size: 40,
	},
	{
		accessorKey: 'type',
		header: 'Tipe',
		cell: ({ row }) => <span className='capitalize'>{row.getValue('type')}</span>,
		minSize: 80,
		enableResizing: false,
	},
	{
		accessorKey: 'title',
		header: ({ column }) => {
			const isSorted = column.getIsSorted()
			let SortIcon = ArrowUpDown
			if (isSorted === 'asc') SortIcon = ArrowUp
			else if (isSorted === 'desc') SortIcon = ArrowDown

			return (
				<Button
					variant='ghost'
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					<span className='truncate'>Judul</span>
					<SortIcon  />
				</Button>
			)
		},
		cell: ({ row }) => (
			<div
				className='whitespace-normal wrap-break-word line-clamp-2 py-1'
				title={row.getValue('title')}
			>
				{row.getValue('title')}
			</div>
		),
		minSize: 150,
	},
	{
		accessorKey: 'author',
		header: 'Penulis',
		minSize: 100,
	},
	{
		accessorKey: 'publicationInfo',
		header: 'Publikasi',
		minSize: 150,
	},
	{
		accessorKey: 'doi',
		header: 'DOI',
		cell: ({ row }) => (
			<span className='text-gray-500 font-mono text-xs truncate block'>{row.getValue('doi')}</span>
		),
		minSize: 120,
	},
	{
		accessorKey: 'date',
		header: 'Tanggal',
		minSize: 80,
	},
	{
		accessorKey: 'year',
		header: ({ column }) => {
			const isSorted = column.getIsSorted()
			let SortIcon = ArrowUpDown
			if (isSorted === 'asc') SortIcon = ArrowUp
			else if (isSorted === 'desc') SortIcon = ArrowDown

			return (
				<Button
					variant='ghost'
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					<span className='truncate'>Tahun</span>
					<SortIcon className='ml-1 h-3 w-3 shrink-0' />
				</Button>
			)
		},
		minSize: 80,
	},
	{
		id: 'actions',
		header: () => <div className='text-right'>Link</div>,
		cell: ({ row }) => (
			<div className='text-right'>
				<Button variant='ghost' size='icon' asChild className='h-8 w-8'>
					<a href={row.original.url} target='_blank' rel='noopener noreferrer'>
						<ExternalLink className='h-4 w-4' />
					</a>
				</Button>
			</div>
		),
		enableResizing: false,
		size: 60,
	},
]

export default function Page() {
	const params = useParams()
	const workspaceId = params.workspaceid as string
	const { data: workspace } = useWorkspace(workspaceId)
	const [searchQuery, setSearchQuery] = useState('')
	const [sorting, setSorting] = useState<SortingState>([])
	const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnOrder,
		},
		onSortingChange: setSorting,
		onColumnOrderChange: setColumnOrder,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		columnResizeMode: 'onChange',
	})

	return (
		<SidebarProvider className='h-svh overflow-hidden bg-sidebar'>
			<AppSidebar />
			<SidebarInset className='flex flex-col min-h-0 overflow-hidden border border-gray-200/50 transition-all duration-300 isolate rounded-2xl m-2'>
				<header className='flex h-16 shrink-0 items-center gap-2 px-4 bg-white border-b sticky top-0 z-30 rounded-t-2xl'>
					<SidebarTrigger className='-ml-1' />
					<Separator orientation='vertical' className='mr-2 h-4' />
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
				</header>

				<main className='flex-1 p-6 w-full overflow-y-auto'>
					<div className='mb-8 flex items-center justify-between'>
						<div>
							<h2 className='text-2xl font-bold text-gray-900'>Sitasi</h2>
							<p className='text-sm text-gray-500 mt-1'>
								Kelola sitasi Anda di workspace {workspace?.title}
							</p>
						</div>

						<Button>
							Tambah referensi
							<Plus />
						</Button>
					</div>

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
								<Select>
									<SelectTrigger className='bg-white h-10'>
										<User className='h-4 w-4 mr-2' />
										<SelectValue placeholder='Semua Penulis' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>Semua Penulis</SelectItem>
									</SelectContent>
								</Select>

								<Select>
									<SelectTrigger className='bg-white h-10'>
										<Calendar className='h-4 w-4 mr-2' />
										<SelectValue placeholder='Semua Tahun' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>Semua Tahun</SelectItem>
									</SelectContent>
								</Select>

								<Select>
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

							<Select defaultValue='full'>
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

					<div className='bg-white border rounded-xl overflow-hidden'>
						<Table style={{ width: table.getTotalSize(), minWidth: '100%' }}>
							<TableHeader className='bg-gray-50/50'>
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id}>
										{headerGroup.headers.map((header) => (
											<TableHead
												key={header.id}
												style={{ 
													width: header.getSize(),
													minWidth: header.column.columnDef.minSize 
												}}
												className='relative group overflow-hidden'
											>
												<div className='truncate'>
													{header.isPlaceholder
														? null
														: flexRender(header.column.columnDef.header, header.getContext())}
												</div>
												{header.column.getCanResize() && (
													<button
														type='button'
														onMouseDown={header.getResizeHandler()}
														onTouchStart={header.getResizeHandler()}
														className='absolute right-0 top-0 h-full w-4 cursor-col-resize group/resizer z-10 translate-x-1/2 focus:outline-none bg-transparent border-none p-0'
														aria-label='Resize column'
													>
														<div
															className={`h-full w-1 mx-auto transition-colors ${
																header.column.getIsResizing()
																	? 'bg-primary'
																	: 'bg-transparent group-hover/resizer:bg-gray-300'
															}`}
														/>
													</button>
												)}
											</TableHead>
										))}
									</TableRow>
								))}
							</TableHeader>
							<TableBody>
								{table.getRowModel().rows.length ? (
									table.getRowModel().rows.map((row) => (
										<TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
											{row.getVisibleCells().map((cell) => (
												<TableCell 
													key={cell.id} 
													style={{ 
														width: cell.column.getSize(),
														minWidth: cell.column.columnDef.minSize
													}}
													className='overflow-hidden'
												>
													<div className='truncate'>
														{flexRender(cell.column.columnDef.cell, cell.getContext())}
													</div>
												</TableCell>
											))}
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={columns.length} className='h-24 text-center'>
											Tidak ada data sitasi.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</main>
			</SidebarInset>
		</SidebarProvider>
	)
}
