import { Loader2 } from 'lucide-react'
import type React from 'react'

interface CitationFormProps {
	onSubmit: (e: React.FormEvent) => void
	isPending: boolean
	submitLabel: string
	submitIcon?: React.ReactNode
	showCancel?: boolean
	onCancel?: () => void
	authorPlaceholder?: string
	titlePlaceholder?: string

	type: string
	setType: (val: string) => void
	title: string
	setTitle: (val: string) => void
	author: string
	setAuthor: (val: string) => void
	venue: string
	setVenue: (val: string) => void
	year: string
	setYear: (val: string) => void
	doi: string
	setDoi: (val: string) => void
	url: string
	setUrl: (val: string) => void
}

export const CitationForm: React.FC<CitationFormProps> = ({
	onSubmit,
	isPending,
	submitLabel,
	submitIcon,
	showCancel,
	onCancel,
	authorPlaceholder = 'e.g., Doe, J. and Smith, A.',
	titlePlaceholder,
	type,
	setType,
	title,
	setTitle,
	author,
	setAuthor,
	venue,
	setVenue,
	year,
	setYear,
	doi,
	setDoi,
	url,
	setUrl,
}) => {
	return (
		<form onSubmit={onSubmit} className='space-y-3.5 text-xs p-1'>
			<div>
				<label className='block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1'>
					<span>Reference Type</span>
					<select
						value={type}
						onChange={(e) => setType(e.target.value)}
						className='w-full p-2 border rounded border-border outline-none focus:ring-1 focus:ring-primary mt-1 bg-background text-foreground'
					>
						<option value='article'>Journal Article</option>
						<option value='book'>Book</option>
						<option value='website'>Website</option>
						<option value='proceedings'>Conference Proceedings</option>
						<option value='misc'>Miscellaneous</option>
					</select>
				</label>
			</div>

			<div>
				<label className='block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1'>
					<span>Title *</span>
					<textarea
						value={title}
						placeholder={titlePlaceholder}
						onChange={(e) => setTitle(e.target.value)}
						className='w-full p-2 border rounded border-border outline-none focus:ring-1 focus:ring-primary h-14 resize-none mt-1 bg-background text-foreground'
						required
					/>
				</label>
			</div>

			<div>
				<label className='block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1'>
					<span>Author(s) *</span>
					<input
						type='text'
						placeholder={authorPlaceholder}
						value={author}
						onChange={(e) => setAuthor(e.target.value)}
						className='w-full p-2 border rounded border-border outline-none focus:ring-1 focus:ring-primary mt-1 bg-background text-foreground'
						required
					/>
				</label>
			</div>

			<div className='grid grid-cols-2 gap-2'>
				<div>
					<label className='block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1'>
						<span>Journal/Venue</span>
						<input
							type='text'
							placeholder='e.g., Nature AI'
							value={venue}
							onChange={(e) => setVenue(e.target.value)}
							className='w-full p-2 border rounded border-border outline-none focus:ring-1 focus:ring-primary mt-1 bg-background text-foreground'
						/>
					</label>
				</div>
				<div>
					<label className='block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1'>
						<span>Year</span>
						<input
							type='text'
							placeholder='e.g., 2025'
							value={year}
							onChange={(e) => setYear(e.target.value)}
							className='w-full p-2 border rounded border-border outline-none focus:ring-1 focus:ring-primary mt-1 bg-background text-foreground'
						/>
					</label>
				</div>
			</div>

			<div className='grid grid-cols-2 gap-2'>
				<div>
					<label className='block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1'>
						<span>DOI</span>
						<input
							type='text'
							placeholder='e.g., 10.1038/s415'
							value={doi}
							onChange={(e) => setDoi(e.target.value)}
							className='w-full p-2 border rounded border-border outline-none focus:ring-1 focus:ring-primary mt-1 bg-background text-foreground'
						/>
					</label>
				</div>
				<div>
					<label className='block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1'>
						<span>URL</span>
						<input
							type='url'
							placeholder='e.g., https://example.com'
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							className='w-full p-2 border rounded border-border outline-none focus:ring-1 focus:ring-primary mt-1 bg-background text-foreground'
						/>
					</label>
				</div>
			</div>

			<div className='pt-2 flex gap-2'>
				{showCancel && onCancel && (
					<button
						type='button'
						onClick={onCancel}
						className='flex-1 py-2 px-3 border border-border hover:bg-muted font-semibold text-muted-foreground rounded-md transition'
					>
						Cancel
					</button>
				)}
				<button
					type='submit'
					disabled={isPending}
					className='flex-1 py-2 px-3 bg-primary hover:bg-primary/95 text-white font-semibold rounded-md transition shadow flex justify-center items-center gap-1.5'
				>
					{isPending ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : submitIcon}
					{submitLabel}
				</button>
			</div>
		</form>
	)
}
