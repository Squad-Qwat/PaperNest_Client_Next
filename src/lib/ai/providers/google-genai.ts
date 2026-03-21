import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { AIProvider, AIProviderConfig, AIProviderID } from './types'

export class GoogleGenAIProvider implements AIProvider {
	id: AIProviderID = 'google-genai'
	name = 'Google Gemini'

	createModel(config: AIProviderConfig): BaseChatModel {
		const apiKey = process.env.GOOGLE_API_KEY

		if (!apiKey) {
			throw new Error('GOOGLE_API_KEY is not set')
		}

		const modelName = config.model || 'gemini-2.5-flash-lite'
		console.log(`[GoogleGenAI] Creating model: ${modelName}`)

		return new ChatGoogleGenerativeAI({
			apiKey,
			model: modelName,
			temperature: config.temperature,
			maxOutputTokens: config.maxTokens,
			streaming: config.streaming,
		})
	}

	getAvailableModels(): string[] {
		return [
			'gemini-2.5-flash',
			'gemini-1.5-pro',
			'gemini-1.5-flash',
			'gemini-1.5-flash-8b',
		]
	}

	validateCredentials(): { valid: boolean; error?: string } {
		if (!process.env.GOOGLE_API_KEY) {
			return { valid: false, error: 'GOOGLE_API_KEY is not set' }
		}
		return { valid: true }
	}
}
