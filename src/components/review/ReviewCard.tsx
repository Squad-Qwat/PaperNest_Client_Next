import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ReviewStatusBadge } from './ReviewStatusBadge'
import { FileText, Trash2, Calendar } from 'lucide-react'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

interface ReviewCardProps {
	reviewId: string
	documentBodyId: string
	lecturerUserId: string
	message: string
	status: 'Pending' | 'Approved' | 'Revision Required' | 'Open'
	date: string
	title: string
	workspaceId: string
	onDelete?: () => void
    isLatest?: boolean
    onAddReview?: () => void
}

export function ReviewCard({
	reviewId,
	documentBodyId,
	lecturerUserId,
	message,
	status,
	date,
	title,
	workspaceId,
	onDelete,
    isLatest,
    onAddReview,
}: ReviewCardProps) {
	const router = useRouter()
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    
    const handleCardClick = () => {
        router.push(`/${workspaceId}/reviews/${reviewId}`)
    }

	return (
        <>
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => {
                    if (onDelete) onDelete()
                    setShowDeleteConfirm(false)
                }}
                title='Delete Review'
                message='Are you sure you want to delete this review? This action cannot be undone.'
                confirmText='Delete'
                cancelText='Cancel'
                variant='danger'
            />
            <Card 
                className='transition-all hover:shadow-md cursor-pointer group relative'
                onClick={handleCardClick}
            >
                <CardHeader className='pb-3'>
                    <div className='flex justify-between items-start'>
                        <div className='space-y-1.5'>
                            <CardTitle className='text-base hover:text-emerald-600 transition-colors'>
                                {title}
                            </CardTitle>
                            <CardDescription className='flex items-center gap-2 text-xs'>
                                <span>Reviewer: {lecturerUserId}</span>
                            </CardDescription>
                        </div>
                        {onDelete && (
                            <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50'
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setShowDeleteConfirm(true)
                                }}
                            >
                                <Trash2 className='w-4 h-4' />
                            </Button>
                        )}
                    </div>
                    <div className='flex items-center gap-3 pt-1'>
                        <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                            <Calendar className='w-3.5 h-3.5' />
                            <span>{date}</span>
                        </div>
                        <ReviewStatusBadge status={status} />
                    </div>
                </CardHeader>
                <CardContent className='pb-3'>
                    <div className='bg-muted/50 rounded-md p-3 text-sm line-clamp-2'>{message}</div>
                </CardContent>
                <CardFooter className='flex items-center justify-between'>
                    <div className='flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded-md w-fit'>
                        <FileText className='w-4 h-4' />
                        <span>Untuk: {documentBodyId}</span>
                    </div>
                    
                    {isLatest && onAddReview && (
                        <Button 
                            size='sm' 
                            onClick={(e) => {
                                e.stopPropagation()
                                onAddReview()
                            }}
                        >
                            <Plus className='w-4 h-4 mr-1.5' />
                            New Review
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </>
	)
}
