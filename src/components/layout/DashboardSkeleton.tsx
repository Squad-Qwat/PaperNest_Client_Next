'use client'

import { Separator } from '@/components/ui/separator'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuSkeleton,
	SidebarProvider,
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'

export function SidebarSkeleton() {
	return (
		<Sidebar variant='inset' collapsible='icon'>
			<SidebarHeader>
				<div className='flex items-center gap-2 p-2'>
					<Skeleton className='h-10 w-10 rounded-lg' />
					<div className='space-y-2 flex-1'>
						<Skeleton className='h-4 w-24' />
						<Skeleton className='h-3 w-16' />
					</div>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<div className='p-4 space-y-8'>
					<div className='space-y-4'>
						<Skeleton className='h-3 w-20 opacity-50' />
						<SidebarMenu>
							{[1, 2, 3].map((i) => (
								<SidebarMenuItem key={i}>
									<SidebarMenuSkeleton showIcon />
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</div>
					<div className='space-y-4'>
						<Skeleton className='h-3 w-20 opacity-50' />
						<SidebarMenu>
							{[1, 2, 3].map((i) => (
								<SidebarMenuItem key={i}>
									<SidebarMenuSkeleton showIcon />
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</div>
				</div>
			</SidebarContent>
			<SidebarFooter>
				<div className='p-2 flex items-center gap-2'>
					<Skeleton className='h-8 w-8 rounded-lg' />
					<div className='space-y-1.5 flex-1'>
						<Skeleton className='h-3 w-20' />
						<Skeleton className='h-2 w-16' />
					</div>
				</div>
			</SidebarFooter>
		</Sidebar>
	)
}

export function DashboardContentSkeleton() {
	return (
		<>
			<header className='flex h-16 shrink-0 items-center gap-2 px-6 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10'>
				<Skeleton className='h-8 w-8 rounded-md' />
				<Separator orientation='vertical' className='mx-2 h-4' />
				<Skeleton className='h-4 w-32' />
			</header>

			<main className='flex-1 p-8 space-y-10 overflow-y-auto'>
				<div className='flex items-center justify-between'>
					<div className='space-y-3'>
						<Skeleton className='h-9 w-64' />
						<Skeleton className='h-4 w-96 opacity-60' />
					</div>
				</div>

				<div className='flex gap-4'>
					<Skeleton className='h-10 flex-1 rounded-xl' />
					<Skeleton className='h-10 w-32 rounded-xl' />
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
					{[{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }].map((item) => (
						<div
							key={`doc-skeleton-${item.id}`}
							className='p-6 border border-gray-100 rounded-2xl space-y-4'
						>
							<div className='flex justify-between items-start'>
								<Skeleton className='h-6 w-3/4 rounded-md' />
								<Skeleton className='h-5 w-5 rounded-full' />
							</div>
							<div className='space-y-2'>
								<Skeleton className='h-3 w-full' />
								<Skeleton className='h-3 w-2/3' />
							</div>
							<div className='pt-4 flex gap-2'>
								<Skeleton className='h-10 flex-1 rounded-lg' />
								<Skeleton className='h-10 w-10 rounded-lg' />
							</div>
						</div>
					))}
				</div>
			</main>
		</>
	)
}

export function ReviewContentSkeleton() {
	return (
		<>
			<header className='flex h-16 shrink-0 items-center gap-2 px-6 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10'>
				<Skeleton className='h-8 w-8 rounded-md' />
				<Separator orientation='vertical' className='mx-2 h-4' />
				<Skeleton className='h-4 w-48' />
			</header>

			<main className='flex-1 p-8 space-y-10 overflow-y-auto'>
				<div className='flex items-center justify-between'>
					<div className='space-y-3'>
						<Skeleton className='h-9 w-48' />
					</div>
				</div>

				<div className='flex flex-col lg:flex-row gap-4'>
					<Skeleton className='h-10 flex-1 rounded-xl' />
					<div className='flex gap-3'>
						<Skeleton className='h-10 w-[220px] rounded-xl' />
						<Skeleton className='h-10 w-[180px] rounded-xl' />
						<Skeleton className='h-10 w-[130px] rounded-xl' />
					</div>
				</div>

				<div className='space-y-4'>
					<Skeleton className='h-6 w-40 mb-6' />
					{[1, 2, 3, 4, 5].map((i) => (
						<div
							key={`review-skeleton-${i}`}
							className='p-6 border border-gray-100 rounded-2xl flex flex-col gap-4'
						>
							<div className='flex justify-between items-start'>
								<div className='space-y-2 flex-1'>
									<Skeleton className='h-5 w-1/3 rounded-md' />
									<Skeleton className='h-3 w-1/4 opacity-60' />
								</div>
								<Skeleton className='h-6 w-24 rounded-full' />
							</div>
							<div className='space-y-2'>
								<Skeleton className='h-3 w-full' />
								<Skeleton className='h-3 w-2/3' />
							</div>
						</div>
					))}
				</div>
			</main>
		</>
	)
}

export function DashboardSkeleton() {
	return (
		<SidebarProvider className='h-svh overflow-hidden bg-sidebar'>
			<SidebarSkeleton />
			<SidebarInset className='flex flex-col min-h-0 overflow-hidden border border-gray-200/50 isolate rounded-2xl m-2 bg-white shadow-sm'>
				<DashboardContentSkeleton />
			</SidebarInset>
		</SidebarProvider>
	)
}
