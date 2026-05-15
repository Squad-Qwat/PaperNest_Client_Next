'use client'

import { Mail, X } from 'lucide-react'
import { type ClipboardEvent, type KeyboardEvent, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Modal, ModalFooter } from '@/components/ui/modal'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { workspacesService } from '@/lib/api/services/workspaces.service'
import { getErrorMessage } from '@/lib/api/utils/error-handler'
import { cn } from '@/lib/utils'

interface InviteMembersModalProps {
	isOpen: boolean
	onClose: () => void
	workspaceId: string
	workspaceName?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function InviteMembersModal({
	isOpen,
	onClose,
	workspaceId,
	workspaceName,
}: InviteMembersModalProps) {
	const [emailInput, setEmailInput] = useState('')
	const [emailList, setEmailList] = useState<string[]>([])
	const [role, setRole] = useState<'editor' | 'viewer' | 'reviewer'>('viewer')
	const [loading, setLoading] = useState(false)

	const addEmails = (input: string) => {
		const newEmails = input
			.split(/[\s,]+/)
			.map((e) => e.trim())
			.filter((e) => e.length > 0 && !emailList.includes(e))

		if (newEmails.length > 0) {
			setEmailList((prev) => [...prev, ...newEmails])
			setEmailInput('')
		}
	}

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (['Enter', ',', ' '].includes(e.key)) {
			e.preventDefault()
			addEmails(emailInput)
		} else if (e.key === 'Backspace' && emailInput === '' && emailList.length > 0) {
			setEmailList((prev) => prev.slice(0, -1))
		}
	}

	const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault()
		const pastedData = e.clipboardData.getData('text')
		addEmails(pastedData)
	}

	const removeEmail = (emailToRemove: string) => {
		setEmailList((prev) => prev.filter((e) => e !== emailToRemove))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		const finalEmailList = [...emailList]
		const remaining = emailInput.trim()
		if (remaining && !finalEmailList.includes(remaining)) {
			finalEmailList.push(remaining)
		}

		if (finalEmailList.length === 0) {
			toast.error('Please enter at least one email address')
			return
		}

		const invalidEmails = finalEmailList.filter((e) => !EMAIL_REGEX.test(e))
		if (invalidEmails.length > 0) {
			toast.error(`Invalid email format: ${invalidEmails[0]}`)
			return
		}

		setLoading(true)

		try {
			await workspacesService.sendInvitations(workspaceId, {
				emails: finalEmailList,
				role,
			})

			toast.success(`${finalEmailList.length} invitation(s) sent successfully`)
			setEmailList([])
			setEmailInput('')
			setRole('viewer')
			onClose()
		} catch (err) {
			toast.error(getErrorMessage(err))
		} finally {
			setLoading(false)
		}
	}

	const handleClose = () => {
		if (!loading) {
			setEmailList([])
			setEmailInput('')
			setRole('viewer')
			onClose()
		}
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title={`Invite Members to ${workspaceName || 'Workspace'}`}
		>
			<form onSubmit={handleSubmit} className='space-y-6'>
				<div className='space-y-2'>
					<Label htmlFor='emails' className='text-sm font-medium'>
						Invite by email
					</Label>

					{/* biome-ignore lint/a11y/useSemanticElements: button cannot contain input */}
					<div
						role='button'
						tabIndex={-1}
						className={cn(
							'flex flex-wrap gap-2 p-1.5 min-h-[40px] bg-white border rounded-lg focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-200',
							loading && 'opacity-50 cursor-not-allowed'
						)}
						onClick={() => document.getElementById('email-input')?.focus()}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault()
								document.getElementById('email-input')?.focus()
							}
						}}
					>
						{emailList.map((email) => {
							const isValid = EMAIL_REGEX.test(email)
							return (
								<div
									key={email}
									className={cn(
										'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] font-medium transition-colors',
										isValid
											? 'bg-gray-100 text-gray-700 border border-gray-200'
											: 'bg-red-50 text-red-700 border border-red-200'
									)}
								>
									<Mail size={12} className={isValid ? 'text-gray-400' : 'text-red-400'} />
									{email}
									<button
										type='button'
										onClick={(e) => {
											e.stopPropagation()
											removeEmail(email)
										}}
										className='hover:text-black focus:outline-none'
									>
										<X size={14} />
									</button>
								</div>
							)
						})}
						<input
							id='email-input'
							type='text'
							value={emailInput}
							onChange={(e) => setEmailInput(e.target.value)}
							onKeyDown={handleKeyDown}
							onPaste={handlePaste}
							onBlur={() => addEmails(emailInput)}
							placeholder={
								emailList.length === 0 ? 'Type emails separated by comma or space...' : ''
							}
							className='flex-1 min-w-[120px] bg-transparent border-none outline-none text-[14px] p-1'
							disabled={loading}
						/>
					</div>
					<p className='text-[12px] text-gray-500'>
						Press Enter, Comma, or Space to add multiple emails.
					</p>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='role' className='text-sm font-medium'>
						Assign Role
					</Label>
					<Select value={role} onValueChange={(value) => setRole(value as any)} disabled={loading}>
						<SelectTrigger className='w-full'>
							<SelectValue placeholder='Select a role' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='viewer'>Viewer</SelectItem>
							<SelectItem value='editor'>Editor</SelectItem>
							<SelectItem value='reviewer'>Reviewer</SelectItem>
						</SelectContent>
					</Select>
					<p className='text-[12px] text-gray-500'>
						{role === 'viewer' && 'Can only read documents.'}
						{role === 'editor' && 'Can edit and manage documents.'}
						{role === 'reviewer' && 'Can provide feedback and comments.'}
					</p>
				</div>

				<ModalFooter className='pt-2'>
					<Button type='button' variant='outline' onClick={handleClose} disabled={loading}>
						Cancel
					</Button>
					<Button
						type='submit'
						disabled={loading || (emailList.length === 0 && !emailInput.trim())}
					>
						{loading ? 'Sending...' : 'Send Invitations'}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	)
}
