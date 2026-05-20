'use client'

import {
	type Cell,
	type ColumnDef,
	type ColumnOrderState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	type Header as HeaderType,
	type Row,
	type SortingState,
	type Table as TableType,
	useReactTable,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, Trash2 } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import type { Citation } from '@/lib/api/types/citation.types'
import { cn } from '@/lib/utils'

export type CitationDisplay = Citation & {
	annotationsCount?: number
}

interface CitationTableProps {
	data: CitationDisplay[]
	isLoading: boolean
	onRowClick: (citation: CitationDisplay) => void
	onDelete: (citationId: string) => void
}

/**
 * Renders the table header section
 */
const TableHeaderSection = React.memo(({ table }: { table: TableType<CitationDisplay> }) => {
	return (
		<TableHeader className='bg-gray-50/50'>
			{table.getHeaderGroups().map((headerGroup) => (
				<TableRow key={headerGroup.id}>
					{headerGroup.headers.map((header: HeaderType<CitationDisplay, unknown>) => (
						<TableHead
							key={header.id}
							style={{
								width: header.getSize(),
								minWidth: header.column.columnDef.minSize,
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
									aria-label={`Resize ${header.column.id} column`}
								>
									<div
										className={cn(
											'h-full w-1 mx-auto transition-colors',
											header.column.getIsResizing()
												? 'bg-primary'
												: 'bg-transparent group-hover/resizer:bg-gray-300'
										)}
									/>
								</button>
							)}
						</TableHead>
					))}
				</TableRow>
			))}
		</TableHeader>
	)
})

TableHeaderSection.displayName = 'TableHeaderSection'

/**
 * Renders a single table row
 */
const TableRowComponent = React.memo(
	({ row, onClick }: { row: Row<CitationDisplay>; onClick: (data: CitationDisplay) => void }) => {
		return (
			<TableRow
				data-state={row.getIsSelected() && 'selected'}
				className='cursor-pointer hover:bg-gray-50/50 transition-colors'
				onClick={() => onClick(row.original)}
			>
				{row.getVisibleCells().map((cell: Cell<CitationDisplay, unknown>) => (
					<TableCell
						key={cell.id}
						style={{
							width: cell.column.getSize(),
							minWidth: cell.column.columnDef.minSize,
						}}
						className='overflow-hidden'
					>
						<div className='truncate'>
							{flexRender(cell.column.columnDef.cell, cell.getContext())}
						</div>
					</TableCell>
				))}
			</TableRow>
		)
	}
)

TableRowComponent.displayName = 'TableRowComponent'

/**
 * Renders skeleton rows for loading state
 */
const LoadingState = ({ columns }: { columns: ColumnDef<CitationDisplay, any>[] }) => {
	const skeletonRows = useMemo(() => ['skel-1', 'skel-2', 'skel-3', 'skel-4', 'skel-5'], [])

	return (
		<>
			{skeletonRows.map((rowId) => (
				<TableRow key={rowId}>
					{columns.map((column, colIndex) => {
						const columnId = column.id || (column as any).accessorKey || `col-${colIndex}`
						return (
							<TableCell key={`${rowId}-cell-${columnId}`}>
								<Skeleton className='h-6 w-full' />
							</TableCell>
						)
					})}
				</TableRow>
			))}
		</>
	)
}

/**
 * Helper to generate column definitions
 */
const getCitationColumns = (onDelete: (id: string) => void): ColumnDef<CitationDisplay>[] => [
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
			<div className='flex items-center justify-center'>
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					onClick={(e) => e.stopPropagation()}
					aria-label='Select row'
				/>
			</div>
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
					className='hover:bg-transparent p-0'
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					<span className='truncate'>Judul</span>
					<SortIcon className='ml-2 h-4 w-4' />
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
		accessorKey: 'publicationDate',
		header: ({ column }) => {
			const isSorted = column.getIsSorted()
			let SortIcon = ArrowUpDown
			if (isSorted === 'asc') SortIcon = ArrowUp
			else if (isSorted === 'desc') SortIcon = ArrowDown

			return (
				<Button
					variant='ghost'
					className='hover:bg-transparent p-0'
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
		accessorKey: 'annotationsCount',
		header: 'Anotasi',
		cell: ({ row }) => {
			const count = row.getValue('annotationsCount') as number
			return (
				<div className='flex items-center justify-center bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-bold w-fit'>
					{count || 0}
				</div>
			)
		},
		minSize: 80,
	},
	{
		id: 'link',
		header: () => <div className='text-right'>Link</div>,
		cell: ({ row }) => (
			<div className='text-right'>
				<Button
					variant='ghost'
					size='icon'
					asChild
					className='h-8 w-8'
					onClick={(e) => e.stopPropagation()}
				>
					<a
						href={row.original.url || '#'}
						target='_blank'
						rel='noopener noreferrer'
						aria-label='Open original link'
					>
						<ExternalLink className='h-4 w-4' />
					</a>
				</Button>
			</div>
		),
		enableResizing: false,
		size: 60,
	},
	{
		id: 'actions',
		header: () => <div className='text-right'>Aksi</div>,
		cell: ({ row }) => (
			<div className='text-right'>
				<Button
					variant='ghost'
					size='icon'
					className='h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10'
					onClick={(e) => {
						e.stopPropagation()
						onDelete(row.original.citationId)
					}}
					aria-label='Delete citation'
				>
					<Trash2 className='h-4 w-4' />
				</Button>
			</div>
		),
		enableResizing: false,
		size: 60,
	},
]

/**
 * Renders the table body content
 */
const TableBodyContent = ({
	isLoading,
	tableRows,
	columns,
	onRowClick,
}: {
	isLoading: boolean
	tableRows: Row<CitationDisplay>[]
	columns: ColumnDef<CitationDisplay>[]
	onRowClick: (citation: CitationDisplay) => void
}) => {
	if (isLoading) {
		return <LoadingState columns={columns} />
	}

	if (tableRows.length > 0) {
		return (
			<>
				{tableRows.map((row) => (
					<TableRowComponent key={row.id} row={row} onClick={onRowClick} />
				))}
			</>
		)
	}

	return (
		<TableRow>
			<TableCell colSpan={columns.length} className='h-24 text-center'>
				Tidak ada data sitasi.
			</TableCell>
		</TableRow>
	)
}

/**
 * Main CitationTable component
 */
export const CitationTable = React.memo(
	({ data, isLoading, onRowClick, onDelete }: CitationTableProps) => {
		const [sorting, setSorting] = useState<SortingState>([])
		const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])

		const columns = useMemo(() => getCitationColumns(onDelete), [onDelete])

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
			<div className='bg-white border rounded-xl overflow-hidden'>
				<Table style={{ width: table.getTotalSize(), minWidth: '100%' }}>
					<TableHeaderSection table={table} />
					<TableBody>
						<TableBodyContent
							isLoading={isLoading}
							tableRows={table.getRowModel().rows}
							columns={columns}
							onRowClick={onRowClick}
						/>
					</TableBody>
				</Table>
			</div>
		)
	}
)

CitationTable.displayName = 'CitationTable'
