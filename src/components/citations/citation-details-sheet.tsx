import { FileText, Link as LinkIcon, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CitationDetailsSheetProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	citation: any
}

export function CitationDetailsSheet({
	open,
	onOpenChange,
	citation,
}: Readonly<CitationDetailsSheetProps>) {
	if (!citation) return null

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className='sm:max-w-md md:max-w-lg overflow-hidden flex flex-col p-0 gap-0'>
				<Tabs defaultValue='details' className='flex flex-col flex-1 min-h-0'>
					<SheetHeader className='shrink-0 border-b'>
						<SheetTitle className='sr-only'>Detail Sitasi</SheetTitle>
						<TabsList>
							<TabsTrigger value='details'>Detail Metadata</TabsTrigger>
							<TabsTrigger value='annotations'>
								Anotasi ({citation.annotationsCount || 0})
							</TabsTrigger>
						</TabsList>
					</SheetHeader>

					<ScrollArea className='flex-1'>
						<TabsContent value='details' className='p-6 m-0 space-y-6'>
							<div>
								<h3 className='text-lg font-bold text-gray-900'>{citation.title}</h3>
								<p className='text-gray-500 mt-1'>{citation.author}</p>
							</div>

							<div className='space-y-4'>
								<div className='grid grid-cols-3 gap-4'>
									<div className='text-sm text-gray-500'>Tipe</div>
									<div className='col-span-2 text-sm font-medium capitalize'>{citation.type}</div>
								</div>

								<div className='grid grid-cols-3 gap-4'>
									<div className='text-sm text-gray-500'>Publikasi</div>
									<div className='col-span-2 text-sm font-medium'>{citation.publicationInfo}</div>
								</div>

								<div className='grid grid-cols-3 gap-4'>
									<div className='text-sm text-gray-500'>Tahun</div>
									<div className='col-span-2 text-sm font-medium'>{citation.year}</div>
								</div>

								{citation.doi && (
									<div className='grid grid-cols-3 gap-4'>
										<div className='text-sm text-gray-500'>DOI</div>
										<div className='col-span-2 text-sm font-mono text-primary'>{citation.doi}</div>
									</div>
								)}

								{citation.url && (
									<div className='grid grid-cols-3 gap-4 pt-4 border-t border-gray-100'>
										<div className='text-sm text-gray-500'>URL</div>
										<div className='col-span-2'>
											<Button variant='outline' className='w-full justify-start' asChild>
												<a href={citation.url} target='_blank' rel='noopener noreferrer'>
													<LinkIcon className='h-4 w-4 mr-2' />
													Buka Tautan
												</a>
											</Button>
										</div>
									</div>
								)}
							</div>
						</TabsContent>

						<TabsContent value='annotations' className='p-6 m-0 space-y-4'>
							<div className='text-sm text-gray-500 mb-4'>
								Daftar bagian teks dimana sitasi ini digunakan.
							</div>

							{(citation.annotationsCount || 0) > 0 ? (
								<div className='space-y-4'>
									{Array.from({ length: citation.annotationsCount || 0 }).map((_, i) => (
										<div
											key={i.toLocaleString()}
											className='p-4 rounded-lg border border-gray-200 bg-gray-50'
										>
											<div className='flex items-start gap-3'>
												<MessageSquare className='h-5 w-5 text-gray-400 shrink-0 mt-0.5' />
												<div>
													<p className='text-sm text-gray-700 italic'>
														"...contoh kutipan dari dokumen yang menggunakan sitasi ini sebagai
														referensi..."
													</p>
													<div className='mt-2 flex items-center gap-2'>
														<FileText className='h-3 w-3 text-gray-400' />
														<span className='text-xs text-gray-500 font-medium'>
															Bab 1: Pendahuluan
														</span>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className='text-center py-12'>
									<MessageSquare className='h-12 w-12 text-gray-300 mx-auto mb-3' />
									<h4 className='text-sm font-medium text-gray-900'>Belum ada anotasi</h4>
									<p className='text-sm text-gray-500 mt-1'>
										Sitasi ini belum digunakan dalam dokumen manapun.
									</p>
								</div>
							)}
						</TabsContent>
					</ScrollArea>
				</Tabs>
			</SheetContent>
		</Sheet>
	)
}
