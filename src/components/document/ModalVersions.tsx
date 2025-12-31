import React, { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeft, MoreVertical } from 'lucide-react'

interface Version {
	id: string
	timestamp: string
	author: string
	color: string
	isCurrent?: boolean
}

interface ModalVersionsProps {
	isOpen: boolean
	onClose: () => void
}

const MOCK_VERSIONS: Version[] = [
	{
		id: '1',
		timestamp: '15 Agustus 2023, 16:51',
		author: 'Fa Ainama Caldera',
		color: 'bg-purple-500',
		isCurrent: true,
	},
	{
		id: '2',
		timestamp: '15 Agustus 2023, 16:15',
		author: 'Fa Ainama Caldera',
		color: 'bg-purple-500',
	},
	{
		id: '3',
		timestamp: '14 Agustus 2023, 14:30',
		author: 'Rangga',
		color: 'bg-orange-500',
	},
	{
		id: '4',
		timestamp: '14 Agustus 2023, 13:00',
		author: 'Rangga',
		color: 'bg-orange-500',
	},
]

export default function ModalVersions({ isOpen, onClose }: ModalVersionsProps) {
	const [selectedVersionId, setSelectedVersionId] = useState<string>('1')

	return (
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
							<span className='text-xs text-gray-500'>Nama Dokumen</span>
						</div>
					</div>

					<div className='flex items-center gap-2'></div>
				</div>

				<div className='flex-1 flex overflow-hidden'>
					<div className='flex-1 bg-gray-100 relative flex flex-col min-w-0'>
						<ScrollArea className='h-full w-full'>
							<div className='flex justify-center p-8 min-h-full'>
								<div className='bg-white shadow-sm w-[816px] min-h-[1056px] p-12 border border-gray-200'></div>
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
													{version.timestamp}
												</div>
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

						<div className='p-4 border-t'>
							{MOCK_VERSIONS.find((v) => v.id === selectedVersionId)?.isCurrent ? (
								<div className='text-center text-sm text-gray-500 py-2'>Versi saat ini</div>
							) : (
								<Button className='w-full'>Pulihkan versi ini</Button>
							)}
						</div>
					</div>
				</div>
			</div>
		</Modal>
	)
}
