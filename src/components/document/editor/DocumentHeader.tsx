import {
	ChevronLeft,
	FileDown,
	GitCommit,
	History,
	MessageSquare,
	Play,
	Save,
	Share2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import LatexToolbar from '@/components/document/latex/LatexToolbar'
import { CommitModal } from '@/components/document/mergeview/CommitModal'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
	Menubar,
	MenubarCheckboxItem,
	MenubarContent,
	MenubarGroup,
	MenubarItem,
	MenubarLabel,
	MenubarMenu,
	MenubarRadioGroup,
	MenubarRadioItem,
	MenubarSeparator,
	MenubarShortcut,
	MenubarTrigger,
} from '@/components/ui/menubar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/context/AuthContext'
import { useDocumentReviews } from '@/lib/api/hooks/use-documents'
import { useWorkspaceMembers } from '@/lib/api/hooks/use-workspaces'
import { documentsService } from '@/lib/api/services/documents.service'
import { cn, getInitials, getMediaUrl } from '@/lib/utils'

interface DocumentHeaderProps {
	title: string
	setTitle: (title: string) => void

	handleSave: () => void
	isSaving: boolean
	isAutoSaving: boolean
	lastSavedAt?: string | number | Date
	activeDropdown: string | null
	toggleDropdown: (dropdown: string | null) => void
	paperSize: string
	setPaperSize: (size: string) => void
	paperSizeSubmenuOpen: boolean
	setPaperSizeSubmenuOpen: (open: boolean) => void
	workspaceId: string
	documentId: string
	onInsertSnippet: (snippet: string) => void
	getCurrentContent: () => string
	insertTable: (rows?: number, cols?: number) => void
	undo: () => void
	redo: () => void
	canUndo: boolean
	canRedo: boolean
	handleCompile: (content?: string) => void
	isCompiling: boolean
	viewMode: 'source' | 'visual'
	toggleViewMode: () => void
	visualEditor: any
	visibleCollaborators: any[]
	hiddenCollaboratorsCount: number
	compilerMode: 'client' | 'server' | 'server_pdflatex'
	onCompilerModeChange: (mode: 'client' | 'server' | 'server_pdflatex') => void
	syncToPdf?: () => void
	autoCompile?: boolean
	toggleAutoCompile?: () => void
	aiAssistantOpen?: boolean
	toggleAiAssistant?: () => void
	user?: any
	workspace?: any
	debugContentExtraction?: any
	pdfUrl?: string | null
	readOnly?: boolean
}

const DocumentHeader = ({
	title,
	setTitle,

	handleSave,
	isSaving,
	isAutoSaving,
	lastSavedAt,
	activeDropdown,
	toggleDropdown,
	paperSize,
	setPaperSize,
	paperSizeSubmenuOpen,
	setPaperSizeSubmenuOpen,
	workspaceId,
	documentId,

	// Editor props
	onInsertSnippet,
	getCurrentContent,
	insertTable,
	undo,
	redo,
	canUndo,
	canRedo,
	handleCompile,
	isCompiling,
	viewMode,
	toggleViewMode,
	visualEditor,
	visibleCollaborators,
	hiddenCollaboratorsCount,
	compilerMode,
	onCompilerModeChange,
	syncToPdf,
	autoCompile,
	toggleAutoCompile,
	aiAssistantOpen,
	toggleAiAssistant,
	workspace,
	pdfUrl,
	readOnly,
}: DocumentHeaderProps) => {
	const router = useRouter()
	const { user } = useAuth()
	const [showCommitModal, setShowCommitModal] = useState(false)
	const { data: reviewsResponse } = useDocumentReviews(documentId)

	const { data: membersResponse } = useWorkspaceMembers(workspaceId)

	// Safely determine pending reviews
	const reviews = Array.isArray(reviewsResponse)
		? reviewsResponse
		: (reviewsResponse as any)?.reviews || []
	const pendingReview = reviews.find((r: any) => r.status === 'PENDING' || r.status === 'pending')

	const canCommit = !pendingReview
	const commitBlockReason = pendingReview ? 'Waiting for pending review' : null

	// Find a lecturer to assign the review to
	const members = membersResponse?.members || []
	const lecturerMember = members.find((m: any) => m.user?.role === 'Lecturer')
	const _actualLecturerId = lecturerMember?.user?.userId || workspace?.ownerId

	const handleExportPdf = () => {
		if (!pdfUrl) {
			toast.error('Silakan compile dokumen terlebih dahulu untuk membuat PDF.')
			return
		}
		const link = document.createElement('a')
		link.href = pdfUrl
		link.download = `${title || 'document'}.pdf`
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		toast.success('PDF berhasil diexport!')
	}

	return (
		<header className='bg-background border-b border-border sticky top-0 z-[1001] transition-all duration-300'>
			<div className='px-4 py-2'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<Button
							variant='ghost'
							onClick={() => router.push(`/${workspaceId}`)}
							className='h-10 w-10 hover:bg-muted rounded-lg transition-all group p-0 min-w-0'
							title='Back to Workspace'
						>
							<ChevronLeft
								style={{ width: '20px', height: '20px' }}
								className='text-muted-foreground group-hover:text-primary transition-colors'
							/>
						</Button>
						<div className='flex flex-col'>
							<input
								type='text'
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								readOnly={readOnly}
								className='font-medium text-lg bg-transparent text-foreground focus:outline-none border-b border-transparent focus:border-blue-500 w-full'
								placeholder='Untitled Document'
							/>
							<div className='flex items-center gap-4 text-sm text-muted-foreground'>
								<Menubar className='border-none bg-transparent shadow-none p-0 h-auto gap-0.5'>
									{/* File Menu */}
									<MenubarMenu>
										<MenubarTrigger className='hover:bg-muted text-muted-foreground data-[state=open]:text-foreground font-normal px-2.5 py-1 rounded cursor-pointer text-sm h-8 data-[state=open]:bg-muted'>
											File
										</MenubarTrigger>
										<MenubarContent className='z-[1050] min-w-[12rem]'>
											<MenubarGroup>
												{!readOnly && (
													<MenubarItem onClick={handleSave}>
														<Save className='mr-2 h-4 w-4 text-muted-foreground' />
														<span>Save</span>
														<MenubarShortcut>Ctrl+S</MenubarShortcut>
													</MenubarItem>
												)}

												<MenubarItem
													onClick={() => {
														const content = getCurrentContent ? getCurrentContent() : ''
														handleCompile(content)
													}}
												>
													<Play className='mr-2 h-4 w-4 text-muted-foreground' />
													<span>Compile Now</span>
												</MenubarItem>

												<MenubarCheckboxItem
													checked={autoCompile}
													onCheckedChange={toggleAutoCompile}
												>
													Auto Compile
												</MenubarCheckboxItem>
											</MenubarGroup>

											<MenubarSeparator />

											<MenubarGroup>
												<MenubarItem
													onClick={handleExportPdf}
													className='text-blue-600 focus:text-blue-700 font-medium'
												>
													<FileDown className='mr-2 h-4 w-4 text-blue-600 focus:text-blue-700' />
													<span>Export PDF</span>
												</MenubarItem>
											</MenubarGroup>
										</MenubarContent>
									</MenubarMenu>

									{/* History Menu */}
									<MenubarMenu>
										<MenubarTrigger className='hover:bg-muted text-muted-foreground data-[state=open]:text-foreground font-normal px-2.5 py-1 rounded cursor-pointer text-sm h-8 data-[state=open]:bg-muted'>
											History
										</MenubarTrigger>
										<MenubarContent className='z-[1050] min-w-[12rem]'>
											<MenubarGroup>
												{!readOnly && (
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger asChild>
																<div className='w-full'>
																	<MenubarItem
																		disabled={!canCommit}
																		onClick={() => setShowCommitModal(true)}
																	>
																		<GitCommit className='mr-2 h-4 w-4 text-muted-foreground' />
																		<span>Commit Version...</span>
																	</MenubarItem>
																</div>
															</TooltipTrigger>
															{!canCommit && (
																<TooltipContent side='right' className='z-[1100]'>
																	<p>{commitBlockReason || 'Waiting for review'} (Check History)</p>
																</TooltipContent>
															)}
														</Tooltip>
													</TooltipProvider>
												)}

												<MenubarItem
													onClick={() =>
														router.push(`/${workspaceId}/documents/${documentId}/versions`)
													}
												>
													<History className='mr-2 h-4 w-4 text-muted-foreground' />
													<span>Version History</span>
												</MenubarItem>
											</MenubarGroup>
										</MenubarContent>
									</MenubarMenu>

									{/* Settings Menu */}
									<MenubarMenu>
										<MenubarTrigger className='hover:bg-muted text-muted-foreground data-[state=open]:text-foreground font-normal px-2.5 py-1 rounded cursor-pointer text-sm h-8 data-[state=open]:bg-muted'>
											Settings
										</MenubarTrigger>
										<MenubarContent className='z-[1050] min-w-[14rem]'>
											<MenubarGroup>
												<MenubarLabel className='px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
													Compiler Mode
												</MenubarLabel>
												<MenubarRadioGroup
													value={compilerMode}
													onValueChange={(val) => onCompilerModeChange(val as any)}
												>
													<MenubarRadioItem value='server'>
														Server Tectonic (Cloud)
													</MenubarRadioItem>
													<MenubarRadioItem value='server_pdflatex'>
														Server pdfLaTeX (Cloud)
													</MenubarRadioItem>
												</MenubarRadioGroup>
											</MenubarGroup>
										</MenubarContent>
									</MenubarMenu>
								</Menubar>
							</div>
						</div>
					</div>

					<div className='flex items-center gap-3'>
						<div className='flex items-center gap-2'>
							{(isAutoSaving || lastSavedAt) && (
								<div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
									{isAutoSaving ? (
										<>
											<div className='w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse'></div>
											<span>Saving...</span>
										</>
									) : (
										<>
											<div className='w-1.5 h-1.5 bg-green-500 rounded-full'></div>
											<span>Saved {lastSavedAt && new Date(lastSavedAt).toLocaleTimeString()}</span>
										</>
									)}
								</div>
							)}

							{visibleCollaborators && visibleCollaborators.length > 0 && (
								<div className='flex items-center gap-1.5 pr-2 mr-1 border-r border-border'>
									<div className='flex -space-x-3'>
										{visibleCollaborators.map((collaborator: any) => (
											<Avatar
												key={collaborator.id}
												className='h-8 w-8 border-2 border-background shadow-sm'
												title={collaborator.name}
											>
												<AvatarImage src={collaborator.avatar} alt={collaborator.name} />
												<AvatarFallback
													className='text-xs font-semibold text-white'
													style={{ backgroundColor: collaborator.color }}
												>
													{getInitials(collaborator.name)}
												</AvatarFallback>
											</Avatar>
										))}
									</div>
									{hiddenCollaboratorsCount > 0 && (
										<span className='text-xs font-medium text-muted-foreground'>
											+{hiddenCollaboratorsCount}
										</span>
									)}
								</div>
							)}

							{!readOnly && (
								<Button
									variant='outline'
									size='sm'
									className='gap-1'
									onClick={handleSave}
									disabled={isSaving || isAutoSaving}
								>
									{isSaving ? 'Saving...' : 'Save'}
								</Button>
							)}
						</div>
						<Button variant='outline' size='sm' className='gap-1'>
							<Share2 className='h-4 w-4' />
							Share
						</Button>
						<Button
							variant='outline'
							onClick={toggleAiAssistant}
							className={cn(
								'group relative overflow-hidden border-0 rounded-md p-[1.5px] transition-all duration-300 h-9 w-auto',
								aiAssistantOpen ? 'ring-2 ring-primary/20 shadow-lg' : ''
							)}
							title='AI Assistant'
						>
							{/* Rotating Gradient Background */}
							<span
								className={cn(
									'absolute inset-[-100px] bg-[conic-gradient(from_0deg,var(--primary),var(--warning),var(--primary))] z-0',
									aiAssistantOpen
										? 'animate-[spin_2s_linear_infinite]'
										: 'animate-[spin_4s_linear_infinite]'
								)}
							/>
							{/* Inner Container */}
							<span
								className={cn(
									'relative flex items-center justify-center gap-2 px-3 h-full w-full bg-white dark:bg-background rounded-[4.5px] text-foreground transition-colors z-10 hover:bg-accent',
									aiAssistantOpen
										? 'text-primary hover:text-primary'
										: 'hover:text-accent-foreground'
								)}
							>
								<MessageSquare
									className={cn(
										'h-4 w-4 z-20 transition-colors duration-200',
										aiAssistantOpen
											? 'text-primary'
											: 'text-muted-foreground group-hover:text-foreground'
									)}
								/>
								<span
									className={cn(
										'text-sm font-medium z-20 select-none transition-colors duration-200',
										aiAssistantOpen
											? 'text-primary'
											: 'text-gray-700 dark:text-gray-300 group-hover:text-foreground'
									)}
								>
									Agentic AI
								</span>
							</span>
						</Button>
						<ThemeToggle />
						<div className='ml-2'>
							<Avatar className='h-8 w-8'>
								<AvatarImage src={getMediaUrl(user?.photoURL)} alt={user?.name || 'User'} />
								<AvatarFallback className='bg-primary text-primary-foreground text-xs'>
									{getInitials(user?.name || 'U')}
								</AvatarFallback>
							</Avatar>
						</div>
					</div>
				</div>
			</div>

			{/* Commit Modal */}
			<CommitModal
				isOpen={showCommitModal}
				onClose={() => setShowCommitModal(false)}
				onCommit={async (data) => {
					try {
						const content = getCurrentContent ? getCurrentContent() : ''
						await documentsService.createVersion(documentId, {
							message: data.message,
							content: content,
						})

						toast.success('Version committed successfully')
						setShowCommitModal(false)
					} catch (error) {
						console.error('Failed to commit version:', error)
						throw error // Re-throw so Modal can handle it/show error
					}
				}}
			/>

			{/* Editor Toolbar - sticky di bawah header */}
			{!readOnly && (
				<LatexToolbar
					onInsertSnippet={onInsertSnippet}
					insertTable={insertTable}
					undo={undo}
					redo={redo}
					canUndo={canUndo}
					canRedo={canRedo}
					handleCompile={handleCompile}
					isCompiling={isCompiling}
					viewMode={viewMode}
					toggleViewMode={toggleViewMode}
					visualEditor={visualEditor}
					compilerMode={compilerMode}
					onCompilerModeChange={onCompilerModeChange}
					onSyncToPdf={syncToPdf}
					autoCompile={autoCompile}
					toggleAutoCompile={toggleAutoCompile}
				/>
			)}
		</header>
	)
}

export default DocumentHeader
