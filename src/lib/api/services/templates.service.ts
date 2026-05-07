import { apiClient } from '../clients/api-client'
import { API_ENDPOINTS } from '../config'
import type { Template, TemplateMetadata, TemplatesResponse } from '../types/template.types'

export const templatesService = {
	/**
	 * Get all available LaTeX templates
	 */
	getTemplates: async (): Promise<TemplatesResponse> => {
		return apiClient.get<TemplatesResponse>(API_ENDPOINTS.templates.base)
	},

	/**
	 * Get template by ID
	 */
	getById: async (templateId: string): Promise<Template> => {
		return apiClient.get<Template>(API_ENDPOINTS.templates.byId(templateId))
	},
}
