import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Spinner yang dipakai di dalam tombol saat loading.
 * Selalu di sebelah kiri teks.
 */
export function ButtonSpinner({ className }: { className?: string }) {
	return <Loader2 className={cn('size-4 animate-spin shrink-0', className)} />
}
