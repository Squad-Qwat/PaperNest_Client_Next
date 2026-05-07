import { useQuery } from '@tanstack/react-query'
import { templatesService } from '../services/templates.service'
import type { Template, TemplatesResponse } from '../types/template.types'

export const TEMPLATE_KEYS = {
	all: ['templates'] as const,
	list: () => [...TEMPLATE_KEYS.all, 'list'] as const,
	detail: (id: string) => [...TEMPLATE_KEYS.all, 'detail', id] as const,
}

export function useTemplates() {
	return useQuery<TemplatesResponse>({
		queryKey: TEMPLATE_KEYS.list(),
		queryFn: () => templatesService.getTemplates(),
		staleTime: 30 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	})
}

export function useTemplate(id: string) {
	return useQuery<Template>({
		queryKey: TEMPLATE_KEYS.detail(id),
		queryFn: () => templatesService.getById(id),
		enabled: !!id,
		staleTime: 60 * 60 * 1000,
	})
}
