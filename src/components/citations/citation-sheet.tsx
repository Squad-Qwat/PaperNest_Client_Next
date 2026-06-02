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
			const cleanedQuery = scholarQuery.trim()

			const isbnCleaned = cleanedQuery.replace(/[- ]/g, '')
			const isIsbn = /^(978|979)?\d{9}[\dX]$/i.test(isbnCleaned)

			let results = []

			if (isIsbn) {
				try {
					const bookData = await citationsService.getGoogleBooksPaper(isbnCleaned)
					if (bookData?.items && bookData.items.length > 0) {
						results = bookData.items.map((item: any) => {
							const info = item.volumeInfo || {}
							return {
								paperId: `isbn-${isbnCleaned}-${item.id || Math.random().toString(36).substr(2, 9)}`,
								title: info.title || '',
								externalIds: { ISBN: isbnCleaned },
								year: info.publishedDate ? info.publishedDate.substring(0, 4) : '',
								url: info.infoLink || '',
								venue: info.publisher || '',
								authors: info.authors?.map((name: string) => ({ name })) || [],
								type: 'book',
								journal: {
									volume: '',
									pages: '',
								},
							}
						})
					}
				} catch (gbError) {
					console.error('Error fetching from Google Books:', gbError)
				}
			} else {
				const response = (await citationsService.searchSemanticScholar(scholarQuery, 5)) as any
				results = response?.data || []

				const isDoi = cleanedQuery.startsWith('10.') && cleanedQuery.includes('/')

				if (results.length === 0 && isDoi) {
					try {
						const crossRefData = await citationsService.getCrossRefPaper(cleanedQuery)
						if (crossRefData?.message) {
							const msg = crossRefData.message

							const mappedAuthors =
								msg.author
									?.map((a: any) => {
										if (a.given || a.family) {
											return { name: `${a.given || ''} ${a.family || ''}`.trim() }
										}
										if (a.name && !isAffiliation(a.name)) {
											return { name: a.name.trim() }
										}
										return null
									})
									.filter(Boolean) || []

							const simulatedPaper = {
								paperId: `crossref-${msg.DOI || Math.random().toString(36).substr(2, 9)}`,
								title: msg.title?.[0] || '',
								externalIds: { DOI: msg.DOI || cleanedQuery },
								year:
									msg.issued?.['date-parts']?.[0]?.[0] ||
									msg['published-print']?.['date-parts']?.[0]?.[0] ||
									msg['published-online']?.['date-parts']?.[0]?.[0] ||
									'',
								url: msg.URL || '',
								venue: msg['container-title']?.[0] || '',
								authors: mappedAuthors,
								journal: {
									volume: msg.volume || '',
									pages: msg.page || '',
								},
								crossRefType: msg.type,
							}
							results = [simulatedPaper]
						}
					} catch (crError) {
						console.error('Error fetching from CrossRef:', crError)
					}
				}
			}

			setScholarResults(results)
		} catch (error) {
			console.error('Error searching:', error)
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
						{/* Semantic Scholar Search Section */}
						<div className='p-6 space-y-3 bg-muted border-b'>
							<Label className='text-sm font-semibold text-gray-700'>
								Cari & Isi Otomatis via Semantic Scholar
							</Label>
							<div className='flex gap-2'>
								<Input
									placeholder='Cari judul, penulis, DOI, atau arXiv...'
									className='flex-1 bg-white border-gray-200 focus-visible:ring-primary/20'
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
									className='shrink-0 bg-white border-gray-200 hover:bg-gray-50'
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
								<p className='text-xs text-gray-500 animate-pulse'>
									Mencari database Semantic Scholar...
								</p>
							)}

							{hasSearched && !isSearchingScholar && scholarResults.length === 0 && (
								<p className='text-xs text-destructive'>
									Paper tidak ditemukan. Coba pencarian lain.
								</p>
							)}

							{scholarResults.length > 0 && (
								<div className='mt-2 border rounded-lg bg-white divide-y max-h-60 overflow-y-auto shadow-sm'>
									{scholarResults.map((paper) => (
										<button
											key={paper.paperId}
											type='button'
											className='w-full p-3 text-left hover:bg-gray-50/80 transition-colors flex flex-col gap-1 focus:outline-none focus:bg-gray-50'
											onClick={() => handleSelectPaper(paper)}
										>
											<span className='text-sm font-semibold text-gray-900 line-clamp-2'>
												{paper.title}
											</span>
											{paper.authors && paper.authors.length > 0 && (
												<span className='text-xs text-gray-500'>
													{paper.authors.map((a: any) => a.name).join(', ')}
												</span>
											)}
											<span className='text-[11px] text-gray-400'>
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
							<p className='text-[13px] text-gray-500'>
								Cari paper secara global untuk mengisi form metadata secara instan.
							</p>
						</div>

						{/* Reference Section */}
						<div className='space-y-6 px-6 pb-6'>
							<Field>
								<FieldLabel className='text-sm font-semibold text-gray-700'>
									Reference Type <span className='text-red-500'>*</span>
								</FieldLabel>
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
								<FieldLabel className='text-sm font-semibold text-gray-700'>
									Title <span className='text-red-500'>*</span>
								</FieldLabel>
								<Input
									placeholder='Citation title'
									className='bg-white border-gray-200'
									value={title}
									onChange={(e) => setTitle(e.target.value)}
								/>
							</Field>

							<div className='space-y-3'>
								<FieldLabel className='text-sm font-semibold text-gray-700'>
									Authors <span className='text-red-500'>*</span>
								</FieldLabel>
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
								<FieldLabel className='text-sm font-semibold text-gray-700'>
									Journal / Publication <span className='text-red-500'>*</span>
								</FieldLabel>
								<Input
									className='bg-white border-gray-200'
									placeholder='e.g. Nature, Science, etc.'
									value={journal}
									onChange={(e) => setJournal(e.target.value)}
								/>
							</Field>

							<div className='grid grid-cols-2 gap-6'>
								<Field>
									<FieldLabel className='text-sm font-semibold text-gray-700'>
										Year <span className='text-red-500'>*</span>
									</FieldLabel>
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
						disabled={!isFormValid}
					>
						{initialData ? 'Update entry' : 'Add entry'}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}

const isAffiliation = (name: string): boolean => {
	const lower = name.toLowerCase()
	const keywords = [
		'university',
		'institute',
		'sciences',
		'centre',
		'center',
		'school',
		'department',
		'laboratory',
		'association',
		'society',
		'foundation',
		'group',
		'consortium',
		'committee',
		'collaboration',
		'commission',
		'organization',
		'clinic',
		'hospital',
		'south africa',
	]
	return keywords.some((kw) => lower.includes(kw)) || name.length > 40
}

const mapReferenceType = (pubTypes?: string[], crossRefType?: string): string => {
	if (crossRefType) {
		const typeMap: Record<string, string> = {
			'journal-article': 'article',
			book: 'book',
			'book-chapter': 'book',
			monograph: 'book',
			'edited-book': 'book',
			'proceedings-article': 'conference',
			report: 'report',
			dissertation: 'thesis',
		}
		if (typeMap[crossRefType]) {
			return typeMap[crossRefType]
		}
	}

	if (pubTypes && pubTypes.length > 0) {
		const lowerTypes = pubTypes.map((t) => t.toLowerCase())
		if (lowerTypes.some((t) => t.includes('journal') || t.includes('review'))) return 'article'
		if (lowerTypes.some((t) => t.includes('book'))) return 'book'
		if (lowerTypes.some((t) => t.includes('conference') || t.includes('proceedings')))
			return 'conference'
		if (lowerTypes.some((t) => t.includes('report'))) return 'report'
		if (lowerTypes.some((t) => t.includes('thesis') || t.includes('dissertation'))) return 'thesis'
	}

	return 'article'
}

const formatAuthorName = (name: string): string => {
	const parts = name.trim().split(/\s+/)
	if (parts.length > 1) {
		const last = parts.pop()
		const first = parts.join(' ')
		return `${last}, ${first}`
	}
	return name
}
