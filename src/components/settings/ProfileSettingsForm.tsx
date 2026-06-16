'use client'

import imageCompression from 'browser-image-compression'
import { Camera } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ButtonSpinner } from '@/components/ui/button-spinner'
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
	const t = useTranslations('Settings')
	const _setIsProfileUpdating = useUserStore((state) => state.setIsProfileUpdating)
	const setLastUpdated = useUserStore((state) => state.setLastUpdated)

	const [name, setName] = useState(user.name || '')
	const [username, setUsername] = useState(user.username || '')
	const [photoURL, setPhotoURL] = useState(user.photoURL || '')
	const [previewURL, setPreviewURL] = useState<string | null>(null)
	const [showDeleteDialog, setShowDeleteDialog] = useState(false)
	const [isUploading, setIsUploading] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

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
					setPreviewURL(null)
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
				<h3 className='text-lg font-semibold text-foreground'>{t('profileInfo')}</h3>

				<div className='bg-card border border-border rounded-lg overflow-hidden shadow-sm'>
					<div className='p-6 space-y-10'>
						{/* Avatar */}
						<div className='flex flex-col sm:flex-row items-start gap-8 sm:gap-12'>
							<div className='w-full sm:w-1/2 space-y-1 text-left'>
								<h4 className='text-sm font-semibold text-foreground'>{t('avatar')}</h4>
								<p className='text-xs text-muted-foreground'>{t('avatarDesc')}</p>
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
										<div className='absolute inset-0 bg-background/80 flex items-center justify-center'>
											<ButtonSpinner className='h-5 w-5 text-primary' />
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

						{/* Display Name */}
						<div className='flex flex-col sm:flex-row items-start gap-8 sm:gap-12'>
							<div className='w-full sm:w-1/2 space-y-1 text-left'>
								<h4 className='text-sm font-semibold text-foreground'>{t('displayName')}</h4>
								<p className='text-xs text-muted-foreground'>{t('displayNameDesc')}</p>
							</div>
							<div className='w-full sm:w-1/2 space-y-1 text-left'>
								<Input
									id='display-name-input'
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder={t('displayNamePlaceholder')}
									className='h-9 text-sm w-full'
									maxLength={32}
								/>
								<p className='text-[10px] text-muted-foreground'>{t('displayNameMax')}</p>
							</div>
						</div>

						{/* Username */}
						<div className='flex flex-col sm:flex-row items-start gap-8 sm:gap-12'>
							<div className='w-full sm:w-1/2 space-y-1 text-left'>
								<h4 className='text-sm font-semibold text-foreground'>{t('usernameLabel')}</h4>
								<p className='text-xs text-muted-foreground'>{t('usernameDesc')}</p>
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
										placeholder={t('usernamePlaceholder')}
										className='h-9 text-sm rounded-l-none w-full'
										maxLength={48}
									/>
								</div>
								<p className='text-[10px] text-muted-foreground'>{t('usernameMax')}</p>
							</div>
						</div>
					</div>

					<div className='bg-muted/50 border-t border-border p-4 flex justify-end gap-3'>
						<Button
							variant='outline'
							size='sm'
							onClick={handleReset}
							disabled={!isDirty || updateUser.isPending}
							className='h-9 px-6 text-sm font-medium border-border'
						>
							{t('reset')}
						</Button>
						<Button
							size='sm'
							onClick={handleSaveAll}
							disabled={updateUser.isPending}
							className='h-9 px-8 bg-primary hover:bg-primary/90 text-sm font-medium'
						>
							{updateUser.isPending ? (
								<>
									<ButtonSpinner />
									{t('saveChanges')}
								</>
							) : (
								t('saveChanges')
							)}
						</Button>
					</div>
				</div>
			</section>

			<section className='space-y-4'>
				<h3 className='text-lg font-semibold text-red-600 text-left'>{t('dangerZone')}</h3>

				<div className='bg-card border border-destructive/20 rounded-lg overflow-hidden shadow-sm'>
					<div className='flex flex-col sm:flex-row items-center justify-between p-6 gap-6 hover:bg-destructive/5 transition-colors'>
						<div className='space-y-1 flex-1 text-left'>
							<h4 className='text-sm font-semibold text-foreground'>{t('deleteAccount')}</h4>
							<p className='text-xs text-muted-foreground max-w-xl'>{t('deleteAccountDesc')}</p>
						</div>
						<div className='flex-shrink-0 w-full sm:w-auto'>
							<Button
								variant='destructive'
								onClick={() => setShowDeleteDialog(true)}
								className='h-9 px-6 text-sm font-medium w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border-none'
							>
								{t('deleteAccountBtn')}
							</Button>
						</div>
					</div>
				</div>
			</section>

			<ConfirmDialog
				isOpen={showDeleteDialog}
				onClose={() => setShowDeleteDialog(false)}
				onConfirm={handleDeleteAccount}
				title={t('deleteAccountTitle')}
				message={t('deleteAccountMessage')}
				confirmText={t('deleteAccountConfirm')}
				variant='danger'
				verificationText={t('deleteAccountVerify')}
			/>
		</div>
	)
}
