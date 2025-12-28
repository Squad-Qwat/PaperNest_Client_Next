import { Loader2Icon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
	return (
		// biome-ignore lint/a11y/useSemanticElements: role='status' is the correct role for a loading spinner
		<span role='status' className='inline-flex items-center justify-center'>
			<Loader2Icon
				aria-label='Loading'
				className={cn('size-4 animate-spin', className)}
				{...props}
			/>
		</span>
	)
}

export { Spinner }
