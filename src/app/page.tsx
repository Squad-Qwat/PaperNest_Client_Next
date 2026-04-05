'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useWorkspaces } from '@/lib/api/hooks/use-workspaces'
import { CreateWorkspaceModal } from '@/components/workspace/CreateWorkspaceModal'
import { Button } from '@/components/ui/button'
import { SplashLoader } from '@/components/layout/SplashLoader'
import { DashboardSkeleton } from '@/components/layout/DashboardSkeleton'

export default function Page() {
	const router = useRouter()
	const { user, loading: authLoading } = useAuth()
	const { data: workspacesResponse, isLoading: workspacesLoading, refetch } = useWorkspaces()
	const workspaces = workspacesResponse?.workspaces || []
	const [showCreateModal, setShowCreateModal] = useState(false)

	useEffect(() => {
		if (authLoading || !user) {
			return
		}

		if (!workspacesLoading && workspaces.length > 0) {
			router.push(`/${workspaces[0].workspaceId}`)
		}
	}, [user, authLoading, workspaces, workspacesLoading, router])

	const handleWorkspaceCreated = async () => {
		await refetch()
	}

	// Step 1: Initial Auth Check
	if (authLoading) {
		return <SplashLoader />
	}

	// Step 2: User is authenticated, checking/loading workspaces
	if (workspacesLoading) {
		return <DashboardSkeleton />
	}

	// Step 3: Authenticated but no workspaces yet
	if (user && workspaces.length === 0) {
		return (
			<div className='min-h-screen bg-gray-50 flex items-center justify-center'>
				<div className='text-center max-w-sm px-6 py-12 bg-white rounded-3xl border border-gray-100 shadow-sm'>
					<div className='w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6'>
						<span className='text-2xl font-bold text-primary'>PN</span>
					</div>
					<h1 className='text-2xl font-bold text-gray-900 mb-3 tracking-tight'>Welcome to PaperNest!</h1>
					<p className='text-gray-500 mb-8 text-sm leading-relaxed'>
						You don't have any workspaces yet. Create your first workspace to get started.
					</p>
					<Button 
						onClick={() => setShowCreateModal(true)}
						className="w-full py-6 text-base font-semibold rounded-2xl"
					>
						Create Workspace
					</Button>

					<CreateWorkspaceModal
						isOpen={showCreateModal}
						onClose={() => setShowCreateModal(false)}
						onSuccess={handleWorkspaceCreated}
					/>
				</div>
			</div>
		)
	}

	// Final transition state
	return <DashboardSkeleton />
}
