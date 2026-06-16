'use client'

interface Props {
	message: string | null | undefined
}

export function AuthErrorMessage({ message }: Props) {
	if (!message) return null
	return (
		<div className='p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm text-center font-medium'>
			{message}
		</div>
	)
}
