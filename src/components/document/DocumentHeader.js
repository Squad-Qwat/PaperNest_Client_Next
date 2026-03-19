import { ChevronLeft, GitCommit, History, MessageSquare, RefreshCw, Share2, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { CommitModal } from '@/components/document/CommitModal'
import LatexToolbar from '@/components/document/LatexToolbar'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useDocumentReviews } from '@/hooks/useDocumentVersions'
import { documentsService } from '@/lib/api/services/documents.service'

const DocumentHeader = ({
	title,
	setTitle,
	aiAssistantOpen,
	toggleModalVersions,
	toggleAiAssistant,
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
	user,
	workspaceId,
	documentId,
	// Editor props
	editor,
	insertTable,
	undo,
	redo,
	canUndo,
	canRedo,
	handleCompile,
	isCompiling,
	visibleCollaborators,
	hiddenCollaboratorsCount,
	debugContentExtraction,
}) => {
	const [isSyncing, setIsSyncing] = useState(false)
	const [showCommitModal, setShowCommitModal] = useState(false)
	const { canCommit, commitBlockReason } = useDocumentReviews(documentId)

	return (
		<header className='bg-white border-b border-gray-200 sticky top-0 z-[1001] transition-all duration-300'>
			<div className='px-4 py-2'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-4'>
						<Link href={`/${workspaceId}`} className='p-2 rounded-full hover:bg-gray-100'>
							<ChevronLeft className='h-5 w-5 text-gray-600' />
						</Link>
						<div className='flex flex-col'>
							<input
								type='text'
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								className='font-medium text-lg text-gray-900 focus:outline-none border-b border-transparent focus:border-blue-500 w-full'
								placeholder='Untitled Document'
							/>
							<div className='flex items-center gap-4 text-sm text-gray-600'>
								<div
									className='dropdown-trigger hover:bg-gray-100 px-1 py-1 rounded relative cursor-pointer'
									onClick={() => toggleDropdown('file')}
								>
									File
									{activeDropdown === 'file' && (
										<div className='dropdown-menu absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-48 z-50'>
											{/* ... existing file menu items ... */}
											{/* Copied existing logic but removed clutter for brevity in replacement if possible, but replace_file_content needs strict match. 
                                                Since match is hard with large blocks, I will target specific imports and the button area separately or use multi_replace.
                                                Wait, I should use multi_replace if I can't match the whole file easily.
                                                Actually, I will just rewrite the imports and the button part.
                                             */}
											<div className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer'>
												<svg
													className='h-4 w-4'
													viewBox='0 0 24 24'
													fill='none'
													stroke='currentColor'
													strokeWidth='2'
												>
													<path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'></path>
													<polyline points='14,2 14,8 20,8'></polyline>
												</svg>
												New Document
											</div>
											<div className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer'>
												<svg
													className='h-4 w-4'
													viewBox='0 0 24 24'
													fill='none'
													stroke='currentColor'
													strokeWidth='2'
												>
													<path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'></path>
													<polyline points='14,2 14,8 20,8'></polyline>
												</svg>
												Open
											</div>
											<div className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer'>
												<svg
													className='h-4 w-4'
													viewBox='0 0 24 24'
													fill='none'
													stroke='currentColor'
													strokeWidth='2'
												>
													<path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z'></path>
													<polyline points='17,21 17,13 7,13 7,21'></polyline>
													<polyline points='7,3 7,8 15,8'></polyline>
												</svg>
												Save
											</div>
											<div
												className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer'
												onClick={handleSave}
											>
												<svg
													className='h-4 w-4'
													viewBox='0 0 24 24'
													fill='none'
													stroke='currentColor'
													strokeWidth='2'
												>
													<path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z'></path>
													<polyline points='17,21 17,13 7,13 7,21'></polyline>
													<polyline points='7,3 7,8 15,8'></polyline>
												</svg>
												Save As
											</div>
											<hr className='my-1' />
											<div className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer'>
												<svg
													className='h-4 w-4'
													viewBox='0 0 24 24'
													fill='none'
													stroke='currentColor'
													strokeWidth='2'
												>
													<polyline points='6,9 6,2 18,2 18,9'></polyline>
													<path d='M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2'></path>
													<rect x='6' y='14' width='12' height='8'></rect>
												</svg>
												Print
											</div>
											<div className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer'>
												<svg
													className='h-4 w-4'
													viewBox='0 0 24 24'
													fill='none'
													stroke='currentColor'
													strokeWidth='2'
												>
													<path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'></path>
													<polyline points='7,10 12,15 17,10'></polyline>
													<line x1='12' y1='15' x2='12' y2='3'></line>
												</svg>
												Download
											</div>
											<hr className='my-1' />
											<div className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer'>
												<svg
													className='h-4 w-4'
													viewBox='0 0 24 24'
													fill='none'
													stroke='currentColor'
													strokeWidth='2'
												>
													<path d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'></path>
													<rect x='8' y='2' width='8' height='4' rx='1' ry='1'></rect>
												</svg>
												Make a Copy
											</div>
											<div className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer'>
												<Share2 className='h-4 w-4' />
												Share
											</div>
										</div>
									)}
								</div>

								<div
									className='dropdown-trigger hover:bg-gray-100 px-1 py-1 rounded relative cursor-pointer'
									onClick={() => toggleDropdown('appearance')}
								>
									Appearance
									{activeDropdown === 'appearance' && (
										<div className='dropdown-menu absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-56 z-50'>
											<div className='px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide'>
												Page Setup
											</div>
											<div
												className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between cursor-pointer relative'
												onMouseEnter={() => setPaperSizeSubmenuOpen(true)}
												onMouseLeave={() => setPaperSizeSubmenuOpen(false)}
											>
												<span className='flex items-center gap-2'>
													<svg
														className='h-4 w-4'
														viewBox='0 0 24 24'
														fill='none'
														stroke='currentColor'
														strokeWidth='2'
													>
														<rect x='3' y='3' width='18' height='18' rx='2' ry='2'></rect>
													</svg>
													Paper Size
												</span>
												<span className='text-gray-500 text-sm'>{paperSize}</span>

												{/* Paper Size Submenu */}
												{paperSizeSubmenuOpen && (
													<div
														className='absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-40 z-60'
														onMouseEnter={() => setPaperSizeSubmenuOpen(true)}
														onMouseLeave={() => setPaperSizeSubmenuOpen(false)}
													>
														<div
															className={`w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center justify-between ${paperSize === 'A4' ? 'bg-blue-50 text-blue-700' : ''}`}
															onClick={() => {
																setPaperSize('A4')
																toggleDropdown(null)
															}}
														>
															<span>A4</span>
															{paperSize === 'A4' && (
																<svg
																	className='h-4 w-4 text-blue-700'
																	viewBox='0 0 24 24'
																	fill='none'
																	stroke='currentColor'
																	strokeWidth='2'
																>
																	<polyline points='20,6 9,17 4,12'></polyline>
																</svg>
															)}
														</div>
														<div
															className={`w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center justify-between ${paperSize === 'A3' ? 'bg-blue-50 text-blue-700' : ''}`}
															onClick={() => {
																setPaperSize('A3')
																toggleDropdown(null)
															}}
														>
															<span>A3</span>
															{paperSize === 'A3' && (
																<svg
																	className='h-4 w-4 text-blue-700'
																	viewBox='0 0 24 24'
																	fill='none'
																	stroke='currentColor'
																	strokeWidth='2'
																>
																	<polyline points='20,6 9,17 4,12'></polyline>
																</svg>
															)}
														</div>
													</div>
												)}
											</div>
											<div className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between cursor-pointer'>
												<span className='flex items-center gap-2'>
													<svg
														className='h-4 w-4'
														viewBox='0 0 24 24'
														fill='none'
														stroke='currentColor'
														strokeWidth='2'
													>
														<rect x='2' y='3' width='20' height='14' rx='2' ry='2'></rect>
														<line x1='8' y1='21' x2='16' y2='21'></line>
														<line x1='12' y1='17' x2='12' y2='21'></line>
													</svg>
													Orientation
												</span>
												<span className='text-gray-500 text-sm'>Portrait</span>
											</div>
										</div>
									)}
								</div>

								<div
									className='dropdown-trigger hover:bg-gray-100 px-1 py-1 rounded relative cursor-pointer'
									onClick={() => toggleDropdown('settings')}
								>
									Settings
									{activeDropdown === 'settings' && (
										<div className='dropdown-menu absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-52 z-50'>
											<div className='px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide'>
												Editor Settings
											</div>
											<div className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between cursor-pointer'>
												<span className='flex items-center gap-2'>
													<svg
														className='h-4 w-4'
														viewBox='0 0 24 24'
														fill='none'
														stroke='currentColor'
														strokeWidth='2'
													>
														<path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'></path>
														<polyline points='14,2 14,8 20,8'></polyline>
														<line x1='16' y1='13' x2='8' y2='13'></line>
														<line x1='16' y1='17' x2='8' y2='17'></line>
														<polyline points='10,9 9,9 8,9'></polyline>
													</svg>
													Auto Save
												</span>
												<span className='text-green-500 text-sm'>On</span>
											</div>
											<div className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between cursor-pointer'>
												<span className='flex items-center gap-2'>
													<svg
														className='h-4 w-4'
														viewBox='0 0 24 24'
														fill='none'
														stroke='currentColor'
														strokeWidth='2'
													>
														<path d='M3 3h18v18H3zM9 9h6v6H9z'></path>
													</svg>
													Spell Check
												</span>
												<span className='text-green-500 text-sm'>On</span>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>

					<div className='flex items-center gap-3'>
						<div className='flex items-center gap-2'>
														{(isAutoSaving || lastSavedAt) && (
								<div className='flex items-center gap-1.5 text-xs text-gray-500'>
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
								<div className="flex items-center gap-1.5 pr-2 mr-1 border-r border-gray-200">
									<div className="flex -space-x-3">
										{visibleCollaborators.map((collaborator) => (
											<Avatar
												key={collaborator.id}
												className="h-8 w-8 border-2 border-white shadow-sm"
												title={collaborator.name}
											>
												<AvatarImage src={collaborator.avatar} alt={collaborator.name} />
												<AvatarFallback
													className="text-xs font-semibold text-white"
													style={{ backgroundColor: collaborator.color }}
												>
													{collaborator.name.charAt(0).toUpperCase()}
												</AvatarFallback>
											</Avatar>
										))}
									</div>
									{hiddenCollaboratorsCount > 0 && (
										<span className="text-xs font-medium text-gray-500">
											+{hiddenCollaboratorsCount}
										</span>
									)}
								</div>
							)}

							<Button
								variant='outline'
								size='sm'
								className='gap-1'
								onClick={handleSave}
								disabled={isSaving || isAutoSaving}
							>
								{isSaving ? 'Saving...' : 'Save'}
							</Button>
						</div>
						<Button variant='outline' size='sm' className='gap-1'>
							<Share2 className='h-4 w-4' />
							Share
						</Button>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<span className='inline-block'>
										{' '}
										{/* Wrapper for disabled button to show tooltip */}
										<Button
											variant='outline'
											size='sm'
											className='ga p-1'
											onClick={() => setShowCommitModal(true)}
											disabled={!canCommit}
										>
											<GitCommit className='h-4 w-4' />
											Commit
										</Button>
									</span>
								</TooltipTrigger>
								{!canCommit && (
									<TooltipContent>
										<p>{commitBlockReason || 'Waiting for review'} (Check History)</p>
									</TooltipContent>
								)}
							</Tooltip>
						</TooltipProvider>

						<Button
							variant='ghost'
							size='icon'
							onClick={toggleAiAssistant}
							className={aiAssistantOpen ? 'bg-primary/20 text-primary' : ''}
						>
							<MessageSquare className='h-5 w-5' />
						</Button>

						<Button
							variant='ghost'
							size='icon'
							onClick={toggleModalVersions}
							title='History & Reviews'
						>
							<History className='h-5 w-5' />
						</Button>
						<div className='ml-2 flex items-center gap-2'>
							{user?.avatar
								? <img
										src={user.avatar}
										alt={user.name || 'User'}
										className='h-8 w-8 rounded-full'
									/>
								: <div className='h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center'>
										<span className='text-white text-sm font-medium'>
											{user?.name?.charAt(0) || 'U'}
										</span>
									</div>}
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
						// We also need content usually, but the API doc says content string.
						// If editor content is available, pass it.
						// `editor` prop is available. `editor.getHTML()` or `JSON`.
						const content = editor ? editor.state.doc.toString() : ''
						await documentsService.createVersion(documentId, {
							message: data.message,
							content: content,
						})
						// Refresh versions or notify success
						setShowCommitModal(false)
						// TODO: trigger version refresh if needed
						// Maybe toast.success('Version created')
					} catch (error) {
						console.error('Failed to commit version:', error)
						throw error // Re-throw so Modal can handle it/show error
					}
				}}
			/>

			{/* Editor Toolbar - sticky di bawah header */}
			<LatexToolbar
				editor={editor}
				insertTable={insertTable}
				undo={undo}
				redo={redo}
				canUndo={canUndo}
				canRedo={canRedo}
				handleCompile={handleCompile}
				isCompiling={isCompiling}
			/>
		</header>
	)
}

export default DocumentHeader
