'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetFooter,
	SheetDescription,
} from '@/components/ui/sheet'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Field, FieldLabel } from '@/components/ui/field'

interface Author {
	id: string
	name: string
}

export interface Citation {
	citationId?: string
	documentId?: string
	type: string
	title: string
	author: string
	publicationInfo: string
	doi: string | null
	accessDate?: string
	publicationDate: string
	url: string | null
	cslJson: Record<string, any>
}

interface CitationSheetProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSave: (data: Partial<Citation>) => void
	initialData?: Partial<Citation>
}

export function CitationSheet({
	open,
	onOpenChange,
	onSave,
	initialData,
}: Readonly<CitationSheetProps>) {
	const [type, setType] = useState('article')
	const [title, setTitle] = useState('')
	const [authors, setAuthors] = useState<Author[]>([{ id: '1', name: '' }])
	const [journal, setJournal] = useState('')
	const [year, setYear] = useState('')
	const [pageFrom, setPageFrom] = useState('')
	const [pageTo, setPageTo] = useState('')
	const [volume, setVolume] = useState('')
	const [issue, setIssue] = useState('')
	const [doi, setDoi] = useState('')
	const [identifier, setIdentifier] = useState('')
	const [url, setUrl] = useState('')

	useEffect(() => {
		if (initialData && open) {
			setType(initialData.type || 'article')
			setTitle(initialData.title || '')
			setDoi(initialData.doi || '')
			setUrl(initialData.url || '')
			setYear(initialData.publicationDate || '')
			
			// Parse authors
			if (initialData.author) {
				const authorList = initialData.author.split('; ').map((name: string, index: number) => ({
					id: String(index + 1),
					name,
				}))
				setAuthors(authorList.length > 0 ? authorList : [{ id: '1', name: '' }])
			} else {
				setAuthors([{ id: '1', name: '' }])
			}

			// Parse publication info if possible (simplified)
			if (initialData.cslJson) {
				const csl = initialData.cslJson
				setJournal(csl.containerTitle || '')
				setVolume(csl.volume || '')
				setIssue(csl.issue || '')
				if (csl.page) {
					const [from, to] = String(csl.page).split('-')
					setPageFrom(from || '')
					setPageTo(to || '')
				}
			}
		} else if (open) {
			// Reset form for new entry
			setType('article')
			setTitle('')
			setAuthors([{ id: '1', name: '' }])
			setJournal('')
			setYear('')
			setPageFrom('')
			setPageTo('')
			setVolume('')
			setIssue('')
			setDoi('')
			setIdentifier('')
			setUrl('')
		}
	}, [initialData, open])

	const addAuthor = () => {
		setAuthors([...authors, { id: Math.random().toString(36).slice(2, 11), name: '' }])
	}

	const updateAuthor = (id: string, name: string) => {
		setAuthors(authors.map((a) => (a.id === id ? { ...a, name } : a)))
	}

	const removeAuthor = (id: string) => {
		if (authors.length > 1) {
			setAuthors(authors.filter((a) => a.id !== id))
		} else {
			setAuthors([{ id: '1', name: '' }])
		}
	}

	const handleSave = () => {
		const authorString = authors
			.map((a) => a.name.trim())
			.filter(Boolean)
			.join('; ')

		const pubInfoParts = []
		if (journal) pubInfoParts.push(journal)
		if (volume) pubInfoParts.push(`Vol. ${volume}`)
		if (issue) pubInfoParts.push(`No. ${issue}`)
		if (pageFrom || pageTo) pubInfoParts.push(`pp. ${pageFrom}-${pageTo}`)
		if (year) pubInfoParts.push(`(${year})`)

		const publicationInfo = pubInfoParts.join(', ')

		const data: Partial<Citation> = {
			type,
			title,
			author: authorString,
			publicationInfo,
			doi: doi || identifier || null,
			publicationDate: year,
			url: url || null,
			cslJson: {
				title,
				author: authors.map(a => {
					const parts = a.name.split(',')
					return {
						family: parts[0]?.trim() || '',
						given: parts[1]?.trim() || ''
					}
				}),
				containerTitle: journal,
				volume,
				issue,
				page: pageFrom && pageTo ? `${pageFrom}-${pageTo}` : (pageFrom || pageTo || ''),
				issued: { 'date-parts': [[year]] },
				DOI: doi || identifier,
				URL: url,
			}
		}

		onSave(data)
		onOpenChange(false)
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className='sm:max-w-md md:max-w-lg overflow-hidden flex flex-col p-0 gap-0'>
				<SheetHeader className='p-6 shrink-0 border-b'>
					<SheetTitle className='text-xl font-bold'>
						{initialData ? 'Update Sitasi' : 'Tambah Sitasi'}
					</SheetTitle>
					<SheetDescription>
						Masukkan informasi sitasi secara manual atau cari berdasarkan identifier.
					</SheetDescription>
				</SheetHeader>

				<ScrollArea className='flex-1 min-h-0'>
					<div className='space-y-8'>
						{/* Identifiers Section */}
						<div className='p-6 space-y-3 bg-muted border-b'>
							<Label className='text-sm font-semibold text-gray-700'>
								Identifiers (ArXivID, DOI, PMID or ISBN)
							</Label>
							<div className='flex gap-2'>
								<Input
									placeholder='Enter identifier (e.g. 10.1038/nature12345)'
									className='flex-1 bg-white border-gray-200 focus-visible:ring-primary/20'
									value={identifier}
									onChange={(e) => setIdentifier(e.target.value)}
								/>
								<Button size='icon' variant='outline' className='shrink-0 bg-white border-gray-200 hover:bg-gray-50'>
									<Search className='h-4 w-4' />
								</Button>
							</div>
							<p className='text-[13px] text-gray-500'>
								Enter identifiers and look up for metadata.
							</p>
						</div>

						{/* Reference Section */}
						<div className='space-y-6 px-6 pb-6'>
							<Field>
								<FieldLabel className='text-sm font-semibold text-gray-700'>Reference Type</FieldLabel>
								<Select value={type} onValueChange={setType}>
									<SelectTrigger className='bg-white border-gray-200'>
										<SelectValue placeholder='Journal Article' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='article'>Journal Article</SelectItem>
										<SelectItem value='book'>Book</SelectItem>
										<SelectItem value='website'>Website</SelectItem>
										<SelectItem value='conference'>Conference Paper</SelectItem>
										<SelectItem value='report'>Report</SelectItem>
										<SelectItem value='thesis'>Thesis</SelectItem>
									</SelectContent>
								</Select>
							</Field>

							<Field>
								<FieldLabel className='text-sm font-semibold text-gray-700'>Title</FieldLabel>
								<Input
									placeholder='Citation title'
									className='bg-white border-gray-200'
									value={title}
									onChange={(e) => setTitle(e.target.value)}
								/>
							</Field>

							<div className='space-y-3'>
								<FieldLabel className='text-sm font-semibold text-gray-700'>Authors</FieldLabel>
								<p className='text-[13px] text-gray-500'>
									Please enter author names as 'last name, first name' (e.g. 'Smith, Jane').
								</p>
								<div className='space-y-2'>
									{authors.map((author) => (
										<div key={author.id} className='flex gap-2 group'>
											<Input
												placeholder='Smith, Jane'
												className='bg-white border-gray-200'
												value={author.name}
												onChange={(e) => updateAuthor(author.id, e.target.value)}
											/>
											<Button
												variant='ghost'
												size='icon'
												className='shrink-0 text-gray-400 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity'
												onClick={() => removeAuthor(author.id)}
											>
												<Trash2 className='h-4 w-4' />
											</Button>
										</div>
									))}
									<Button
										variant='ghost'
										size='sm'
										className='w-fit p-0 h-auto text-primary hover:bg-transparent hover:text-primary/80 font-medium flex items-center mt-1'
										onClick={addAuthor}
									>
										<div className='bg-primary/10 rounded-full p-0.5 mr-2'>
											<Plus className='h-3 w-3' />
										</div>
										Add another author
									</Button>
								</div>
							</div>

							<Field>
								<FieldLabel className='text-sm font-semibold text-gray-700'>Journal / Publication</FieldLabel>
								<Input
									className='bg-white border-gray-200'
									placeholder='e.g. Nature, Science, etc.'
									value={journal}
									onChange={(e) => setJournal(e.target.value)}
								/>
							</Field>

							<div className='grid grid-cols-2 gap-6'>
								<Field>
									<FieldLabel className='text-sm font-semibold text-gray-700'>Year</FieldLabel>
									<Input
										className='bg-white border-gray-200'
										placeholder='e.g. 2023'
										value={year}
										onChange={(e) => setYear(e.target.value)}
									/>
								</Field>
								<Field>
									<FieldLabel className='text-sm font-semibold text-gray-700'>Pages</FieldLabel>
									<div className='flex items-center gap-2'>
										<Input
											placeholder='from'
											className='bg-white border-gray-200'
											value={pageFrom}
											onChange={(e) => setPageFrom(e.target.value)}
										/>
										<span className='text-gray-400 font-light'>—</span>
										<Input
											placeholder='to'
											className='bg-white border-gray-200'
											value={pageTo}
											onChange={(e) => setPageTo(e.target.value)}
										/>
									</div>
								</Field>
							</div>

							<div className='grid grid-cols-2 gap-6'>
								<Field>
									<FieldLabel className='text-sm font-semibold text-gray-700'>Volume</FieldLabel>
									<Input
										className='bg-white border-gray-200'
										value={volume}
										onChange={(e) => setVolume(e.target.value)}
									/>
								</Field>
								<Field>
									<FieldLabel className='text-sm font-semibold text-gray-700'>Issue</FieldLabel>
									<Input
										className='bg-white border-gray-200'
										value={issue}
										onChange={(e) => setIssue(e.target.value)}
									/>
								</Field>
							</div>
							
							<Field>
								<FieldLabel className='text-sm font-semibold text-gray-700'>URL</FieldLabel>
								<Input
									placeholder='https://...'
									className='bg-white border-gray-200'
									value={url}
									onChange={(e) => setUrl(e.target.value)}
								/>
							</Field>
						</div>
					</div>
				</ScrollArea>

				<SheetFooter className='p-6 border-t border-gray-100 bg-gray-50/80 shrink-0 flex-row gap-3 sm:justify-end'>
					<Button
						variant='ghost'
						className='flex-1 sm:flex-none text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button 
						className='flex-1 sm:flex-none bg-primary shadow-sm hover:bg-primary/90' 
						onClick={handleSave}
						disabled={!title}
					>
						{initialData ? 'Update entry' : 'Add entry'}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}
