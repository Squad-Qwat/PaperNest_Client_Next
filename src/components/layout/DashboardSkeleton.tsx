'use client'

import React from 'react'
import { Skeleton } from "@/components/ui/skeleton"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export function DashboardSkeleton() {
	return (
		<SidebarProvider className="h-svh overflow-hidden bg-sidebar">
			{/* Visual Sidebar Placeholder (Non-interactive) */}
			<div className="w-[--sidebar-width] bg-sidebar border-r border-sidebar-border hidden md:flex flex-col p-4 gap-6">
				{/* Sidebar Header Placeholder */}
				<div className="flex items-center gap-2 mb-4">
					<Skeleton className="h-10 w-10 rounded-lg" />
					<div className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-3 w-16" />
					</div>
				</div>

				{/* Sidebar Search Placeholder */}
				<Skeleton className="h-9 w-full rounded-md" />

				{/* Sidebar Nav Items Placeholder */}
				<div className="space-y-6 pt-4">
					<div className="space-y-3">
						<Skeleton className="h-3 w-20 mb-2 opacity-50" />
						<Skeleton className="h-8 w-full rounded-md" />
						<Skeleton className="h-8 w-full rounded-md" />
						<Skeleton className="h-8 w-full rounded-md" />
					</div>
					<div className="space-y-3">
						<Skeleton className="h-3 w-20 mb-2 opacity-50" />
						<Skeleton className="h-8 w-full rounded-md" />
						<Skeleton className="h-8 w-full rounded-md" />
					</div>
				</div>

				{/* Sidebar Footer Placeholder */}
				<div className="mt-auto pt-4 flex items-center gap-2 border-t border-sidebar-border/50">
					<Skeleton className="h-8 w-8 rounded-full" />
					<div className="space-y-1.5 flex-1">
						<Skeleton className="h-3 w-24" />
						<Skeleton className="h-2 w-16" />
					</div>
				</div>
			</div>

			{/* Main Content Placeholder */}
			<SidebarInset className="flex flex-col min-h-0 overflow-hidden border border-gray-200/50 isolate rounded-2xl m-2 bg-white shadow-sm">
				<header className='flex h-16 shrink-0 items-center gap-2 px-6 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10'>
					<Skeleton className="h-8 w-8 rounded-md" />
					<Separator orientation='vertical' className='mx-2 h-4' />
					<Skeleton className='h-4 w-32' />
				</header>
				
				<main className='flex-1 p-8 space-y-10 overflow-y-auto'>
					{/* Page Header */}
					<div className="flex items-center justify-between">
						<div className="space-y-3">
							<Skeleton className='h-9 w-64' />
							<Skeleton className='h-4 w-96 opacity-60' />
						</div>
					</div>

					{/* Filters/Search Area */}
					<div className="flex gap-4">
						<Skeleton className="h-10 flex-1 rounded-xl" />
						<Skeleton className="h-10 w-32 rounded-xl" />
					</div>

					{/* Documents Grid Placeholder */}
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
						{[...Array(6)].map((_, i) => (
							<div key={i} className="p-6 border border-gray-100 rounded-2xl space-y-4">
								<div className="flex justify-between items-start">
									<Skeleton className='h-6 w-3/4 rounded-md' />
									<Skeleton className='h-5 w-5 rounded-full' />
								</div>
								<div className="space-y-2">
									<Skeleton className='h-3 w-full' />
									<Skeleton className='h-3 w-2/3' />
								</div>
								<div className="pt-4 flex gap-2">
									<Skeleton className='h-10 flex-1 rounded-lg' />
									<Skeleton className='h-10 w-10 rounded-lg' />
								</div>
							</div>
						))}
					</div>
				</main>
			</SidebarInset>
		</SidebarProvider>
	)
}
