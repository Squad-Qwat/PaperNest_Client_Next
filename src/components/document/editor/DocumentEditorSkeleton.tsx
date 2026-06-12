'use client'

import { FileText } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export function DocumentEditorSkeleton() {
	return (
		<div className='h-svh overflow-hidden bg-background flex flex-col'>
			{/* Header Skeleton */}
			<header className='bg-background border-b border-border px-4 py-2 sticky top-0 z-[1001]'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-4'>
						<Skeleton className='h-9 w-9 rounded-lg' /> {/* Back Button */}
						<div className='flex flex-col gap-2'>
							<Skeleton className='h-6 w-48 rounded' /> {/* Title */}
							<div className='flex gap-3'>
								<Skeleton className='h-3 w-8' />
								<Skeleton className='h-3 w-12' />
								<Skeleton className='h-3 w-10' />
							</div>
						</div>
					</div>
					<div className='flex items-center gap-3'>
						<div className='flex items-center gap-2 pr-4 border-r border-border'>
							<Skeleton className='h-8 w-8 rounded-full' />
							<Skeleton className='h-8 w-8 rounded-full' />
						</div>
						<Skeleton className='h-8 w-16' />
						<Skeleton className='h-8 w-16' />
						<div className='flex gap-2'>
							<Skeleton className='h-8 w-8 rounded-lg' />
							<Skeleton className='h-8 w-8 rounded-lg' />
						</div>
						<Skeleton className='h-8 w-8 rounded-full ml-2' />
					</div>
				</div>
			</header>

			{/* LaTeX/Editor Toolbar Skeleton */}
			<div className='border-b border-border bg-muted/20 p-2 flex items-center gap-4 px-6'>
				<div className='flex gap-1'>
					<Skeleton className='h-7 w-12' />
					<Skeleton className='h-7 w-12' />
				</div>
				<div className='h-4 w-[1px] bg-border' />
				<div className='flex gap-2'>
					<Skeleton className='h-7 w-32' />
					<Skeleton className='h-7 w-20' />
				</div>
				<div className='h-4 w-[1px] bg-border' />
				<div className='flex gap-2 flex-1'>
					<Skeleton className='h-7 w-40' />
					<Skeleton className='h-7 w-24' />
					<Skeleton className='h-7 w-28' />
				</div>
				<Skeleton className='h-7 w-24 rounded-full' />
			</div>

			<div className='flex flex-1 overflow-hidden'>
				{/* Sidenav Panel Skeleton */}
				<div className='w-[48px] border-r border-border flex flex-col items-center py-6 gap-6 bg-card'>
					<Skeleton className='h-6 w-6 rounded-md' />
					<Skeleton className='h-6 w-6 rounded-md' />
					<Skeleton className='h-6 w-6 rounded-md' />
					<div className='mt-auto mb-4'>
						<Skeleton className='h-6 w-6 rounded-md' />
					</div>
				</div>

				{/* Main Content: Split View */}
				<div className='flex flex-1 overflow-hidden'>
					{/* Left: Code Editor Skeleton (55%) */}
					<div className='flex-[0.55] border-r border-border bg-card flex overflow-hidden'>
						{/* Gutter / Line Numbers */}
						<div className='w-10 border-r border-border bg-muted/30 py-4 flex flex-col items-center gap-3'>
							{Array.from({ length: 20 }, (_, i) => ({ id: i })).map((item) => (
								<Skeleton key={`line-skeleton-${item.id}`} className='h-3 w-4 opacity-30' />
							))}
						</div>
						{/* Code Content */}
						<div className='flex-1 p-4 space-y-3 font-mono'>
							<Skeleton className='h-4 w-32' /> {/* \documentclass */}
							<Skeleton className='h-4 w-40' /> {/* \usepackage */}
							<div className='pt-2' />
							<Skeleton className='h-4 w-48' /> {/* \begin{document} */}
							<div className='pl-6 space-y-3'>
								<Skeleton className='h-4 w-3/4' />
								<Skeleton className='h-4 w-5/6' />
								<Skeleton className='h-4 w-2/3' />
								<div className='pt-2' />
								<Skeleton className='h-4 w-40' /> {/* \section{...} */}
								<div className='pl-6 space-y-3'>
									<Skeleton className='h-4 w-full' />
									<Skeleton className='h-4 w-[90%]' />
									<Skeleton className='h-4 w-[95%]' />
								</div>
								<div className='pt-4' />
								<Skeleton className='h-4 w-44' /> {/* \begin{itemize} */}
								<div className='pl-12 space-y-3'>
									<Skeleton className='h-4 w-1/2' />
									<Skeleton className='h-4 w-[45%]' />
									<Skeleton className='h-4 w-[60%]' />
								</div>
								<Skeleton className='h-4 w-36' />
							</div>
							<Skeleton className='h-4 w-40' /> {/* \end{document} */}
						</div>
					</div>

					{/* Resizer Handle Simulation */}
					<div className='w-1 bg-border hover:bg-primary/50 transition-colors cursor-col-resize' />

					{/* Right: PDF Preview Skeleton (45%) */}
					<div className='flex-[0.45] bg-muted/30 overflow-hidden flex flex-col p-4 sm:p-8 relative'>
						{/* PDF Page Simulation */}
						<div className='w-full h-full bg-card shadow-sm border border-border rounded-sm flex flex-col items-center justify-center relative overflow-hidden'>
							<div className='opacity-10 flex flex-col items-center gap-4'>
								<FileText className='size-16' />
								<div className='space-y-2 flex flex-col items-center'>
									<Skeleton className='h-4 w-32' />
									<Skeleton className='h-3 w-48' />
								</div>
							</div>

							{/* Faint document lines for realism */}
							<div className='absolute inset-0 p-12 space-y-6 pointer-events-none opacity-[0.03]'>
								<div className='h-8 w-1/2 bg-foreground mx-auto mb-10' />
								<div className='space-y-4'>
									<div className='h-4 w-full bg-foreground' />
									<div className='h-4 w-full bg-foreground' />
									<div className='h-4 w-[90%] bg-foreground' />
									<div className='h-4 w-full bg-foreground' />
									<div className='h-4 w-[85%] bg-foreground' />
								</div>
								<div className='pt-8 space-y-4'>
									<div className='h-4 w-full bg-foreground' />
									<div className='h-4 w-[95%] bg-foreground' />
									<div className='h-4 w-full bg-foreground' />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
