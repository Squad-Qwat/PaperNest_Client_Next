'use client'

import { FilePlus, Layout, Loader2 } from 'lucide-react'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTemplates } from '@/lib/api/hooks/use-templates'
import { useCreateDocument } from '@/lib/api/hooks/use-documents'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface TemplateGalleryProps {
	workspaceId: string
}

export function TemplateGallery({ workspaceId }: TemplateGalleryProps) {
	const router = useRouter()
	const { data, isLoading, error } = useTemplates()
	const { mutateAsync: createDocument, isPending: isCreating } = useCreateDocument()

	const templates = data?.templates || []

	const handleSelectTemplate = async (templateId: string, templateName: string) => {
		try {
			const result = await createDocument({
				workspaceId,
				data: {
					title: `Untitled ${templateName}`,
					description: `Document created from ${templateName} template`,
					templateId: templateId,
				},
			})

			if (result.document) {
				router.push(`/${workspaceId}/documents/${result.document.documentId}`)
			}
		} catch (err) {
			console.error('Error creating document from template:', err)
			toast.error('Gagal membuat dokumen dari template')
		}
	}

	if (isLoading) {
		return (
			<div className='flex items-center justify-center py-20'>
				<Loader2 className='h-8 w-8 animate-spin text-primary' />
				<span className='ml-3 text-gray-500'>Memuat template...</span>
			</div>
		)
	}

	if (error) {
		return (
			<div className='text-center py-10 bg-red-50 rounded-xl border border-red-100'>
				<p className='text-red-600'>Gagal memuat template. Silakan coba lagi nanti.</p>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center gap-2 mb-4'>
				<Layout className='h-5 w-5 text-primary' />
				<h3 className='text-lg font-semibold'>Pilih Template</h3>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
				{/* Blank Document Option */}
				<Card 
					className='hover:border-primary transition-all cursor-pointer group flex flex-col'
					onClick={() => handleSelectTemplate('', 'Blank Document')}
				>
					<div className='aspect-[4/3] bg-gray-50 flex items-center justify-center border-b group-hover:bg-primary/5 transition-colors'>
						<FilePlus className='h-12 w-12 text-gray-300 group-hover:text-primary transition-colors' />
					</div>
					<CardHeader className='p-4 flex-1'>
						<CardTitle className='text-base'>Dokumen Kosong</CardTitle>
						<CardDescription className='text-xs line-clamp-2'>
							Mulai dari awal dengan dokumen LaTeX kosong.
						</CardDescription>
					</CardHeader>
					<CardFooter className='p-4 pt-0'>
						<Button variant='ghost' className='w-full text-xs h-8 group-hover:bg-primary group-hover:text-white'>
							Pilih
						</Button>
					</CardFooter>
				</Card>

				{/* Template List */}
				{templates.map((template) => (
					<Card 
						key={template.id}
						className='hover:border-primary transition-all cursor-pointer group flex flex-col'
						onClick={() => handleSelectTemplate(template.id, template.name)}
					>
						<div className='aspect-[4/3] bg-gray-100 border-b overflow-hidden relative'>
							{template.thumbnail ? (
								<img 
									src={template.thumbnail} 
									alt={template.name} 
									className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
								/>
							) : (
								<div className='w-full h-full flex items-center justify-center bg-gray-50'>
									<Layout className='h-12 w-12 text-gray-300' />
								</div>
							)}
							<div className='absolute top-2 right-2'>
								<span className='bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase'>
									{template.category}
								</span>
							</div>
						</div>
						<CardHeader className='p-4 flex-1'>
							<CardTitle className='text-base'>{template.name}</CardTitle>
							<CardDescription className='text-xs line-clamp-2'>
								{template.description}
							</CardDescription>
						</CardHeader>
						<CardFooter className='p-4 pt-0'>
							<Button 
								variant='ghost' 
								className='w-full text-xs h-8 group-hover:bg-primary group-hover:text-white'
								disabled={isCreating}
							>
								{isCreating ? 'Membuat...' : 'Gunakan Template'}
							</Button>
						</CardFooter>
					</Card>
				))}
			</div>
		</div>
	)
}
