'use client'

import { Loader2, UserMinus } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import {
	useDeleteWorkspace,
	useRemoveMember,
	useUpdateWorkspace,
	useWorkspace,
	useWorkspaceMembers,
} from '@/lib/api/hooks/use-workspaces'
import { getErrorMessage } from '@/lib/api/utils/error-handler'
import { format } from '@/lib/date'
import { cn } from '@/lib/utils'

export default function WorkspaceSettingsPage() {
	const params = useParams()
	const router = useRouter()
	const workspaceId = params.workspaceid as string
	const { user } = useAuth()

	const { data: workspace, isLoading: workspaceLoading } = useWorkspace(workspaceId)
	const { data: membersData, isLoading: membersLoading } = useWorkspaceMembers(workspaceId)

	const { mutateAsync: updateWorkspace, isPending: updating } = useUpdateWorkspace()
	const { mutateAsync: deleteWorkspace } = useDeleteWorkspace()
	const { mutateAsync: removeMember, isPending: kicking } = useRemoveMember()

	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [showDeleteDialog, setShowDeleteDialog] = useState(false)
	const [kickTarget, setKickTarget] = useState<{ id: string; name: string } | null>(null)

	useEffect(() => {
		if (workspace) {
			setTitle(workspace.title)
			setDescription(workspace.description || '')
		}
	}, [workspace])

	const isOwner = user?.userId === workspace?.ownerId

	const handleUpdate = async () => {
		if (!title.trim()) return

		try {
			await updateWorkspace({
				id: workspaceId,
				data: {
					title: title.trim(),
					description: description.trim() || undefined,
				},
			})
			toast.success('Workspace updated successfully')
		} catch (err) {
			toast.error(getErrorMessage(err))
		}
	}

	const handleDelete = async () => {
		try {
			await deleteWorkspace(workspaceId)
			toast.success('Workspace deleted successfully')
			router.push('/')
		} catch (err) {
			toast.error(getErrorMessage(err))
		}
	}

	const handleKickMember = async () => {
		if (!kickTarget) return

		try {
			await removeMember({
				workspaceId,
				userWorkspaceId: kickTarget.id,
			})
			toast.success(`${kickTarget.name} has been removed from the workspace`)
			setKickTarget(null)
		} catch (err) {
			toast.error(getErrorMessage(err))
		}
	}

	if (workspaceLoading) {
		return (
			<div className='flex h-[calc(100vh-4rem)] items-center justify-center'>
				<Loader2 className='h-8 w-8 animate-spin text-primary' />
			</div>
		)
	}

	if (!workspace) return null

	return (
		<>
			{/* Top Bar */}
			<header className='flex h-16 shrink-0 items-center justify-between gap-2 px-4 bg-background border-b border-border sticky top-0 z-30 rounded-t-2xl'>
				<div className='flex items-center gap-2'>
					<SidebarTrigger className='-ml-1' />
					<Separator orientation='vertical' className='mr-2 h-4' />
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem className='hidden md:block'>
								<BreadcrumbLink
									href='#'
									onClick={(e) => {
										e.preventDefault()
										router.push('/')
									}}
								>
									PaperNest
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem className='hidden md:block'>
								<BreadcrumbLink
									href='#'
									onClick={(e) => {
										e.preventDefault()
										router.push(`/${workspaceId}`)
									}}
								>
									{workspace?.title}
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>Settings</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
				<div className='ml-auto'>
					<ThemeToggle />
				</div>
			</header>

			<main className='flex-1 p-6 w-full overflow-y-auto'>
				{/* Content Header Section */}
				<div className='mb-8 text-left'>
					<h2 className='text-2xl font-bold text-foreground'>Workspace Settings</h2>
					<p className='text-sm text-muted-foreground mt-1'>
						Manage configuration and member access for workspace {workspace?.title}
					</p>
				</div>

				<div className='space-y-12'>
					{/* General Configuration Section */}
					<section className='space-y-4'>
						<h3 className='text-lg font-semibold text-foreground'>General Configuration</h3>

						<div className='bg-card border border-border rounded-lg overflow-hidden shadow-sm'>
							<div className='p-6 space-y-10'>
								{/* Workspace Name Field - 50/50 Split */}
								<div className='flex flex-col sm:flex-row items-start gap-8 sm:gap-12'>
									<div className='w-full sm:w-1/2 space-y-1 text-left'>
										<h4 className='text-sm font-semibold text-foreground'>Workspace Name</h4>
										<p className='text-xs text-muted-foreground'>
											This name will be visible to all team members.
										</p>
									</div>
									<div className='w-full sm:w-1/2'>
										<Input
											value={title}
											onChange={(e) => setTitle(e.target.value)}
											className='h-9 text-sm w-full'
											placeholder='Workspace name'
										/>
									</div>
								</div>

								{/* Description Field - 50/50 Split */}
								<div className='flex flex-col sm:flex-row items-start gap-8 sm:gap-12'>
									<div className='w-full sm:w-1/2 space-y-1 text-left'>
										<h4 className='text-sm font-semibold text-foreground'>Description</h4>
										<p className='text-xs text-muted-foreground'>
											Provide a brief explanation of the purpose of this workspace.
										</p>
									</div>
									<div className='w-full sm:w-1/2'>
										<Textarea
											value={description}
											onChange={(e) => setDescription(e.target.value)}
											className='min-h-[120px] text-sm resize-none w-full'
											placeholder='Add description...'
										/>
									</div>
								</div>
							</div>

							{/* Single Footer Save Button */}
							<div className='bg-muted/30 border-t border-border p-4 flex justify-end'>
								<Button
									size='sm'
									onClick={handleUpdate}
									disabled={
										updating ||
										(title === workspace.title && description === (workspace.description || ''))
									}
									className='h-9 px-8 bg-primary hover:bg-primary/90'
								>
									{updating ? (
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

					{/* Members Management Section */}
					<section className='space-y-4'>
						<h3 className='text-lg font-semibold text-foreground'>Manage Members</h3>

						<div className='bg-card border border-border rounded-lg overflow-hidden shadow-sm'>
							<div className='divide-y divide-border'>
								{membersLoading
									? [1, 2, 3].map((id) => (
											<div key={id} className='flex items-center gap-4 p-6 animate-pulse'>
												<div className='w-10 h-10 bg-muted rounded-full' />
												<div className='flex-1 space-y-2'>
													<div className='h-4 bg-muted rounded w-1/4' />
													<div className='h-3 bg-muted rounded w-1/3' />
												</div>
											</div>
										))
									: membersData?.members.map((member) => (
											<div
												key={member.userWorkspaceId}
												className='flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-4 transition-all hover:bg-muted/30'
											>
												<div className='flex items-center gap-4'>
													<Avatar className='h-10 w-10 border border-border shadow-sm'>
														<AvatarImage src={member.user.photoURL || undefined} />
														<AvatarFallback className='bg-primary/5 text-primary text-xs font-bold'>
															{member.user.name?.substring(0, 2).toUpperCase() || '??'}
														</AvatarFallback>
													</Avatar>
													<div className='flex flex-col text-left'>
														<div className='flex items-center gap-2'>
															<span className='text-sm font-bold text-foreground'>
																{member.user.name}
															</span>
															{member.userId === user?.userId && (
																<span className='text-[9px] px-1.5 py-0 bg-muted text-muted-foreground font-bold uppercase rounded border border-border'>
																	You
																</span>
															)}
														</div>
														<span className='text-[12px] text-muted-foreground'>
															{member.user.email}
														</span>
													</div>
												</div>

												<div className='flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end'>
													<div className='text-left sm:text-right'>
														<Badge
															variant='outline'
															className={cn(
																'text-[10px] font-bold uppercase px-2 py-0.5',
																member.role === 'owner'
																	? 'border-amber-200/50 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300'
																	: 'bg-muted'
															)}
														>
															{member.role}
														</Badge>
														<p className='text-[10px] text-muted-foreground mt-1 text-left sm:text-right'>
															Joined {format(member.createdAt, 'd MMMM yyyy')}
														</p>
													</div>

													{isOwner && member.role !== 'owner' && (
														<button
															type='button'
															onClick={() =>
																setKickTarget({
																	id: member.userWorkspaceId,
																	name: member.user.name,
																})
															}
															className='inline-flex items-center justify-center h-9 w-9 rounded-md border border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors'
															title='Remove Member'
														>
															<UserMinus className='h-4 w-4' />
														</button>
													)}
												</div>
											</div>
										))}
							</div>
						</div>
					</section>

					{/* Danger Zone Section */}
					<section className='space-y-4'>
						<h3 className='text-lg font-semibold text-red-600'>Danger Zone</h3>

						<div className='bg-card border border-red-500/20 rounded-lg overflow-hidden shadow-sm'>
							<div className='flex flex-col sm:flex-row items-center justify-between p-6 gap-6 hover:bg-red-500/5 transition-colors'>
								<div className='space-y-1 flex-1 text-left'>
									<h4 className='text-sm font-semibold text-foreground'>Delete this workspace</h4>
									<p className='text-xs text-muted-foreground max-w-xl'>
										This action is permanent. All documents, members, and data associated with this
										workspace will be deleted forever.
									</p>
								</div>
								<div className='flex-shrink-0 w-full sm:w-auto'>
									<Button
										variant='destructive'
										onClick={() => setShowDeleteDialog(true)}
										className='h-9 px-6 text-sm font-medium w-full sm:w-auto'
									>
										Delete Workspace
									</Button>
								</div>
							</div>
						</div>
					</section>
				</div>
			</main>

			{/* Dialogs */}
			<ConfirmDialog
				isOpen={showDeleteDialog}
				onClose={() => setShowDeleteDialog(false)}
				onConfirm={handleDelete}
				title='Delete Workspace'
				message={`Are you sure you want to delete "${workspace.title}"? All data within it will be permanently lost.`}
				confirmText='Permanently Delete'
				variant='danger'
			/>

			<ConfirmDialog
				isOpen={kickTarget !== null}
				onClose={() => setKickTarget(null)}
				onConfirm={handleKickMember}
				title='Remove Member'
				message={`Are you sure you want to remove ${kickTarget?.name}? They will lose all access immediately.`}
				confirmText={kicking ? 'Removing...' : 'Remove Member'}
				variant='danger'
			/>
		</>
	)
}
