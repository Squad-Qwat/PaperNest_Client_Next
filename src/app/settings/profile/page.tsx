'use client'

import { ProfileSettingsForm } from '../../../components/settings/ProfileSettingsForm'
import { useAuth } from '@/context/AuthContext'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProfileSettingsPage() {
	const { user, loading } = useAuth()

	if (loading) {
		return (
			<div className='space-y-6'>
				<div>
					<Skeleton className='h-8 w-48 mb-2' />
					<Skeleton className='h-4 w-64' />
				</div>
				<div className='space-y-4'>
					<Skeleton className='h-48 w-full' />
					<Skeleton className='h-32 w-full' />
					<Skeleton className='h-32 w-full' />
				</div>
			</div>
		)
	}

	if (!user) return null

	return (
		<div className='space-y-8'>
			<div>
				<h2 className='text-3xl font-bold tracking-tight'>Profile Settings</h2>
				<p className='text-muted-foreground mt-1'>
					Manage your public profile and personal information.
				</p>
			</div>
			
			<ProfileSettingsForm user={user} />
		</div>
	)
}
