import React, { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertCircle, ArrowLeft, MoreVertical, ShieldAlert } from 'lucide-react'
import { Version } from '@/types/index'

/*
	interface Version {
		id: string
		timestamp: string
		author: string
		color: string
		isCurrent?: boolean
	} 
*/

interface ModalVersionsProps {
	isOpen: boolean
	onClose: () => void
	// versions: Version[] <- will be used later
	documentTitle: string
	onDeleteVersion: (versionId: string) => void
}

const MOCK_VERSIONS: Version[] = [
	{
		id: '1',
		docId: 1,
		datetime: '15 Agustus 2023, 16:51',
		author: 'Fa Ainama Caldera',
		message: 'Latest version here',
		color: 'bg-purple-500',
		isCurrent: true,
	},
	{
		id: '2',
		docId: 1,
		datetime: '15 Agustus 2023, 16:15',
		author: 'Fa Ainama Caldera',
		message: 'Update Document 2 here',
		color: 'bg-purple-500',
	},
	{
		id: '3',
		docId: 1,
		datetime: '14 Agustus 2023, 14:30',
		author: 'Rangga',
		message: 'Update Document 1 here',
		color: 'bg-orange-500',
	},
	{
		id: '4',
		docId: 1,
		datetime: '14 Agustus 2023, 13:00',
		author: 'Rangga',
		message: 'First User version here',
		color: 'bg-orange-500',
	},
	{
		id: '5',
		docId: 1,
		datetime: '14 Agustus 2023, 11:00',
		author: 'System',
		message: 'Initial System Version',
		color: 'bg-gray-500',
		isSystem: true
	},
]

export default function ModalVersions({ isOpen, onClose, documentTitle, onDeleteVersion }: ModalVersionsProps) {
	const [selectedVersionId, setSelectedVersionId] = useState<string>(MOCK_VERSIONS[0]?.id || '')
	const [isWarningOpen, setIsWarningOpen] = useState(false)

	const selectedVersion = MOCK_VERSIONS.find(v => v.id === selectedVersionId)
	const isSystemVersion = selectedVersion?.message === 'Initial System Version'

	const handleDeleteRequest = () => 
	{
		if (isSystemVersion) 
		{
			setIsWarningOpen(true)
			return
		}
		
		onDeleteVersion(selectedVersionId)
	}

	return (
		<>
			<Modal
				isOpen={isOpen}
				onClose={onClose}
				size='full'
				showCloseButton={false}
				title='Riwayat versi'
				visuallyHiddenTitle={true}
			>
				<div className='flex flex-col h-screen w-full bg-white'>
					<div className='h-14 border-b flex items-center justify-between px-4 shrink-0'>
						<div className='flex items-center gap-4'>
							<Button
								variant='ghost'
								size='icon'
								onClick={onClose}
								className='rounded-full hover:bg-gray-100'
							>
								<ArrowLeft className='h-5 w-5 text-gray-600' />
							</Button>
							<div className='flex flex-col'>
								<span className='text-sm font-medium text-gray-900'>Riwayat versi</span>
								<span className='text-xs text-gray-500'>{documentTitle}</span>
							</div>
						</div>

						<div className='flex items-center gap-2'></div>
					</div>

					<div className='flex-1 flex overflow-hidden'>
						<div className='flex-1 bg-gray-100 relative flex flex-col min-w-0'>
							<ScrollArea className='h-full w-full'>
								<div className='flex justify-center p-8 min-h-full'>
									<div className='bg-white shadow-sm w-[816px] min-h-[1056px] p-12 border border-gray-200'>
										{/* Content Preview */}
										<h2 className='text-xl font-bold mb-4'>{selectedVersion?.message}</h2>
										<p className='text-gray-600'>{selectedVersion?.author} - {selectedVersion?.datetime}</p>
									</div>
								</div>
							</ScrollArea>
						</div>

						<div className='w-80 bg-white border-l shadow-sm flex flex-col shrink-0 z-10'>
							<div className='p-4 border-b flex items-center justify-between'>
								<h3 className='font-medium text-gray-700'>Riwayat versi</h3>
							</div>

							<ScrollArea className='flex-1'>
								<div className='py-2'>
									<div className='px-4 py-2 text-xs font-medium text-gray-500'>Hari ini</div>

									{MOCK_VERSIONS.map((version) => (
										<div
											key={version.id}
											onClick={() => setSelectedVersionId(version.id)}
											className={`px-4 py-3 cursor-pointer group transition-colors relative ${
												selectedVersionId === version.id ? 'bg-blue-50' : 'hover:bg-gray-50'
											}`}
										>
											<div className='flex items-start justify-between'>
												<div>
													<div className='text-sm font-medium text-gray-900 mb-1'>
														{version.message}
														{version.message === 'Initial System Version' && <ShieldAlert className='h-3 w-3 text-blue-500'/>}
													</div>
													<div className='text-xs text-gray-500'>{version.datetime}</div>
													<div className='flex items-center gap-2'>
														<div className={`w-2 h-2 rounded-full ${version.color}`} />
														<span className='text-xs text-gray-600'>{version.author}</span>
													</div>
												</div>
												<Button
													variant='ghost'
													size='icon'
													className='h-6 w-6 opacity-0 group-hover:opacity-100'
												>
													<MoreVertical className='h-4 w-4' />
												</Button>
											</div>
										</div>
									))}
								</div>
							</ScrollArea>

							<div className='p-4 border-t flex items-center gap-4'>
								{/* Left Side: Check and restore a version */}
								<div className='flex-1'>
									{MOCK_VERSIONS.find((v) => v.id === selectedVersionId)?.isCurrent ? (
									<div className='text-center text-sm text-gray-500 py-2'>Versi saat ini</div>
									) : (
									<Button className='w-full'>Pulihkan versi ini</Button>
									)}
								</div>

								{/* Right Side: The Delete Button */}
								<div className='flex-1'>
									<Button
									variant='destructive'
									className='w-full'
									onClick={handleDeleteRequest}>
										Delete Version
									</Button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Modal>

			{/* The specific Warning Modal requested */}
			<Modal
			isOpen={isWarningOpen}
			onClose={() => setIsWarningOpen(false)}
			title="System Protection"
			>
				<div className='p-6 text-center space-y-4'>
					<AlertCircle className='h-12 w-12 text-red-500 mx-auto' />
					<h3 className='text-lg font-semibold'>Tidak bisa menghapus Versi Awal</h3>
					<p className='text-sm text-gray-600'>
						Versi ini otomatis dibuat oleh sistem, sehingga tidak bisa dihapus manual.
						Untuk menghapusnya, kamu harus menghapus dokumen yang dibuat.
					</p>
					<Button className='w-full' onClick={() => setIsWarningOpen(false)}>
						Dapat dipahami
					</Button>
				</div>
			</Modal>
		</>
	)
}
