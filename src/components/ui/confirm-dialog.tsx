'use client'

import { useEffect, useState } from 'react'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
	isOpen: boolean
	onClose: () => void
	onConfirm: () => void
	title: string
	message: string
	confirmText?: string
	cancelText?: string
	variant?: 'danger' | 'warning' | 'info'
	verificationText?: string
}

export function ConfirmDialog({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	variant = 'danger',
	verificationText,
}: ConfirmDialogProps) {
	const [inputText, setInputText] = useState('')

	useEffect(() => {
		if (!isOpen) {
			setInputText('')
		}
	}, [isOpen])

	const handleConfirm = (e: React.MouseEvent) => {
		if (verificationText && inputText !== verificationText) {
			e.preventDefault()
			return
		}
		onConfirm()
		onClose()
	}

	const isConfirmDisabled = !!verificationText && inputText !== verificationText

	return (
		<AlertDialog open={isOpen} onOpenChange={onClose}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription className='text-sm text-muted-foreground text-left space-y-4'>
						<span>{message}</span>
						{verificationText && (
							<span className='block space-y-2'>
								<span className='block text-sm font-semibold text-gray-700 dark:text-gray-300'>
									Please type{' '}
									<span className='font-bold text-red-600 select-all'>"{verificationText}"</span> to
									confirm.
								</span>
								<Input
									placeholder={verificationText}
									value={inputText}
									onChange={(e) => setInputText(e.target.value)}
									className='h-9 text-sm w-full bg-background'
								/>
							</span>
						)}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{cancelText}</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						disabled={isConfirmDisabled}
						className={cn(
							variant === 'danger' &&
								'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
						)}
					>
						{confirmText}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
