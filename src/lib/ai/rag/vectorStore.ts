import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory"
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import fs from "node:fs/promises"
import path from "path"

const CACHE_DIR = path.join(process.cwd(), ".vector_cache")

// Singleton embeddings model instance
let embeddingsInstance: GoogleGenerativeAIEmbeddings | null = null

export const getEmbeddingsModel = () => {
	if (embeddingsInstance) return embeddingsInstance

	const apiKey = process.env.GOOGLE_API_KEY
	if (!apiKey) throw new Error("GOOGLE_API_KEY is missing for embeddings")

	embeddingsInstance = new GoogleGenerativeAIEmbeddings({
		apiKey,
		model: "text-embedding-004",
	})
	return embeddingsInstance
}

// In-memory LRU cache for vector stores (max 5 active stores)
const storeCache = new Map<string, MemoryVectorStore>()
const MAX_CACHED_STORES = 5

export const getVectorStorePath = (documentId: string) => {
	return path.join(CACHE_DIR, `${documentId}.json`)
}

export const loadVectorStore = async (
	documentId: string
): Promise<MemoryVectorStore> => {
	// Check in-memory cache first
	if (storeCache.has(documentId)) {
		return storeCache.get(documentId)!
	}

	const embeddings = getEmbeddingsModel()
	const store = new MemoryVectorStore(embeddings)

	try {
		await fs.mkdir(CACHE_DIR, { recursive: true })
		const filePath = getVectorStorePath(documentId)
		const data = await fs.readFile(filePath, "utf-8")
		const parsed = JSON.parse(data)

		// MemoryVectorStore internal state
		store.memoryVectors = parsed

		// Add to cache with LRU eviction
		storeCache.set(documentId, store)
		if (storeCache.size > MAX_CACHED_STORES) {
			const firstKey = storeCache.keys().next().value as string | undefined
			if (firstKey) {
				storeCache.delete(firstKey)
			}
		}

		return store
	} catch (e) {
		// Return empty store if not found or parse error
		return store
	}
}

// Ensure cache directory exists on startup
const ensureCacheDirReady = fs.mkdir(CACHE_DIR, { recursive: true }).catch(() => {})

export const saveVectorStore = async (
	documentId: string,
	store: MemoryVectorStore
): Promise<void> => {
	try {
		await ensureCacheDirReady
		const filePath = getVectorStorePath(documentId)
		await fs.writeFile(filePath, JSON.stringify(store.memoryVectors))
		// Invalidate cache to force reload on next use
		storeCache.delete(documentId)
	} catch (e) {
		console.error("Failed to save vector store:", e)
	}
}
