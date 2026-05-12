'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useUpdateUser } from '@/lib/api/hooks/use-users'
import type { User } from '@/lib/api/types/user.types'
import { useUserStore } from '@/lib/store/user-store'

interface ProfileSettingsFormProps {
	user: User
}

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
	const updateUser = useUpdateUser()
	const _setIsProfileUpdating = useUserStore((state) => state.setIsProfileUpdating)
	const setLastUpdated = useUserStore((state) => state.setLastUpdated)

	const [name, setName] = useState(user.name || '')
	const [username, setUsername] = useState(user.username || '')
	const [photoURL, setPhotoURL] = useState(user.photoURL || '')

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
		<div className='space-y-8 pb-10'>
			<Card className='overflow-hidden border-2 shadow-none transition-all hover:border-primary/20'>
				<CardHeader className='flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-7'>
					<div className='space-y-1.5'>
						<CardTitle className='text-xl'>Avatar</CardTitle>
						<CardDescription className='max-w-md'>
							This is your avatar. Enter a URL below to update your profile picture.
						</CardDescription>
					</div>
					<div className='relative group shrink-0'>
						<Avatar className='h-20 w-20 sm:h-24 sm:w-24 border-4 border-background grayscale-0 group-hover:grayscale transition-all shadow-sm'>
							<AvatarImage src={photoURL || undefined} alt={name} />
							<AvatarFallback className='text-2xl sm:text-3xl bg-primary/10'>
								{name.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
					</div>
				</CardHeader>
				<CardContent className='pt-0 border-t bg-muted/20 py-4'>
					<div className='space-y-2'>
						<label
							htmlFor='avatar-url'
							className='text-xs font-medium text-muted-foreground uppercase'
						>
							Avatar URL
						</label>
						<Input
							id='avatar-url'
							placeholder='https://example.com/avatar.jpg'
							value={photoURL}
							onChange={(e) => setPhotoURL(e.target.value)}
							className='max-w-md bg-background'
						/>
					</div>
				</CardContent>
			</Card>

			<Card className='overflow-hidden border-2 shadow-none transition-all hover:border-primary/20'>
				<CardHeader>
					<CardTitle className='text-xl'>Display Name</CardTitle>
					<CardDescription>
						Please enter your full name, or a display name you are comfortable with.
					</CardDescription>
				</CardHeader>
				<CardContent className='pb-6'>
					<div className='space-y-2'>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder='Enter your full name'
							className='max-w-md'
							maxLength={32}
						/>
						<p className='text-xs text-muted-foreground'>Max 32 characters.</p>
					</div>
				</CardContent>
			</Card>

			<Card className='overflow-hidden border-2 shadow-none transition-all hover:border-primary/20'>
				<CardHeader>
					<CardTitle className='text-xl'>Username</CardTitle>
					<CardDescription>This is your unique URL namespace within PaperNest.</CardDescription>
				</CardHeader>
				<CardContent className='pb-6'>
					<div className='space-y-2'>
						<div className='flex items-center gap-0 max-w-md'>
							<div className='flex items-center justify-center h-10 px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground text-sm'>
								papernest.com/
							</div>
							<Input
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								placeholder='your_username'
								className='rounded-l-none'
								maxLength={48}
							/>
						</div>
						<p className='text-xs text-muted-foreground'>Max 48 characters.</p>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
