'use client'

import { IconLoader2 } from '@tabler/icons-react'
import { useState, useMemo, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useUpdateUser } from '@/lib/api/hooks/use-users'
import { useUserStore } from '@/lib/store/user-store'
import type { User } from '@/lib/api/types/user.types'
import { toast } from 'sonner'

interface ProfileSettingsFormProps {
	user: User
}

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
	const updateUser = useUpdateUser()
	const setIsProfileUpdating = useUserStore((state) => state.setIsProfileUpdating)
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

	const handleSaveAll = async () => {
		try {
			setIsProfileUpdating(true)
			await updateUser.mutateAsync({
				userId: user.userId,
				data: { name, username, photoURL }
			})
			setLastUpdated(new Date())
			toast.success('Profile updated successfully')
			if (toastIdRef.current) {
				toast.dismiss(toastIdRef.current)
				toastIdRef.current = null
			}
		} catch (error) {
			toast.error('Failed to update profile')
		} finally {
			setIsProfileUpdating(false)
		}
	}

	const handleReset = () => {
		setName(user.name || '')
		setUsername(user.username || '')
		setPhotoURL(user.photoURL || '')
	}

	// Persistent Toast Logic for Unsaved Changes
	useEffect(() => {
		if (isDirty && !updateUser.isPending) {
			if (!toastIdRef.current) {
				toastIdRef.current = toast("Unsaved Changes", {
					description: "You have modified your profile settings.",
					duration: Infinity,
					action: {
						label: "Save Changes",
						onClick: () => handleSaveAll(),
					},
					cancel: {
						label: "Reset",
						onClick: () => handleReset(),
					}
				})
			}
		} else if (!isDirty && toastIdRef.current) {
			toast.dismiss(toastIdRef.current)
			toastIdRef.current = null
		}

		// Cleanup on unmount
		return () => {
			if (toastIdRef.current) {
				toast.dismiss(toastIdRef.current)
			}
		}
	}, [isDirty, updateUser.isPending])

	return (
		<div className='space-y-8 pb-10'>
			<Card className='overflow-hidden border-2 shadow-none transition-all hover:border-primary/20'>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-7'>
					<div className='space-y-1.5'>
						<CardTitle className='text-xl'>Avatar</CardTitle>
						<CardDescription className='max-w-md'>
							This is your avatar. Enter a URL below to update your profile picture.
						</CardDescription>
					</div>
					<div className='relative group'>
						<Avatar className='h-24 w-24 border-4 border-background grayscale-0 group-hover:grayscale transition-all'>
							<AvatarImage src={photoURL || undefined} alt={name} />
							<AvatarFallback className='text-3xl bg-primary/10'>
								{name.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
					</div>
				</CardHeader>
				<CardContent className='pt-0 border-t bg-muted/20 py-4'>
					<div className='space-y-2'>
						<label className='text-xs font-medium text-muted-foreground uppercase'>Avatar URL</label>
						<Input 
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
						<p className='text-xs text-muted-foreground'>
							Max 32 characters.
						</p>
					</div>
				</CardContent>
			</Card>

			<Card className='overflow-hidden border-2 shadow-none transition-all hover:border-primary/20'>
				<CardHeader>
					<CardTitle className='text-xl'>Username</CardTitle>
					<CardDescription>
						This is your unique URL namespace within PaperNest.
					</CardDescription>
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
						<p className='text-xs text-muted-foreground'>
							Max 48 characters.
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Loading indicator when saving */}
			{updateUser.isPending && (
				<div className='fixed top-4 right-4 z-50 animate-in fade-in zoom-in'>
					<div className='bg-background border rounded-full px-4 py-2 shadow-lg flex items-center gap-2'>
						<IconLoader2 className='size-4 animate-spin text-primary' />
						<span className='text-sm font-medium'>Saving changes...</span>
					</div>
				</div>
			)}
		</div>
	)
}
