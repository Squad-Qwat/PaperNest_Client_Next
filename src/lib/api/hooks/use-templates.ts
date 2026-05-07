import { useQuery } from '@tanstack/react-query';
import { templatesService } from '../services/templates.service';

export const TEMPLATE_KEYS = {
  all: ['templates'] as const,
  list: () => [...TEMPLATE_KEYS.all, 'list'] as const,
  detail: (id: string) => [...TEMPLATE_KEYS.all, 'detail', id] as const,
};

export function useTemplates() {
  return useQuery({
    queryKey: TEMPLATE_KEYS.list(),
    queryFn: () => templatesService.getTemplates(),
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: TEMPLATE_KEYS.detail(id),
    queryFn: () => templatesService.getById(id),
    enabled: !!id,
  });
}
