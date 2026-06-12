'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { SplashLoader } from '@/components/layout/SplashLoader'
import { useAuth } from '@/context/AuthContext'

export default function AcceptInvitationPage() {
	const params = useParams()
	const router = useRouter()
	const { token } = params
	const { isAuthenticated, loading: authLoading } = useAuth()

	useEffect(() => {
		if (authLoading) return

		if (!token) {
			router.push('/')
			return
		}

		if (!isAuthenticated) {
			// Redirect to login page, encoding callback to home page with token query
			const callbackUrl = encodeURIComponent(`/?inviteToken=${token}`)
			router.push(`/login?callbackUrl=${callbackUrl}`)
		} else {
			// User is already authenticated, redirect to home with token query
			router.push(`/?inviteToken=${token}`)
		}
	}, [token, isAuthenticated, authLoading, router])

	return <SplashLoader />
}
