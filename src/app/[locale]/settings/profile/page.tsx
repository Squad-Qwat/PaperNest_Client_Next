'use client'

import { useTranslations } from 'next-intl'
import { ProfileSettingsForm } from '@/components/settings/ProfileSettingsForm'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'

export default function ProfileSettingsPage() {
	const { user, loading } = useAuth()
	const t = useTranslations('Settings')

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
		<div className='space-y-8 text-left'>
			<div>
				<h2 className='text-2xl font-bold text-foreground'>{t('profileTitle')}</h2>
				<p className='text-sm text-muted-foreground mt-1'>{t('profileSubtitle')}</p>
			</div>

			<ProfileSettingsForm user={user} />
		</div>
	)
}
