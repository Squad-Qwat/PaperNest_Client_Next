import { BrainCircuit, CheckIcon, Zap } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { memo, useCallback } from 'react'
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AI_MODELS } from '@/lib/ai/constants'
import { cn } from '@/lib/utils'

export type ModelSelectorProps = ComponentProps<typeof Dialog>

export const ModelSelector = (props: ModelSelectorProps) => <Dialog {...props} />

export type ModelSelectorTriggerProps = ComponentProps<typeof DialogTrigger>

export const ModelSelectorTrigger = (props: ModelSelectorTriggerProps) => (
	<DialogTrigger {...props} />
)

export type ModelSelectorContentProps = ComponentProps<typeof DialogContent> & {
	title?: ReactNode
}

export const ModelSelectorContent = ({
	className,
	children,
	title = 'Model Selector',
	...props
}: ModelSelectorContentProps) => (
	<DialogContent
		aria-describedby={undefined}
		className={cn('outline! border-none! p-0 outline-border! outline-solid!', className)}
		{...props}
	>
		<DialogTitle className='sr-only'>{title}</DialogTitle>
		<Command className='**:data-[slot=command-input-wrapper]:h-auto'>{children}</Command>
	</DialogContent>
)

export type ModelSelectorDialogProps = ComponentProps<typeof CommandDialog>

export const ModelSelectorDialog = (props: ModelSelectorDialogProps) => <CommandDialog {...props} />

export type ModelSelectorInputProps = ComponentProps<typeof CommandInput>

export const ModelSelectorInput = ({ className, ...props }: ModelSelectorInputProps) => (
	<CommandInput className={cn('h-auto py-3.5', className)} {...props} />
)

export type ModelSelectorListProps = ComponentProps<typeof CommandList>

export const ModelSelectorList = (props: ModelSelectorListProps) => <CommandList {...props} />

export type ModelSelectorEmptyProps = ComponentProps<typeof CommandEmpty>

export const ModelSelectorEmpty = (props: ModelSelectorEmptyProps) => <CommandEmpty {...props} />

export type ModelSelectorGroupProps = ComponentProps<typeof CommandGroup>

export const ModelSelectorGroup = (props: ModelSelectorGroupProps) => <CommandGroup {...props} />

export type ModelSelectorItemProps = ComponentProps<typeof CommandItem>

export const ModelSelectorItem = (props: ModelSelectorItemProps) => <CommandItem {...props} />

export type ModelSelectorShortcutProps = ComponentProps<typeof CommandShortcut>

export const ModelSelectorShortcut = (props: ModelSelectorShortcutProps) => (
	<CommandShortcut {...props} />
)

export type ModelSelectorSeparatorProps = ComponentProps<typeof CommandSeparator>

export const ModelSelectorSeparator = (props: ModelSelectorSeparatorProps) => (
	<CommandSeparator {...props} />
)

export type ModelSelectorLogoProps = Omit<ComponentProps<'img'>, 'src' | 'alt'> & {
	provider:
		| 'moonshotai-cn'
		| 'lucidquery'
		| 'moonshotai'
		| 'zai-coding-plan'
		| 'alibaba'
		| 'xai'
		| 'vultr'
		| 'nvidia'
		| 'upstage'
		| 'groq'
		| 'github-copilot'
		| 'mistral'
		| 'vercel'
		| 'nebius'
		| 'deepseek'
		| 'alibaba-cn'
		| 'google-vertex-anthropic'
		| 'venice'
		| 'chutes'
		| 'cortecs'
		| 'github-models'
		| 'togetherai'
		| 'azure'
		| 'baseten'
		| 'huggingface'
		| 'opencode'
		| 'fastrouter'
		| 'google'
		| 'google-vertex'
		| 'cloudflare-workers-ai'
		| 'inception'
		| 'wandb'
		| 'openai'
		| 'zhipuai-coding-plan'
		| 'perplexity'
		| 'openrouter'
		| 'zenmux'
		| 'v0'
		| 'iflowcn'
		| 'synthetic'
		| 'deepinfra'
		| 'zhipuai'
		| 'submodel'
		| 'zai'
		| 'inference'
		| 'requesty'
		| 'morph'
		| 'lmstudio'
		| 'anthropic'
		| 'aihubmix'
		| 'fireworks-ai'
		| 'modelscope'
		| 'llama'
		| 'scaleway'
		| 'amazon-bedrock'
		| 'cerebras'
		// oxlint-disable-next-line typescript-eslint(ban-types) -- intentional pattern for autocomplete-friendly string union
		| (string & Record<string, never>)
}

export const ModelSelectorLogo = ({ provider, className, ...props }: ModelSelectorLogoProps) => (
	// biome-ignore lint/performance/noImgElement: External SVG logos are small and don't need Next.js optimization
	<img
		{...props}
		alt={`${provider} logo`}
		className={cn('size-3 dark:invert', className)}
		height={12}
		src={`https://models.dev/logos/${provider}.svg`}
		width={12}
	/>
)

export type ModelSelectorLogoGroupProps = ComponentProps<'div'>

export const ModelSelectorLogoGroup = ({ className, ...props }: ModelSelectorLogoGroupProps) => (
	<div
		className={cn(
			'flex shrink-0 items-center -space-x-1 [&>img]:rounded-full [&>img]:bg-background [&>img]:p-px [&>img]:ring-1 dark:[&>img]:bg-foreground',
			className
		)}
		{...props}
	/>
)

export type ModelSelectorNameProps = ComponentProps<'span'>

export const ModelSelectorName = ({ className, ...props }: ModelSelectorNameProps) => (
	<span className={cn('flex-1 truncate text-left', className)} {...props} />
)

export interface SharedModelSelectorContentProps {
	model: string
	setModel: (id: string) => void
	agentId: string
	setAgentId: (id: string) => void
	onSelect?: (id: string) => void
}

const ModelItem = memo(
	({
		m,
		selectedModel,
		onSelect,
	}: {
		m: (typeof AI_MODELS)[0]
		selectedModel: string
		onSelect: (id: string) => void
	}) => {
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
	}
)
ModelItem.displayName = 'ModelItem'

export const SharedModelSelectorContent = ({
	model,
	setModel,
	agentId,
	setAgentId,
	onSelect,
}: SharedModelSelectorContentProps) => {
	const handleModelSelect = useCallback(
		(id: string) => {
			setModel(id)
			onSelect?.(id)
		},
		[setModel, onSelect]
	)

	return (
		<ModelSelectorContent>
			<ModelSelectorInput placeholder='Search models...' />
			<ModelSelectorList>
				<ModelSelectorEmpty>Model/mode not found.</ModelSelectorEmpty>
				<ModelSelectorGroup heading='Agent Mode'>
					<ModelSelectorItem onSelect={() => setAgentId('manual_graph')} value='manual_graph'>
						<BrainCircuit className='mr-2 h-3.5 w-3.5 text-blue-500' />
						<ModelSelectorName>High Agentic</ModelSelectorName>
						{agentId === 'manual_graph' && <CheckIcon className='ml-auto size-3' />}
					</ModelSelectorItem>
					<ModelSelectorItem onSelect={() => setAgentId('deep_agent')} value='deep_agent'>
						<Zap className='mr-2 h-3.5 w-3.5 text-amber-500' />
						<ModelSelectorName>Medium</ModelSelectorName>
						{agentId === 'deep_agent' && <CheckIcon className='ml-auto size-3' />}
					</ModelSelectorItem>
				</ModelSelectorGroup>
				<ModelSelectorSeparator />
				<ModelSelectorGroup heading='Available Models'>
					{AI_MODELS.map((m) => (
						<ModelItem key={m.id} m={m} onSelect={handleModelSelect} selectedModel={model} />
					))}
				</ModelSelectorGroup>
			</ModelSelectorList>
		</ModelSelectorContent>
	)
}
