'use client'

import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { useTemplates } from '@/lib/api/hooks/use-templates'

import { CreateDocumentModal } from '../document/CreateDocumentModal'

interface TemplateGalleryProps {
	workspaceId: string
}

export function TemplateGallery({ workspaceId }: TemplateGalleryProps) {
	const { data, isLoading, error } = useTemplates()
	const t = useTranslations('Template')
	const [isModalOpen, setIsModalOpen] = React.useState(false)
	const [selectedTemplate, setSelectedTemplate] = React.useState<{
		id: string
		name: string
		logoUrl?: string
	}>({
		id: '',
		name: '',
	})

	const templates = data?.templates || []

	const handleSelectTemplate = (templateId: string, templateName: string, logoUrl?: string) => {
		setSelectedTemplate({ id: templateId, name: templateName, logoUrl })
		setIsModalOpen(true)
	}

	if (isLoading) {
		return (
			<div className='flex items-center justify-center py-20'>
				<Loader2 className='h-8 w-8 animate-spin text-primary' />
				<span className='ml-3 text-muted-foreground'>{t('loading')}</span>
			</div>
		)
	}

	const getBrandLogo = (name: string, category: string) => {
		const searchStr = `${name} ${category}`.toLowerCase()
		const brands = [
			{ key: 'elsevier', ext: 'svg' },
			{ key: 'ieee', ext: 'svg' },
			{ key: 'nature', ext: 'svg' },
			{ key: 'springer', ext: 'svg' },
			{ key: 'telkom', ext: 'png', file: 'telkomu' },
		]
		const matched = brands.find((b) => searchStr.includes(b.key))

		console.log('Searching for brand in:', searchStr, 'Matched:', matched)

		if (matched) {
			const fileName = matched.file || matched.key
			return `/templates/brands/${fileName}.${matched.ext}`
		}
		return null
	}

	if (error) {
		return (
			<div className='text-center py-10 bg-destructive/10 rounded-xl border border-destructive/20'>
				<p className='text-destructive'>{t('loadError')}</p>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center gap-2 mb-4'>
				<h3 className='text-lg font-semibold'>{t('chooseTemplate')}</h3>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
				<div className='bg-card border border-border rounded-lg p-6 hover:border-primary transition-all group relative text-left w-full flex flex-col'>
					<div className='mb-3'>
						<h3 className='text-lg font-semibold text-foreground group-hover:text-primary transition-colors'>
							{t('blankDocument')}
						</h3>
					</div>
					<p className='text-muted-foreground text-sm mb-3 line-clamp-2 min-h-[40px]'>
						{t('blankDocumentDesc')}
					</p>
					<div className='mt-auto'>
						<Button className='w-full' onClick={() => handleSelectTemplate('', 'Blank Document')}>
							{t('select')}
						</Button>
					</div>
				</div>

				{templates.map((template) => {
					const logoUrl = getBrandLogo(template.name, template.category)
					return (
						<div
							key={template.id}
							className='bg-card border border-border rounded-lg p-6 hover:border-primary transition-all group relative text-left w-full flex flex-col'
						>
							<div className='mb-3'>
								<h3 className='text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1'>
									{template.name}
								</h3>
							</div>

							<p className='text-muted-foreground text-sm mb-3 line-clamp-2 min-h-[40px]'>
								{template.description}
							</p>

							<div className='mb-4 flex items-center justify-between w-full'>
								<span className='bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase'>
									{template.category}
								</span>
								{logoUrl && (
									<Image
										src={logoUrl}
										alt={template.category}
										width={80}
										height={32}
										className='h-8 w-auto'
									/>
								)}
							</div>

							<div className='mt-auto'>
								<Button
									className='w-full'
									onClick={() =>
										handleSelectTemplate(template.id, template.name, logoUrl || undefined)
									}
								>
									{t('useTemplate')}
								</Button>
							</div>
						</div>
					)
				})}
			</div>

			<CreateDocumentModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				workspaceId={workspaceId}
				templateId={selectedTemplate.id}
				templateName={selectedTemplate.name}
				logoUrl={selectedTemplate.logoUrl}
			/>
		</div>
	)
}
