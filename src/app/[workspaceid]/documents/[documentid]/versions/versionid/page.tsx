'use client'

import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { ReviewComment } from '@/components/review/ReviewComment'
import { ReviewStatusBadge } from '@/components/review/ReviewStatusBadge'

import { useParams } from 'next/navigation'

export default function ReviewDetailPage() {
	const params = useParams()
	const { reviewId } = params
	const [comment, setComment] = useState('')

	// Mock data based on provided context
	const review = {
		id: reviewId,
		title: 'Review Keamanan Sistem',
		lecturerName: 'Dr. Robert Wilson',
		status: 'Approved' as const, // Gitlab style: Open, Merged (Approved), Closed
		timeline_status: 'failed' as const, // pipeline failed style
		requestBy: 'Fa Ainama Caldera S',
		createdAt: '3 days ago',
		description:
			'Implementasi blockchain sangat inovatif dan secure. Analisis keamanan komprehensif. Sangat direkomendasikan untuk publikasi.',
		documentName: 'Implementasi Blockchain dalam Sistem Keamanan Data',
	}

	return (
		<div className='min-h-screen bg-gray-50'>
			<Navbar mode='workspace' />

			<main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				{/* Header */}
				<div className='mb-6'>
					<div className='flex flex-col gap-4'>
						<h1 className='text-2xl font-bold text-gray-900'>{review.title}</h1>

						<div className='flex flex-wrap items-center gap-3 text-sm'>
							<ReviewStatusBadge status={review.status} />
							<span className='text-gray-600'>
								<span className='font-semibold text-gray-900'>{review.requestBy}</span> requested
								review for{' '}
								<span className='font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded'>
									{review.documentName}
								</span>
							</span>
							<span className='text-gray-500 hidden sm:flex items-center gap-1'>
								via {review.lecturerName} <span className='mx-1'>•</span> {review.createdAt}
							</span>
						</div>
					</div>
				</div>

				<div className='relative pl-4 sm:pl-0'>
					{/* Vertical Line */}
					<div className='absolute left-9 sm:left-5 top-0 bottom-0 w-px bg-gray-200 -z-10' />

					<ReviewComment
						authorName={review.lecturerName}
						authorInitials='RW'
						date='2 days ago'
						content={review.description}
						userType='lecturer'
					/>
				</div>
			</main>
		</div>
	)
}