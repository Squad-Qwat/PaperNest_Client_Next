'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/context/AuthContext'
import { useWorkspaces } from '@/lib/api/hooks/use-workspaces'
import { CreateWorkspaceModal } from '@/components/workspace/CreateWorkspaceModal'
import { Button } from '@/components/ui/button'

export default function Page() {
	const router = useRouter()
	const { user, loading: authLoading } = useAuthContext()
	const { data: workspacesResponse, isLoading: workspacesLoading, refetch } = useWorkspaces()
	const workspaces = workspacesResponse?.workspaces || []
	const [showCreateModal, setShowCreateModal] = useState(false)

	useEffect(() => {
		if (authLoading) {
			return
		}

		if (!user) {
			router.push('/login')
			return
		}

		if (!workspacesLoading && workspaces.length > 0) {
			router.push(`/${workspaces[0].workspaceId}`)
		}
	}, [user, authLoading, workspaces, workspacesLoading, router])

	const handleWorkspaceCreated = async () => {
		await refetch()
	}

	// Show loading state
	if (authLoading || workspacesLoading) {
		return (
			<div className='min-h-screen bg-gray-950 flex items-center justify-center'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4'></div>
					<p className='text-gray-400'>{authLoading ? 'Loading...' : 'Loading workspaces...'}</p>
				</div>
			</div>
		)
	}

	// Show create workspace prompt if no workspaces exist
	if (user && workspaces.length === 0) {
		return (
			<div className='min-h-screen bg-gray-950 flex items-center justify-center'>
				<div className='text-center max-w-md px-4'>
					<h1 className='text-2xl font-bold text-white mb-4'>Welcome to PaperNest!</h1>
					<p className='text-gray-400 mb-6'>
						You don't have any workspaces yet. Create your first workspace to get started.
					</p>
					<Button onClick={() => setShowCreateModal(true)}>Create Workspace</Button>

					<CreateWorkspaceModal
						isOpen={showCreateModal}
						onClose={() => setShowCreateModal(false)}
						onSuccess={handleWorkspaceCreated}
					/>
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gray-950 flex items-center justify-center'>
			<div className='text-center'>
				<div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4'></div>
				<p className='text-gray-400'>Redirecting...</p>
			</div>
		</div>
	)
}
