'use client'

import imageCompression from 'browser-image-compression'
import { Camera, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { apiClient } from '@/lib/api/clients/api-client'
import { useDeleteUser, useUpdateUser } from '@/lib/api/hooks/use-users'
import type { User } from '@/lib/api/types/user.types'
import { getErrorMessage } from '@/lib/api/utils/error-handler'
import { useUserStore } from '@/lib/store/user-store'
import { getMediaUrl } from '@/lib/utils'

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
	const [previewURL, setPreviewURL] = useState<string | null>(null)
	const [showDeleteDialog, setShowDeleteDialog] = useState(false)
	const [isUploading, setIsUploading] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	// Sync local states if user object changes (e.g. from react-query refetch)
	useEffect(() => {
		setName(user.name || '')
		setUsername(user.username || '')
		setPhotoURL(user.photoURL || '')
		setPreviewURL(null)
	}, [user])

	const getDisplayAvatarUrl = useCallback((url: string | null) => {
		if (!url) return undefined
		if (url.startsWith('blob:')) return url
		return getMediaUrl(url)
	}, [])

	const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		setIsUploading(true)
		const compressionToast = toast.loading('Compressing and uploading image...')

		try {
			const options = {
				maxSizeMB: 0.5,
				maxWidthOrHeight: 256,
				useWebWorker: true,
			}
			const compressedFile = await imageCompression(file, options)

			// Generate local object URL for instant, zero-latency rendering
			const objectUrl = URL.createObjectURL(compressedFile)
			setPreviewURL(objectUrl)

			const { presignedUrl, publicUrl } = await apiClient.post<{
				presignedUrl: string
				publicUrl: string
				key: string
			}>('/upload/presigned-url', {
				filename: compressedFile.name || 'avatar.jpg',
				contentType: compressedFile.type || 'image/jpeg',
				folder: `avatars/${user.userId}`,
			})

			const uploadResponse = await fetch(presignedUrl, {
				method: 'PUT',
				body: compressedFile,
				headers: {
					'Content-Type': compressedFile.type || 'image/jpeg',
				},
			})

			if (!uploadResponse.ok) throw new Error('Failed to upload file to storage')

			setPhotoURL(publicUrl)
			toast.success('Avatar updated! Remember to save changes.', { id: compressionToast })
		} catch (error) {
			console.error('Avatar upload error:', error)
			toast.error('Failed to upload avatar image.', { id: compressionToast })
			setPreviewURL(null)
		} finally {
			setIsUploading(false)
			if (fileInputRef.current) fileInputRef.current.value = ''
		}
	}

	const isDirty = useMemo(() => {
		return (
			name !== (user.name || '') ||
			username !== (user.username || '') ||
			photoURL !== (user.photoURL || '')
		)
	}, [name, username, photoURL, user])

	const handleSaveAll = useCallback(async () => {
		const nameInput = document.getElementById('display-name-input') as HTMLInputElement | null
		const usernameInput = document.getElementById('username-input') as HTMLInputElement | null

		const currentName = nameInput ? nameInput.value : name
		const currentUsername = usernameInput ? usernameInput.value : username
		const currentPhotoURL = photoURL
		if (currentName !== name) setName(currentName)
		if (currentUsername !== username) setUsername(currentUsername)

		toast.promise(
			updateUser.mutateAsync({
				userId: user.userId,
				data: {
					name: currentName,
					username: currentUsername,
					photoURL: currentPhotoURL,
				},
			}),
			{
				loading: 'Saving your profile changes...',
				success: () => {
					setLastUpdated(new Date())
					setPreviewURL(null) // Reset preview url setelah sukses disimpan
					return 'Profile updated successfully!'
				},
				error: (err: any) => {
					return getErrorMessage(err)
				},
			}
		)
	}, [user.userId, updateUser.mutateAsync, setLastUpdated, name, username, photoURL])

	const handleReset = useCallback(() => {
		setName(user.name || '')
		setUsername(user.username || '')
		setPhotoURL(user.photoURL || '')
		setPreviewURL(null)
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

	return (
		<div className='space-y-12 pb-10'>
			<section className='space-y-4'>
				<h3 className='text-lg font-semibold text-gray-900'>Profile Information</h3>

				<div className='bg-white border rounded-lg overflow-hidden shadow-sm'>
					<div className='p-6 space-y-10'>
						<div className='flex flex-col sm:flex-row items-start gap-8 sm:gap-12'>
							<div className='w-full sm:w-1/2 space-y-1 text-left'>
								<h4 className='text-sm font-semibold text-gray-900'>Avatar</h4>
								<p className='text-xs text-gray-500'>
									This is your avatar. Click on the profile photo to upload and update your profile
									picture.
								</p>
							</div>
							<div className='w-full sm:w-1/2 flex items-center gap-6 text-left'>
								<button
									type='button'
									onClick={() => !isUploading && fileInputRef.current?.click()}
									className='relative h-16 w-16 rounded-full border shadow-sm overflow-hidden group cursor-pointer transition-all duration-300 hover:ring-2 hover:ring-primary/50 shrink-0'
								>
									<Avatar className='h-full w-full'>
										<AvatarImage
											src={getDisplayAvatarUrl(previewURL || photoURL) || undefined}
											alt={name}
										/>
										<AvatarFallback className='bg-primary/5 text-primary text-xs font-bold'>
											{name.substring(0, 2).toUpperCase() || '??'}
										</AvatarFallback>
									</Avatar>

									<div className='absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
										<Camera className='h-4 w-4 mb-0.5' />
										<span className='text-[9px] font-semibold uppercase tracking-wider'>
											Change
										</span>
									</div>

									{isUploading && (
										<div className='absolute inset-0 bg-white/80 flex items-center justify-center'>
											<Loader2 className='h-5 w-5 text-primary animate-spin' />
										</div>
									)}
								</button>

								<input
									type='file'
									ref={fileInputRef}
									onChange={handleImageUpload}
									accept='image/*'
									className='hidden'
									disabled={isUploading}
								/>
							</div>
						</div>

						<div className='flex flex-col sm:flex-row items-start gap-8 sm:gap-12'>
							<div className='w-full sm:w-1/2 space-y-1 text-left'>
								<h4 className='text-sm font-semibold text-gray-900'>Display Name</h4>
								<p className='text-xs text-gray-500'>
									Please enter your full name, or a display name you are comfortable with.
								</p>
							</div>
							<div className='w-full sm:w-1/2 space-y-1 text-left'>
								<Input
									id='display-name-input'
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder='Enter your full name'
									className='h-9 text-sm w-full'
									maxLength={32}
								/>
								<p className='text-[10px] text-gray-400'>Max 32 characters.</p>
							</div>
						</div>

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
										id='username-input'
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
