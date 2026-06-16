interface ModalErrorAlertProps {
	message: string | null
}

/**
 * Alert error standar untuk digunakan di dalam form modal.
 */
export function ModalErrorAlert({ message }: ModalErrorAlertProps) {
	if (!message) return null

	return (
		<div className='p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm'>
			{message}
		</div>
	)
}
