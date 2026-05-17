export interface AIModel {
	id: string
	name: string
	chef: string
}

export const AI_MODELS: AIModel[] = [
	{ id: 'google-genai:gemma-4-31b-it', name: 'Gemma 4 31B IT', chef: 'google' },
	{ id: 'google-genai:gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite Preview', chef: 'google' },
	{ id: 'google-genai:gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', chef: 'google' },
	{ id: 'google-genai:gemini-2.5-flash', name: 'Gemini 2.5 Flash', chef: 'google' },
]
