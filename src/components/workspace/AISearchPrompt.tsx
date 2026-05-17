'use client'

import MixInput, { type MixInputValues, type MixInputRef } from '@arif-un/react-mix-tag-input'
import '@arif-un/react-mix-tag-input/dist/index.css'
import { CheckIcon, FileText, GlobeIcon } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { create } from 'zustand'
import { useAIChatStore } from '@/lib/ai/store'
import { AI_MODELS } from '@/lib/ai/constants'
import {
	Attachment,
	AttachmentPreview,
	AttachmentRemove,
	Attachments,
} from '@/components/ui/ai-elements/attachments'
import {
	ModelSelector,
	ModelSelectorContent,
	ModelSelectorEmpty,
	ModelSelectorGroup,
	ModelSelectorInput,
	ModelSelectorItem,
	ModelSelectorList,
	ModelSelectorLogo,
	ModelSelectorLogoGroup,
	ModelSelectorName,
	ModelSelectorTrigger,
} from '@/components/ui/ai-elements/model-selector'
import type { PromptInputMessage } from '@/components/ui/ai-elements/prompt-input'
import {
	PromptInput,
	PromptInputActionAddAttachments,
	PromptInputActionAddScreenshot,
	PromptInputActionMenu,
	PromptInputActionMenuContent,
	PromptInputActionMenuTrigger,
	PromptInputBody,
	PromptInputButton,
	PromptInputFooter,
	PromptInputProvider,
	PromptInputSubmit,
	PromptInputTools,
	usePromptInputAttachments,
	usePromptInputController,
} from '@/components/ui/ai-elements/prompt-input'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface PromptSource {
	documentId: string
	title: string
}

interface AISearchPromptStore {
	referencedSources: PromptSource[]
	addSource: (source: PromptSource) => void
	removeSource: (documentId: string) => void
	clearSources: () => void
	setSources: (sources: PromptSource[]) => void
}

export const useAISearchPromptStore = create<AISearchPromptStore>((set) => ({
	referencedSources: [],
	addSource: (source) =>
		set((state) => {
			if (state.referencedSources.some((s) => s.documentId === source.documentId)) {
				return state
			}
			return { referencedSources: [...state.referencedSources, source] }
		}),
	removeSource: (documentId) =>
		set((state) => ({
			referencedSources: state.referencedSources.filter((s) => s.documentId !== documentId),
		})),
	clearSources: () => set({ referencedSources: [] }),
	setSources: (sources) => set({ referencedSources: sources }),
}))

const models = AI_MODELS

interface AttachmentItemProps {
	attachment: {
		id: string
		type: 'file'
		filename?: string
		mediaType?: string
		url: string
	}
	onRemove: (id: string) => void
}

const AttachmentItem = memo(({ attachment, onRemove }: AttachmentItemProps) => {
	const handleRemove = useCallback(() => onRemove(attachment.id), [onRemove, attachment.id])
	return (
		<Attachment data={attachment as any} key={attachment.id} onRemove={handleRemove}>
			<AttachmentPreview />
			<AttachmentRemove />
		</Attachment>
	)
})

AttachmentItem.displayName = 'AttachmentItem'

interface ModelItemProps {
	m: (typeof models)[0]
	selectedModel: string
	onSelect: (id: string) => void
}

const ModelItem = memo(({ m, selectedModel, onSelect }: ModelItemProps) => {
	const handleSelect = useCallback(() => onSelect(m.id), [onSelect, m.id])
	return (
		<ModelSelectorItem key={m.id} onSelect={handleSelect} value={m.id}>
			<ModelSelectorLogo provider={m.chef as any} />
			<ModelSelectorName>{m.name}</ModelSelectorName>
			{selectedModel === m.id ? (
				<CheckIcon className='ml-auto size-3' />
			) : (
				<div className='ml-auto size-3' />
			)}
		</ModelSelectorItem>
	)
})

ModelItem.displayName = 'ModelItem'

const PromptInputAttachmentsDisplay = () => {
	const attachments = usePromptInputAttachments()
	const handleRemove = useCallback((id: string) => attachments.remove(id), [attachments])

	if (attachments.files.length === 0) {
		return null
	}

	return (
		<Attachments variant='inline'>
			{attachments.files.map((attachment) => (
				<AttachmentItem attachment={attachment} key={attachment.id} onRemove={handleRemove} />
			))}
		</Attachments>
	)
}

const CustomTagView = (props: any) => {
	const label = props.node?.attrs?.label || ''
	return (
		<span className='inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[11px] font-medium tracking-tight select-none mx-0.5 align-middle transition-all duration-200 hover:bg-primary/15 cursor-default'>
			<FileText className='size-3 shrink-0 opacity-75' />
			<span className='max-w-[120px] truncate'>{label}</span>
		</span>
	)
}

interface AISearchPromptProps {
	placeholder?: string
	onSearchChange?: (value: string) => void
	onSearchSubmit?: (message: PromptInputMessage & { sources?: any[] }) => void
	status?: 'submitted' | 'streaming' | 'ready' | 'error'
	documents?: Array<{ documentId: string; title: string }>
	onStop?: () => void
}

const AISearchPromptInner = ({
	placeholder = 'Cari dokumen atau tanya AI...',
	onSearchChange,
	onSearchSubmit,
	status = 'ready',
	documents = [],
	onStop,
}: AISearchPromptProps) => {
	const { model, setModel } = useAIChatStore()
	const [modelSelectorOpen, setModelSelectorOpen] = useState(false)
	const { textInput } = usePromptInputController()
	const { referencedSources, clearSources, setSources } = useAISearchPromptStore()

	const [mixValue, setMixValue] = useState<MixInputValues>([[]])
	const mixInputRef = useRef<MixInputRef>(null)

	const selectedModelData = models.find((m) => m.id === model)

	const plainText = useMemo(() => {
		return mixValue
			.map((line) =>
				line
					.map((item) => {
						if (typeof item === 'string') {
							return item
						}
						return `@${item.attrs.label}`
					})
					.join('')
			)
			.join('\n')
	}, [mixValue])

	const currentTags = useMemo(() => {
		const tags: PromptSource[] = []
		for (const line of mixValue) {
			for (const item of line) {
				if (typeof item !== 'string' && item.type === 'tag') {
					tags.push({
						documentId: item.attrs.id || '',
						title: item.attrs.label || '',
					})
				}
			}
		}
		return tags
	}, [mixValue])

	useEffect(() => {
		setSources(currentTags)
	}, [currentTags, setSources])

	useEffect(() => {
		textInput.setInput(plainText)
		onSearchChange?.(plainText)
	}, [plainText, textInput, onSearchChange])

	const handleModelSelect = useCallback((id: string) => {
		setModel(id)
		setModelSelectorOpen(false)
	}, [])

	const handleSelectDocument = useCallback(
		(doc: { documentId: string; title: string }) => {
			const lastLine = [...(mixValue[mixValue.length - 1] || [])]
			const lastItem = lastLine[lastLine.length - 1]
			if (typeof lastItem === 'string') {
				const match = lastItem.match(/@([^@]*)$/)
				if (match) {
					const withoutAt = lastItem.slice(0, match.index)
					const newLastLine = [...lastLine.slice(0, -1)]
					if (withoutAt) {
						newLastLine.push(withoutAt)
					}
					newLastLine.push({
						type: 'tag',
						attrs: {
							id: doc.documentId,
							label: doc.title,
						},
					})
					newLastLine.push(' ')
					const newMixValue = [...mixValue.slice(0, -1), newLastLine]
					setMixValue(newMixValue)

					setTimeout(() => {
						mixInputRef.current?.editor?.commands.focus('end')
					}, 50)
				}
			}
		},
		[mixValue]
	)

	const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === 'Enter') {
			if (e.shiftKey) {
				return
			}
			e.preventDefault()
			const form = e.currentTarget.closest('form')
			form?.requestSubmit()
		}
	}, [])

	const handleSubmit = useCallback(
		(message: PromptInputMessage) => {
			onSearchSubmit?.({
				...message,
				sources: [...referencedSources],
			})
			clearSources()
			setMixValue([[]])
		},
		[onSearchSubmit, referencedSources, clearSources]
	)

	const handleBodyClick = useCallback((e: React.MouseEvent) => {
		const editorEl = e.currentTarget.querySelector('.ProseMirror') as HTMLElement | null
		if (editorEl && e.target !== editorEl && !editorEl.contains(e.target as Node)) {
			editorEl.focus()
		}
	}, [])

	const lastLine = mixValue[mixValue.length - 1] || []
	const lastItem = lastLine[lastLine.length - 1]
	const isMentioning = typeof lastItem === 'string' && /@([^@]*)$/.test(lastItem)
	const mentionQuery = isMentioning ? lastItem.match(/@([^@]*)$/)?.[1] || '' : ''

	const filteredDocs = useMemo(() => {
		if (!isMentioning) return []
		return documents.filter((doc) =>
			doc.title.toLowerCase().includes(mentionQuery.toLowerCase())
		)
	}, [isMentioning, mentionQuery, documents])

	const showDropdown = isMentioning && filteredDocs.length > 0

	return (
		<DropdownMenu modal={false} open={showDropdown}>
			<div className='relative w-full text-left'>
				<DropdownMenuTrigger asChild>
					<div className='absolute bottom-0 left-4 w-1 h-1 pointer-events-none opacity-0' />
				</DropdownMenuTrigger>

				<style>{`
					.mix-input-custom.mix-input {
						border: none !important;
						outline: none !important;
						box-shadow: none !important;
						padding: 0.75rem 1rem !important;
						min-height: 60px !important;
						font-size: 0.875rem !important;
						background: transparent !important;
						color: #1e293b !important;
						display: flex !important;
						flex-direction: column !important;
						width: 100% !important;
						cursor: text !important;
					}
					.mix-input-custom.mix-input:focus {
						border: none !important;
						outline: none !important;
					}
					.mix-input-custom .is-editor-empty:before {
						color: #94a3b8 !important;
						font-weight: 400 !important;
					}
					.mix-input-custom .ProseMirror {
						min-height: 44px !important;
						height: 100% !important;
						width: 100% !important;
						outline: none !important;
						border: none !important;
						flex: 1 !important;
					}
				`}</style>
				<PromptInput
					globalDrop
					multiple
					onSubmit={handleSubmit}
					className='bg-white border border-primary/20 rounded-2xl relative'
				>
					<div className='flex flex-wrap items-center gap-1.5 px-4 pt-3 empty:hidden'>
						<PromptInputAttachmentsDisplay />
					</div>
					<PromptInputBody onClick={handleBodyClick}>
						<MixInput
							ref={mixInputRef}
							className='mix-input-custom flex-1 min-h-[60px] max-h-48 overflow-y-auto w-full bg-transparent text-sm focus:outline-none focus:ring-0 border-0 outline-none p-0'
							onChange={setMixValue}
							onKeyDown={handleKeyDown}
							placeholder={placeholder}
							tagView={CustomTagView}
							value={mixValue}
						/>
					</PromptInputBody>
					<PromptInputFooter>
						<PromptInputTools>
							<PromptInputActionMenu>
								<PromptInputActionMenuTrigger />
								<PromptInputActionMenuContent>
									<PromptInputActionAddAttachments />
									<PromptInputActionAddScreenshot />
								</PromptInputActionMenuContent>
							</PromptInputActionMenu>
							<PromptInputButton>
								<GlobeIcon size={16} />
								<span>Search</span>
							</PromptInputButton>
							<ModelSelector onOpenChange={setModelSelectorOpen} open={modelSelectorOpen}>
								<ModelSelectorTrigger asChild>
									<PromptInputButton>
										{selectedModelData?.chef && (
											<ModelSelectorLogo provider={selectedModelData.chef as any} />
										)}
										{selectedModelData?.name && (
											<ModelSelectorName>{selectedModelData.name}</ModelSelectorName>
										)}
									</PromptInputButton>
								</ModelSelectorTrigger>
								<ModelSelectorContent>
									<ModelSelectorInput placeholder='Cari model...' />
									<ModelSelectorList>
										<ModelSelectorEmpty>Model tidak ditemukan.</ModelSelectorEmpty>
										<ModelSelectorGroup heading='Model Tersedia'>
											{models.map((m) => (
												<ModelItem
													key={m.id}
													m={m}
													onSelect={handleModelSelect}
													selectedModel={model}
												/>
											))}
										</ModelSelectorGroup>
									</ModelSelectorList>
								</ModelSelectorContent>
							</ModelSelector>
						</PromptInputTools>
						<PromptInputSubmit status={status} onStop={onStop} />
					</PromptInputFooter>
				</PromptInput>
			</div>
			<DropdownMenuContent
				align='start'
				className='w-80 max-h-64 overflow-y-auto z-[100] bg-white border border-slate-200 rounded-xl shadow-lg p-1'
				side='bottom'
				sideOffset={12}
			>
				<DropdownMenuLabel className='px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 rounded-t-lg select-none'>
					Pilih Dokumen Referensi
				</DropdownMenuLabel>
				<DropdownMenuSeparator className='my-1' />
				{filteredDocs.map((doc) => (
					<DropdownMenuItem
						className='flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:text-primary transition-all cursor-pointer'
						key={doc.documentId}
						onSelect={() => handleSelectDocument(doc)}
					>
						<FileText className='h-4 w-4 text-slate-400 shrink-0' />
						<span className='truncate font-medium flex-1'>{doc.title}</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

export const AISearchPrompt = (props: AISearchPromptProps) => {
	return (
		<div className='w-full'>
			<PromptInputProvider>
				<AISearchPromptInner {...props} />
			</PromptInputProvider>
		</div>
	)
}
