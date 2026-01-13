import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatVertexAI } from '@langchain/google-vertexai'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'

/**
 * AI Provider types
 */
export type AIProvider = 'google-genai' | 'vertex-ai'

/**
 * AI Configuration interface
 */
export interface AIConfig {
	provider: AIProvider
	model: string
	temperature: number
	maxTokens: number
	streaming: boolean
}

/**
 * Get AI configuration from environment variables
 */
export const getAIConfig = (): AIConfig => {
	return {
		provider: (process.env.AI_PROVIDER as AIProvider) || 'google-genai',
		model: process.env.AI_MODEL || 'gemini-2.5-flash',
		temperature: Number(process.env.AI_TEMPERATURE) || 0.7,
		maxTokens: Number(process.env.AI_MAX_TOKENS) || 8192,
		streaming: true,
	}
}

/**
 * Create AI model instance based on provider
 */
export const createAIModel = (config?: Partial<AIConfig>): BaseChatModel => {
	const fullConfig = { ...getAIConfig(), ...config }

	switch (fullConfig.provider) {
		case 'google-genai':
			return createGoogleGenerativeAI(fullConfig)

		case 'vertex-ai':
			return createVertexAI(fullConfig)

		default:
			throw new Error(`Unknown AI provider: ${fullConfig.provider}`)
	}
}

/**
 * Create Google Generative AI (Gemini API) model
 */
const createGoogleGenerativeAI = (config: AIConfig): ChatGoogleGenerativeAI => {
	const apiKey = process.env.GOOGLE_API_KEY

	if (!apiKey) {
		throw new Error(
			'GOOGLE_API_KEY is not set. Get one from https://makersuite.google.com/app/apikey'
		)
	}

	return new ChatGoogleGenerativeAI({
		apiKey,
		model: config.model,
		temperature: config.temperature,
		maxOutputTokens: config.maxTokens,
		streaming: config.streaming,
	})
}

/**
 * Create Vertex AI model
 */
const createVertexAI = (config: AIConfig): ChatVertexAI => {
	const projectId = process.env.VERTEX_AI_PROJECT_ID
	const location = process.env.VERTEX_AI_LOCATION || 'us-central1'

	if (!projectId) {
		throw new Error(
			'VERTEX_AI_PROJECT_ID is not set. Set it in your .env.local file'
		)
	}

	return new ChatVertexAI({
		model: config.model,
		temperature: config.temperature,
		maxOutputTokens: config.maxTokens,
		streaming: config.streaming,
		// Vertex AI uses Application Default Credentials (ADC)
		// Set via: gcloud auth application-default login
		authOptions: {
			projectId,
		},
		platformType: 'gcp',
		location,
	})
}

/**
 * Get available models for current provider
 */
export const getAvailableModels = (provider?: AIProvider): string[] => {
	const currentProvider = provider || getAIConfig().provider

	switch (currentProvider) {
		case 'google-genai':
			return [
				'gemini-2.5-flash', // Latest, fastest
				'gemini-1.5-pro', // Most capable
				'gemini-1.5-flash', // Fast and efficient
				'gemini-1.5-flash-8b', // Smallest, cheapest
			]

		case 'vertex-ai':
			return [
				'gemini-2.5-flash',
				'gemini-1.5-pro-002',
				'gemini-1.5-flash-002',
				'gemini-1.0-pro-002',
			]

		default:
			return []
	}
}

/**
 * Validate API credentials
 */
export const validateAICredentials = (): { valid: boolean; error?: string } => {
	const config = getAIConfig()

	switch (config.provider) {
		case 'google-genai':
			if (!process.env.GOOGLE_API_KEY) {
				return {
					valid: false,
					error: 'GOOGLE_API_KEY is not set',
				}
			}
			break

		case 'vertex-ai':
			if (!process.env.VERTEX_AI_PROJECT_ID) {
				return {
					valid: false,
					error: 'VERTEX_AI_PROJECT_ID is not set',
				}
			}
			break
	}

	return { valid: true }
}
