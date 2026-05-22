'use client'

import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { useDeleteUser, useUpdateUser } from '@/lib/api/hooks/use-users'
import type { User } from '@/lib/api/types/user.types'
import { useUserStore } from '@/lib/store/user-store'

interface ProfileSettingsFormProps {
	user: User
}

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
	const updateUser = useUpdateUser()
	const deleteUser = useDeleteUser()
	const { logout } = useAuth()
	const _setIsProfileUpdating = useUserStore((state) => state.setIsProfileUpdating)
	const setLastUpdated = useUserStore((state) => state.setLastUpdated)

	const [name, setName] = useState(user.name || '')
	const [username, setUsername] = useState(user.username || '')
	const [photoURL, setPhotoURL] = useState(user.photoURL || '')
	const [showDeleteDialog, setShowDeleteDialog] = useState(false)

	const toastIdRef = useRef<string | number | null>(null)

	const isDirty = useMemo(() => {
		return (
			name !== (user.name || '') ||
			username !== (user.username || '') ||
			photoURL !== (user.photoURL || '')
		)
	}, [name, username, photoURL, user])

	// Use a ref to always have access to the latest state in stable callbacks
	const stateRef = useRef({ name, username, photoURL })
	useEffect(() => {
		stateRef.current = { name, username, photoURL }
	}, [name, username, photoURL])

	const handleSaveAll = useCallback(async () => {
		const currentData = stateRef.current

		// Dismiss the "Unsaved Changes" toast first to prevent overlap
		if (toastIdRef.current) {
			toast.dismiss(toastIdRef.current)
			toastIdRef.current = null
		}

		// Use toast.promise for a unified, clean UI response
		toast.promise(
			updateUser.mutateAsync({
				userId: user.userId,
				data: currentData,
			}),
			{
				loading: 'Saving your profile changes...',
				success: () => {
					setLastUpdated(new Date())
					return 'Profile updated successfully!'
				},
				error: (err: any) => {
					return err?.message || 'Failed to update profile. Please try again.'
				},
			}
		)
	}, [user.userId, updateUser.mutateAsync, setLastUpdated])

	const handleReset = useCallback(() => {
		setName(user.name || '')
		setUsername(user.username || '')
		setPhotoURL(user.photoURL || '')
		if (toastIdRef.current) {
			toast.dismiss(toastIdRef.current)
			toastIdRef.current = null
		}
	}, [user.name, user.username, user.photoURL])

	const handleDeleteAccount = useCallback(async () => {
		toast.promise(
			deleteUser.mutateAsync(user.userId).then(() => logout()),
			{
				loading: 'Deleting your account...',
				success: 'Account deleted successfully.',
				error: (err: any) => err?.message || 'Failed to delete account. Please try again.',
			}
		)
	}, [user.userId, deleteUser.mutateAsync, logout])

	// Persistent Toast Logic for Unsaved Changes
	useEffect(() => {
		if (isDirty && !updateUser.isPending) {
			if (!toastIdRef.current) {
				toastIdRef.current = toast('Unsaved Changes', {
					description: 'You have modified your profile settings.',
					duration: Infinity,
					position: 'bottom-right',
					action: {
						label: 'Save Changes',
						onClick: () => handleSaveAll(),
					},
					cancel: {
						label: 'Reset',
						onClick: () => handleReset(),
					},
					actionButtonStyle: {
						background: 'var(--primary)',
						color: 'var(--primary-foreground)',
					},
				})
			}
		} else if (!isDirty && toastIdRef.current) {
			toast.dismiss(toastIdRef.current)
			toastIdRef.current = null
		}

		return () => {
			if (toastIdRef.current) {
				toast.dismiss(toastIdRef.current)
				toastIdRef.current = null
			}
		}
	}, [isDirty, updateUser.isPending, handleReset, handleSaveAll])

	return (
		<div className='space-y-12 pb-10'>
			<section className='space-y-4'>
				<h3 className='text-lg font-semibold text-gray-900'>Profile Information</h3>

				<div className='bg-white border rounded-lg overflow-hidden shadow-sm'>
					<div className='p-6 space-y-10'>
						{/* Avatar Field - 50/50 Split */}
						<div className='flex flex-col sm:flex-row items-start gap-8 sm:gap-12'>
							<div className='w-full sm:w-1/2 space-y-1 text-left'>
								<h4 className='text-sm font-semibold text-gray-900'>Avatar</h4>
								<p className='text-xs text-gray-500'>
									This is your avatar. Enter a URL to update your profile picture.
								</p>
							</div>
							<div className='w-full sm:w-1/2 flex items-center gap-4 text-left'>
								<Avatar className='h-12 w-12 border shadow-sm shrink-0'>
									<AvatarImage src={photoURL || undefined} alt={name} />
									<AvatarFallback className='bg-primary/5 text-primary text-xs font-bold'>
										{name.substring(0, 2).toUpperCase() || '??'}
									</AvatarFallback>
								</Avatar>
								<div className='flex-1 min-w-0 space-y-1'>
									<label
										htmlFor='avatar-url'
										className='text-[10px] font-bold text-gray-400 uppercase tracking-wider'
									>
										Avatar URL
									</label>
									<Input
										id='avatar-url'
										placeholder='https://example.com/avatar.jpg'
										value={photoURL}
										onChange={(e) => setPhotoURL(e.target.value)}
										className='h-9 text-sm w-full bg-background'
									/>
								</div>
							</div>
						</div>

						{/* Display Name Field - 50/50 Split */}
						<div className='flex flex-col sm:flex-row items-start gap-8 sm:gap-12'>
							<div className='w-full sm:w-1/2 space-y-1 text-left'>
								<h4 className='text-sm font-semibold text-gray-900'>Display Name</h4>
								<p className='text-xs text-gray-500'>
									Please enter your full name, or a display name you are comfortable with.
								</p>
							</div>
							<div className='w-full sm:w-1/2 space-y-1 text-left'>
								<Input
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder='Enter your full name'
									className='h-9 text-sm w-full'
									maxLength={32}
								/>
								<p className='text-[10px] text-gray-400'>Max 32 characters.</p>
							</div>
						</div>

						{/* Username Field - 50/50 Split */}
						<div className='flex flex-col sm:flex-row items-start gap-8 sm:gap-12'>
							<div className='w-full sm:w-1/2 space-y-1 text-left'>
								<h4 className='text-sm font-semibold text-gray-900'>Username</h4>
								<p className='text-xs text-gray-500'>
									This is your unique URL namespace within PaperNest.
								</p>
							</div>
							<div className='w-full sm:w-1/2 space-y-1 text-left'>
								<div className='flex items-center gap-0 w-full'>
									<div className='flex items-center justify-center h-9 px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground text-sm shrink-0'>
										papernest.com/
									</div>
									<Input
										value={username}
										onChange={(e) => setUsername(e.target.value)}
										placeholder='your_username'
										className='h-9 text-sm rounded-l-none w-full'
										maxLength={48}
									/>
								</div>
								<p className='text-[10px] text-gray-400'>Max 48 characters.</p>
							</div>
						</div>
					</div>

					{/* Save / Reset Footer Actions */}
					<div className='bg-gray-50/50 border-t p-4 flex justify-end gap-3'>
						<Button
							variant='outline'
							size='sm'
							onClick={handleReset}
							disabled={!isDirty || updateUser.isPending}
							className='h-9 px-6 text-sm font-medium border-gray-300'
						>
							Reset
						</Button>
						<Button
							size='sm'
							onClick={handleSaveAll}
							disabled={updateUser.isPending}
							className='h-9 px-8 bg-primary hover:bg-primary/90 text-sm font-medium'
						>
							{updateUser.isPending ? (
								<>
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									Saving...
								</>
							) : (
								'Save Changes'
							)}
						</Button>
					</div>
				</div>
			</section>

			{/* Danger Zone Section */}
			<section className='space-y-4'>
				<h3 className='text-lg font-semibold text-red-600 text-left'>Danger Zone</h3>

				<div className='bg-white border border-red-100 rounded-lg overflow-hidden shadow-sm'>
					<div className='flex flex-col sm:flex-row items-center justify-between p-6 gap-6 hover:bg-red-50/20 transition-colors'>
						<div className='space-y-1 flex-1 text-left'>
							<h4 className='text-sm font-semibold text-gray-900'>Delete Account</h4>
							<p className='text-xs text-gray-500 max-w-xl'>
								Permanently delete your account and all associated workspaces, documents, and data.
								This action cannot be undone.
							</p>
						</div>
						<div className='flex-shrink-0 w-full sm:w-auto'>
							<Button
								variant='destructive'
								onClick={() => setShowDeleteDialog(true)}
								className='h-9 px-6 text-sm font-medium w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border-none'
							>
								Delete Account
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Deletion Confirm Dialog */}
			<ConfirmDialog
				isOpen={showDeleteDialog}
				onClose={() => setShowDeleteDialog(false)}
				onConfirm={handleDeleteAccount}
				title='Delete Account'
				message='Are you sure you want to delete your account? This action is permanent. All workspaces you own will also be deleted, and you will lose access to all documents.'
				confirmText='Permanently Delete Account'
				variant='danger'
				verificationText='DELETE MY ACCOUNT'
			/>
		</div>
	)
}
