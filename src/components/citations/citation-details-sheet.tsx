import { Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

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
				<SheetHeader className='p-6 shrink-0 border-b'>
					<SheetTitle className='text-xl font-bold'>Citation Details</SheetTitle>
				</SheetHeader>

				<ScrollArea className='flex-1'>
					<div className='p-6 space-y-6'>
						<div>
							<h3 className='text-lg font-bold text-gray-900'>{citation.title}</h3>
							<p className='text-gray-500 mt-1'>{citation.author}</p>
						</div>

						<div className='space-y-4'>
							<div className='grid grid-cols-3 gap-4'>
								<div className='text-sm text-gray-500'>Type</div>
								<div className='col-span-2 text-sm font-medium capitalize'>{citation.type}</div>
							</div>

							<div className='grid grid-cols-3 gap-4'>
								<div className='text-sm text-gray-500'>Publication</div>
								<div className='col-span-2 text-sm font-medium'>{citation.publicationInfo}</div>
							</div>

							<div className='grid grid-cols-3 gap-4'>
								<div className='text-sm text-gray-500'>Year</div>
								<div className='col-span-2 text-sm font-medium'>{citation.year || citation.publicationDate}</div>
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
												Open Link
											</a>
										</Button>
									</div>
								</div>
							)}
						</div>
					</div>
				</ScrollArea>
			</SheetContent>
		</Sheet>
	)
}
