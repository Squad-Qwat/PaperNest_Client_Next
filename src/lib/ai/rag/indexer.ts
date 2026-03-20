import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { Document } from "@langchain/core/documents"
import { loadVectorStore, saveVectorStore } from "./vectorStore"

/**
 * Interface representing a document from Tiptap or Papernest
 */
export interface TiptapDocument {
	id: string
	content: string
	title?: string
}

/**
 * Indexes a document into the local Vector Store.
 * Replaces the existing index for this document.
 */
export const indexDocument = async (doc: TiptapDocument): Promise<number> => {
	// 1. Text Splitting (Chunking)
	const textSplitter = new RecursiveCharacterTextSplitter({
		chunkSize: 1000,
		chunkOverlap: 200,
	})

	const chunks = await textSplitter.createDocuments(
		[doc.content],
		[{ documentId: doc.id, title: doc.title || "Untitled" }]
	)

	if (chunks.length === 0) {
		return 0
	}

	// 2. Load Vector Store
	const store = await loadVectorStore(doc.id)

	// Clear old vectors to replace
	store.memoryVectors = []

	await store.addDocuments(chunks)

	// 3. Save to disk cache
	await saveVectorStore(doc.id, store)

	return chunks.length
}

/**
 * Searches the vector store for relevant chunks matching a query.
 */
export const searchDocumentContext = async (
	documentId: string,
	query: string,
	k: number = 3
): Promise<string> => {
	const store = await loadVectorStore(documentId)

	if (store.memoryVectors.length === 0) {
		return "Document index is empty. Please index the document first."
	}

	const results = await store.similaritySearch(query, k)

	if (results.length === 0) {
		return "No relevant context found."
	}

	const formattedResults = results
		.map((doc: any, i: number) => `--- Excerpt ${i + 1} ---\n${doc.pageContent}`)
		.join("\n\n")

	return `[Context retrieved from document]\n${formattedResults}`
}
