'use client'

import { Loader2, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet'
import { formatAuthorName, mapReferenceType } from '@/lib/api/services/citations.service'

interface Author {
	id: string
	name: string
}

let authorIdCounter = 0
const generateAuthorId = (): string => {
	authorIdCounter += 1
	return `author-${Date.now()}-${authorIdCounter}`
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
	documentId?: string
}

export function CitationSheet({
	open,
	onOpenChange,
	onSave,
	initialData,
	documentId: _documentId,
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
	const [url, setUrl] = useState('')

	const [scholarQuery, setScholarQuery] = useState('')
	const [scholarResults, setScholarResults] = useState<any[]>([])
	const [isSearchingScholar, setIsSearchingScholar] = useState(false)
	const [hasSearched, setHasSearched] = useState(false)

	const handleScholarSearch = async () => {
		if (!scholarQuery.trim()) return

		setIsSearchingScholar(true)
		setHasSearched(true)
		try {
			const { citationsService } = await import('@/lib/api/services/citations.service')
			const results = await citationsService.unifiedSearch(scholarQuery.trim(), 5)
			setScholarResults(results)
		} catch (error) {
			console.error(error)
			setScholarResults([])
		} finally {
			setIsSearchingScholar(false)
		}
	}

	const handleSelectPaper = (paper: any) => {
		setTitle(paper.title || '')
		setDoi(paper.externalIds?.DOI || paper.externalIds?.ISBN || '')
		setYear(paper.year ? String(paper.year) : '')
		setUrl(paper.url || paper.openAccessPdf?.url || '')
		setJournal(paper.venue || '')

		const mappedType = mapReferenceType(paper.publicationTypes, paper.crossRefType || paper.type)
		setType(mappedType)

		if (paper.authors && paper.authors.length > 0) {
			const authorList = paper.authors.map((a: any, index: number) => ({
				id: `author-${Date.now()}-${index}`,
				name: formatAuthorName(a.name),
			}))
			setAuthors(authorList)
		} else {
			setAuthors([{ id: '1', name: '' }])
		}

		if (paper.journal?.volume) {
			setVolume(paper.journal.volume)
		}
		if (paper.journal?.pages) {
			const pagesParts = paper.journal.pages.split('-')
			setPageFrom(pagesParts[0]?.trim() || '')
			setPageTo(pagesParts[1]?.trim() || '')
		}

		setScholarResults([])
		setScholarQuery('')
		setHasSearched(false)
	}

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
			setUrl('')
		}
	}, [initialData, open])

	const addAuthor = () => {
		setAuthors([...authors, { id: generateAuthorId(), name: '' }])
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
			doi: doi || null,
			publicationDate: year,
			url: url || null,
			cslJson: {
				/* 
				title,
				author: authorString,
				containerTitle: journal || '',
				volume: volume || '',
				issue: issue || '',
				page: pageFrom && pageTo ? `${pageFrom}-${pageTo}` : (pageFrom || pageTo || ''),
				issued: year || '',
				DOI: doi || '',
				URL: url || '', 
				*/
				raw: JSON.stringify({
					title,
					author: authors.map((a) => {
						const parts = a.name.split(',')
						return {
							family: parts[0]?.trim() || '',
							given: parts[1]?.trim() || '',
						}
					}),
					containerTitle: journal,
					volume,
					issue,
					page: pageFrom && pageTo ? `${pageFrom}-${pageTo}` : pageFrom || pageTo || '',
					issued: { 'date-parts': [[year]] },
					DOI: doi,
					URL: url,
				}),
			},
		}

		/*
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
		*/

		onSave(data)
		onOpenChange(false)
	}

	const isFormValid = Boolean(
		title.trim() &&
			type.trim() &&
			authors.some((a) => a.name.trim()) &&
			journal.trim() &&
			year.trim()
	)

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className='sm:max-w-md md:max-w-lg overflow-hidden flex flex-col p-0 gap-0'>
				<SheetHeader className='p-6 shrink-0 border-b border-border'>
					<SheetTitle className='text-xl font-bold'>
						{initialData ? 'Update Citation' : 'Add Citation'}
					</SheetTitle>
					<SheetDescription>
						Enter citation details manually or search by identifier.
					</SheetDescription>
				</SheetHeader>

				<ScrollArea className='flex-1 min-h-0'>
					<div className='space-y-8'>
						{/* Semantic Scholar Search Section */}
						<div className='p-6 space-y-3 bg-muted/50 border-b border-border'>
							<Label className='text-sm font-semibold text-foreground'>
								Search & Autofill via Semantic Scholar
							</Label>
							<div className='flex gap-2'>
								<Input
									placeholder='Search by title, author, DOI, or arXiv...'
									className='flex-1 bg-background border-border focus-visible:ring-primary/20 text-foreground'
									value={scholarQuery}
									onChange={(e) => setScholarQuery(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault()
											handleScholarSearch()
										}
									}}
								/>
								<Button
									size='icon'
									variant='outline'
									className='shrink-0 bg-background border-border hover:bg-muted text-foreground'
									onClick={handleScholarSearch}
									disabled={isSearchingScholar || !scholarQuery.trim()}
								>
									{isSearchingScholar ? (
										<Loader2 className='h-4 w-4 animate-spin' />
									) : (
										<Search className='h-4 w-4' />
									)}
								</Button>
							</div>

							{isSearchingScholar && (
								<p className='text-xs text-muted-foreground animate-pulse'>
									Searching Semantic Scholar database...
								</p>
							)}

							{hasSearched && !isSearchingScholar && scholarResults.length === 0 && (
								<p className='text-xs text-destructive'>
									Paper not found. Try another search query.
								</p>
							)}

							{scholarResults.length > 0 && (
								<div className='mt-2 border border-border rounded-lg bg-popover divide-y divide-border max-h-60 overflow-y-auto shadow-sm text-foreground'>
									{scholarResults.map((paper) => (
										<button
											key={paper.paperId}
											type='button'
											className='w-full p-3 text-left hover:bg-accent/80 transition-colors flex flex-col gap-1 focus:outline-none focus:bg-accent'
											onClick={() => handleSelectPaper(paper)}
										>
											<span className='text-sm font-semibold text-foreground line-clamp-2'>
												{paper.title}
											</span>
											{paper.authors && paper.authors.length > 0 && (
												<span className='text-xs text-muted-foreground'>
													{paper.authors.map((a: any) => a.name).join(', ')}
												</span>
											)}
											<span className='text-[11px] text-muted-foreground'>
												{[
													paper.year,
													paper.venue,
													paper.externalIds?.DOI ? `DOI: ${paper.externalIds.DOI}` : null,
												]
													.filter(Boolean)
													.join(' • ')}
											</span>
										</button>
									))}
								</div>
							)}
							<p className='text-[13px] text-muted-foreground'>
								Search for papers globally to fill metadata forms instantly.
							</p>
						</div>

						{/* Reference Section */}
						<div className='space-y-6 px-6 pb-6'>
							<Field>
								<FieldLabel className='text-sm font-semibold text-foreground'>
									Reference Type <span className='text-red-500'>*</span>
								</FieldLabel>
								<Select value={type} onValueChange={setType}>
									<SelectTrigger className='bg-background border-border text-foreground'>
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
								<FieldLabel className='text-sm font-semibold text-foreground'>
									Title <span className='text-red-500'>*</span>
								</FieldLabel>
								<Input
									placeholder='Citation title'
									className='bg-background border-border text-foreground'
									value={title}
									onChange={(e) => setTitle(e.target.value)}
								/>
							</Field>

							<div className='space-y-3'>
								<FieldLabel className='text-sm font-semibold text-foreground'>
									Authors <span className='text-red-500'>*</span>
								</FieldLabel>
								<p className='text-[13px] text-muted-foreground'>
									Please enter author names as 'last name, first name' (e.g. 'Smith, Jane').
								</p>
								<div className='space-y-2'>
									{authors.map((author) => (
										<div key={author.id} className='flex gap-2 group'>
											<Input
												placeholder='Smith, Jane'
												className='bg-background border-border text-foreground'
												value={author.name}
												onChange={(e) => updateAuthor(author.id, e.target.value)}
											/>
											<Button
												variant='ghost'
												size='icon'
												className='shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity'
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
								<FieldLabel className='text-sm font-semibold text-foreground'>
									Journal / Publication <span className='text-red-500'>*</span>
								</FieldLabel>
								<Input
									className='bg-background border-border text-foreground'
									placeholder='e.g. Nature, Science, etc.'
									value={journal}
									onChange={(e) => setJournal(e.target.value)}
								/>
							</Field>

							<div className='grid grid-cols-2 gap-6'>
								<Field>
									<FieldLabel className='text-sm font-semibold text-foreground'>
										Year <span className='text-red-500'>*</span>
									</FieldLabel>
									<Input
										className='bg-background border-border text-foreground'
										placeholder='e.g. 2023'
										value={year}
										onChange={(e) => setYear(e.target.value)}
									/>
								</Field>
								<Field>
									<FieldLabel className='text-sm font-semibold text-foreground'>Pages</FieldLabel>
									<div className='flex items-center gap-2'>
										<Input
											placeholder='from'
											className='bg-background border-border text-foreground'
											value={pageFrom}
											onChange={(e) => setPageFrom(e.target.value)}
										/>
										<span className='text-muted-foreground font-light'>—</span>
										<Input
											placeholder='to'
											className='bg-background border-border text-foreground'
											value={pageTo}
											onChange={(e) => setPageTo(e.target.value)}
										/>
									</div>
								</Field>
							</div>

							<div className='grid grid-cols-2 gap-6'>
								<Field>
									<FieldLabel className='text-sm font-semibold text-foreground'>Volume</FieldLabel>
									<Input
										className='bg-background border-border text-foreground'
										value={volume}
										onChange={(e) => setVolume(e.target.value)}
									/>
								</Field>
								<Field>
									<FieldLabel className='text-sm font-semibold text-foreground'>Issue</FieldLabel>
									<Input
										className='bg-background border-border text-foreground'
										value={issue}
										onChange={(e) => setIssue(e.target.value)}
									/>
								</Field>
							</div>

							<Field>
								<FieldLabel className='text-sm font-semibold text-foreground'>URL</FieldLabel>
								<Input
									placeholder='https://...'
									className='bg-background border-border text-foreground'
									value={url}
									onChange={(e) => setUrl(e.target.value)}
								/>
							</Field>
						</div>
					</div>
				</ScrollArea>

				<SheetFooter className='p-6 border-t border-border bg-muted/30 shrink-0 flex-row gap-3 sm:justify-end'>
					<Button
						variant='ghost'
						className='flex-1 sm:flex-none text-muted-foreground hover:bg-muted hover:text-foreground'
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						className='flex-1 sm:flex-none bg-primary shadow-sm hover:bg-primary/90'
						onClick={handleSave}
						disabled={!isFormValid}
					>
						{initialData ? 'Update entry' : 'Add entry'}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}
