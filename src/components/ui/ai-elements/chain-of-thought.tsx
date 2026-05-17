'use client'

import { useControllableState } from '@radix-ui/react-use-controllable-state'
import type { LucideIcon } from 'lucide-react'
import { BrainIcon, CheckCircle2, ChevronDownIcon, Circle, Loader2, XCircle } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { createContext, memo, useContext, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface ChainOfThoughtContextValue {
	isOpen: boolean
	setIsOpen: (open: boolean) => void
}

const ChainOfThoughtContext = createContext<ChainOfThoughtContextValue | null>(null)

const useChainOfThought = () => {
	const context = useContext(ChainOfThoughtContext)
	if (!context) {
		throw new Error('ChainOfThought components must be used within ChainOfThought')
	}
	return context
}

export type ChainOfThoughtProps = ComponentProps<'div'> & {
	open?: boolean
	defaultOpen?: boolean
	onOpenChange?: (open: boolean) => void
}

export const ChainOfThought = memo(
	({
		className,
		open,
		defaultOpen = false,
		onOpenChange,
		children,
		...props
	}: ChainOfThoughtProps) => {
		const [isOpen, setIsOpen] = useControllableState({
			defaultProp: defaultOpen,
			onChange: onOpenChange,
			prop: open,
		})

		const chainOfThoughtContext = useMemo(() => ({ isOpen, setIsOpen }), [isOpen, setIsOpen])

		return (
			<ChainOfThoughtContext.Provider value={chainOfThoughtContext}>
				<div className={cn('not-prose w-full space-y-4', className)} {...props}>
					{children}
				</div>
			</ChainOfThoughtContext.Provider>
		)
	}
)

export type ChainOfThoughtHeaderProps = ComponentProps<typeof CollapsibleTrigger>

export const ChainOfThoughtHeader = memo(
	({ className, children, ...props }: ChainOfThoughtHeaderProps) => {
		const { isOpen, setIsOpen } = useChainOfThought()

		return (
			<Collapsible onOpenChange={setIsOpen} open={isOpen}>
				<CollapsibleTrigger
					className={cn(
						'flex w-full items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground',
						className
					)}
					{...props}
				>
					<BrainIcon className='size-4' />
					<span className='flex-1 text-left'>{children ?? 'Chain of Thought'}</span>
					<ChevronDownIcon
						className={cn('size-4 transition-transform', isOpen ? 'rotate-180' : 'rotate-0')}
					/>
				</CollapsibleTrigger>
			</Collapsible>
		)
	}
)

export type ChainOfThoughtStepProps = ComponentProps<'div'> & {
	icon?: LucideIcon
	label: ReactNode
	description?: ReactNode
	status?: 'complete' | 'active' | 'pending' | 'failed'
}

const stepStatusStyles = {
	active: 'text-foreground font-medium',
	complete: 'text-muted-foreground',
	pending: 'text-muted-foreground/50',
	failed: 'text-destructive font-medium',
}

export const ChainOfThoughtStep = memo(
	({
		className,
		icon,
		label,
		description,
		status = 'complete',
		children,
		...props
	}: ChainOfThoughtStepProps) => {
		// Pick the most appropriate icon based on status if no custom icon is provided (DotIcon is the original fallback)
		const Icon =
			icon ||
			(status === 'active'
				? Loader2
				: status === 'complete'
					? CheckCircle2
					: status === 'failed'
						? XCircle
						: Circle)

		return (
			<div
				className={cn(
					'flex gap-2 text-sm relative pb-4 last:pb-0 group',
					stepStatusStyles[status],
					'fade-in-0 slide-in-from-top-2 animate-in',
					className
				)}
				{...props}
			>
				{/* We place the absolute timeline connector line relative to the entire step block 
            so that it dynamically spans from the bottom of the icon down through the pb-4 padding 
            of the current step, bridging any gap to the next step's icon wrapper. */}
				<div className='mt-0.5 shrink-0 relative z-10 bg-background'>
					<Icon
						className={cn(
							'size-4',
							status === 'active' && 'text-primary animate-spin',
							status === 'failed' && 'text-destructive'
						)}
					/>
				</div>
				<div className='absolute top-5 bottom-0 left-2 -translate-x-1/2 w-px bg-border group-last:hidden' />
				<div className='flex-1 space-y-2 overflow-hidden pl-1'>
					<div>{label}</div>
					{description && <div className='text-muted-foreground text-xs'>{description}</div>}
					{children}
				</div>
			</div>
		)
	}
)

export type ChainOfThoughtSearchResultsProps = ComponentProps<'div'>

export const ChainOfThoughtSearchResults = memo(
	({ className, ...props }: ChainOfThoughtSearchResultsProps) => (
		<div className={cn('flex flex-wrap items-center gap-2', className)} {...props} />
	)
)

export type ChainOfThoughtSearchResultProps = ComponentProps<typeof Badge>

export const ChainOfThoughtSearchResult = memo(
	({ className, children, ...props }: ChainOfThoughtSearchResultProps) => (
		<Badge
			className={cn('gap-1 px-2 py-0.5 font-normal text-xs', className)}
			variant='secondary'
			{...props}
		>
			{children}
		</Badge>
	)
)

export type ChainOfThoughtContentProps = ComponentProps<typeof CollapsibleContent>

export const ChainOfThoughtContent = memo(
	({ className, children, ...props }: ChainOfThoughtContentProps) => {
		const { isOpen } = useChainOfThought()

		return (
			<Collapsible open={isOpen}>
				<CollapsibleContent
					className={cn(
						'mt-2 space-y-3',
						'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in',
						className
					)}
					{...props}
				>
					{children}
				</CollapsibleContent>
			</Collapsible>
		)
	}
)

export type ChainOfThoughtImageProps = ComponentProps<'div'> & {
	caption?: string
}

export const ChainOfThoughtImage = memo(
	({ className, children, caption, ...props }: ChainOfThoughtImageProps) => (
		<div className={cn('mt-2 space-y-2', className)} {...props}>
			<div className='relative flex max-h-[22rem] items-center justify-center overflow-hidden rounded-lg bg-muted p-3'>
				{children}
			</div>
			{caption && <p className='text-muted-foreground text-xs'>{caption}</p>}
		</div>
	)
)

ChainOfThought.displayName = 'ChainOfThought'
ChainOfThoughtHeader.displayName = 'ChainOfThoughtHeader'
ChainOfThoughtStep.displayName = 'ChainOfThoughtStep'
ChainOfThoughtSearchResults.displayName = 'ChainOfThoughtSearchResults'
ChainOfThoughtSearchResult.displayName = 'ChainOfThoughtSearchResult'
ChainOfThoughtContent.displayName = 'ChainOfThoughtContent'
ChainOfThoughtImage.displayName = 'ChainOfThoughtImage'
