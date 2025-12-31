'use client'

import { Navbar } from '@/components/layout/navbar'
import { ReviewCard } from '@/components/review/ReviewCard'
import { SearchInput } from '@/components/ui/search-input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { useState } from 'react'
import { useParams } from 'next/navigation'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ReviewsPage() {
	const params = useParams()
	const workspaceId = (params?.workspaceid as string) || 'default-workspace'

	const [searchQuery, setSearchQuery] = useState('')
	const [selectedDocument, setSelectedDocument] = useState('all')
	const [selectedStatus, setSelectedStatus] = useState('all')

	// Mock data based on the image
	const reviews = [
		{
			id: '1',
			title: 'Review Keamanan Sistem',
			lecturerUserId: 'Prof. Robert Wilson',
			date: '1 November 2025',
			status: 'Approved' as const,
			message:
				'Implementasi blockchain sangat inovatif dan secure. Analisis keamanan komprehensif. Sangat direkomendasikan untuk publikasi.',
			documentBodyId: 'Implementasi Blockchain dalam Sistem Keamanan Data',
		},
		{
			id: '2',
			title: 'Review UX Research',
			lecturerUserId: 'Dr. Lisa Anderson',
			date: '31 Oktober 2025',
			status: 'Pending' as const,
			message:
				'Penelitian UX sangat detail dan metodologi yang digunakan tepat. Perlu penambahan sampel untuk validitas yang lebih kuat.',
			documentBodyId: 'Evaluasi User Experience pada Platform E-Learning',
		},
	]

	return (
		<div className='min-h-screen bg-gray-50'>
			<Navbar mode='workspace' />

			<main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				<div className='mb-8 space-y-2'>
					<h1 className='text-3xl font-bold text-gray-900'>Reviews</h1>
					<p className='text-gray-600'>Kelola dan tinjau review di semua dokumen</p>
				</div>

				<div className='space-y-6'>
					{/* Filters Section */}
					<div className='flex flex-col sm:flex-row justify-between gap-4'>
						{/* Left: Document Filter */}
						<div className='w-full sm:w-[250px]'>
							<Select value={selectedDocument} onValueChange={setSelectedDocument}>
								<SelectTrigger className='bg-white'>
									<SelectValue placeholder='Pilih dokumen' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>Semua Dokumen</SelectItem>
									<SelectItem value='doc1'>
										Implementasi Blockchain dalam Sistem Keamanan Data
									</SelectItem>
									<SelectItem value='doc2'>
										Evaluasi User Experience pada Platform E-Learning
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Right: Search and Status Filter */}
						<div className='flex flex-col sm:flex-row gap-4 w-full sm:w-auto'>
							<div className='w-full sm:w-[320px]'>
								<SearchInput
									placeholder='Cari review...'
									className='w-full bg-white'
									value={searchQuery}
									onChange={setSearchQuery}
								/>
							</div>
							<div className='w-full sm:w-[140px]'>
								<Select value={selectedStatus} onValueChange={setSelectedStatus}>
									<SelectTrigger className='bg-white'>
										<SelectValue placeholder='Pending' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>Semua Status</SelectItem>
										<SelectItem value='pending'>Pending</SelectItem>
										<SelectItem value='approved'>Approved</SelectItem>
										<SelectItem value='revision'>Revision Required</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					{reviews.length > 0 && (
						<div className='space-y-4'>
							<h2 className='text-lg font-semibold text-gray-900'>
								Semua Review ({reviews.length})
							</h2>

							<div className='grid gap-4'>
								{reviews.map((review) => (
									<ReviewCard
										key={review.id}
										{...review}
										reviewId={review.id}
										workspaceId={workspaceId}
										onDelete={() => console.log('Delete', review.id)}
									/>
								))}
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	)
}
