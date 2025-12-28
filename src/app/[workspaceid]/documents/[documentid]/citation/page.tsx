'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/store' // Importing from your store.tsx
import { DocumentService } from '@/lib/firebase/document-service'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SearchInput } from '@/components/ui/search-input'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input' // Assuming you have an Input component
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, Quote } from 'lucide-react'

// Define Citation Type
interface Citation {
	id: string
	sourceTitle: string
	author: string
	year: string
	addedBy: string
	createdAt: string
}

export default function CitationPage() {
	const params = useParams()
	const router = useRouter()
	const { currentUser } = useAuth() // Refactored: using useAuth from store.tsx

	// State
	const [document, setDocument] = useState<any | null>(null)
	const [citations, setCitations] = useState<Citation[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [isAddModalOpen, setIsAddModalOpen] = useState(false)

	// Form State
	const [newCitation, setNewCitation] = useState({
		sourceTitle: '',
		author: '',
		year: new Date().getFullYear().toString(),
	})

	const workspaceId = params.workspaceid as string
	const documentId = params.documentid as string

	// 1. Fetch Document Data (Refactored from useDocuments)
	useEffect(() => {
		const fetchDocumentData = async () => {
			if (!currentUser || !documentId || !workspaceId) return

			try {
				setIsLoading(true)
				// Use DocumentService directly instead of the deprecated store
				const doc = await DocumentService.getDocumentById(documentId)

				if (!doc) {
					console.error('Document not found')
					router.push(`/${workspaceId}`)
					return
				}

				setDocument(doc)

				// NOTE: Since DocumentService types don't strictly define 'citations', 
				// we assume they are stored in savedContent or we default to an empty array.
				// You might want to create a separate sub-collection for citations in a real app.
				const loadedCitations = doc.savedContent?.citations || []
				setCitations(loadedCitations)

			} catch (error) {
				console.error('Failed to load document:', error)
			} finally {
				setIsLoading(false)
			}
		}

		fetchDocumentData()
	}, [documentId, workspaceId, currentUser, router])

	// 2. Filter citations based on search
	const filteredCitations = useMemo(() => {
		return citations.filter(
			(c) =>
				c.sourceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
				c.author.toLowerCase().includes(searchQuery.toLowerCase())
		)
	}, [citations, searchQuery])

	// 3. Handle Adding New Citation
	const handleAddCitation = async () => {
		if (!newCitation.sourceTitle.trim() || !currentUser || !document) return

		const citationEntry: Citation = {
			id: `cit_${Date.now()}`,
			sourceTitle: newCitation.sourceTitle,
			author: newCitation.author,
			year: newCitation.year,
			addedBy: `${currentUser || 'User'} ${currentUser || ''}`,
			createdAt: new Date().toISOString(), // Standard format
		}

		const updatedCitations = [citationEntry, ...citations]

		try {
			// Update via DocumentService
			// We store citations inside savedContent as metadata since the schema is strict
			await DocumentService.updateDocument(documentId, {
				savedContent: {
					...document.savedContent,
					citations: updatedCitations
				}
			})

			// Update local state
			setCitations(updatedCitations)
			setNewCitation({ sourceTitle: '', author: '', year: new Date().getFullYear().toString() })
			setIsAddModalOpen(false)

		} catch (error) {
			console.error('Failed to save citation:', error)
			alert('Failed to save citation. Please try again.')
		}
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-950 flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-blue-500" />
			</div>
		)
	}

	if (!currentUser || !document) return null

	return (
		<div className='min-h-screen bg-gray-950'>
			<Navbar mode='document' documentId={documentId} />

			<main className='max-w-5xl mx-auto px-4 py-8'>
				<div className='mb-8'>
					<button
						onClick={() => router.push(`/${workspaceId}`)}
						className='flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-4 transition-colors'
					>
						← Back to Dashboard
					</button>

					<div className="flex justify-between items-start">
						<div>
							<h1 className='text-3xl font-bold text-gray-100 mb-2'>
								Citations - {document.title}
							</h1>
							<p className='text-gray-400'>Manage references and bibliography for this document.</p>
						</div>
					</div>
				</div>

				<div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8'>
					<div className='flex items-center gap-3 w-full md:w-auto'>
						<SearchInput
							value={searchQuery}
							onChange={setSearchQuery}
							placeholder='Search by author or title...'
							className='w-full md:w-64'
						/>
						<Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
							<Plus className="w-4 h-4 mr-2" />
							Add Citation
						</Button>
					</div>
				</div>

				<Separator className='mb-8 bg-gray-800' />

				<div className='grid grid-cols-1 gap-4'>
					{filteredCitations.map((cit) => (
						<Card
							key={cit.id}
							className='overflow-hidden border border-gray-800 rounded-lg p-0 hover:border-gray-600 bg-gray-900 transition-all'
						>
							<CardContent className='p-6 flex flex-col md:flex-row gap-4 items-start'>
								<div className="p-3 bg-blue-900/20 rounded-lg border border-blue-800/30">
									<Quote className="w-6 h-6 text-blue-400" />
								</div>
								
								<div className="flex-1">
									<div className="flex justify-between items-start mb-2">
										<h3 className="text-lg font-semibold text-gray-100">{cit.sourceTitle}</h3>
										<Badge variant="outline" className="font-mono text-xs text-gray-400 border-gray-700">
											{cit.year}
										</Badge>
									</div>
									
									<p className="text-gray-400 mb-3">
										<span className="font-medium text-gray-300">Author:</span> {cit.author}
									</p>
									
									<div className="flex items-center gap-2 text-xs text-gray-500 font-mono mt-2">
										<span>Added by {cit.addedBy}</span>
										<span>•</span>
										<span>{new Date(cit.createdAt).toLocaleDateString()}</span>
									</div>
								</div>
							</CardContent>
						</Card>
					))}

					{filteredCitations.length === 0 && (
						<div className='text-center py-20 border-2 border-dashed border-gray-800 rounded-xl bg-gray-900/50'>
							<p className='text-gray-500'>No citations found. Add one to get started.</p>
						</div>
					)}
				</div>
			</main>

			{/* Add Citation Modal */}
			<Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
				<DialogContent className='bg-gray-900 text-white border-gray-800'>
					<DialogHeader>
						<DialogTitle>Add New Citation</DialogTitle>
						<DialogDescription className='text-gray-400'>
							Enter the details of the source you wish to cite.
						</DialogDescription>
					</DialogHeader>

					<div className='py-4 space-y-4'>
						<div className='space-y-2'>
							<Label>Source Title</Label>
							<Input
								placeholder='e.g., The Future of AI'
								value={newCitation.sourceTitle}
								onChange={(e) => setNewCitation({ ...newCitation, sourceTitle: e.target.value })}
								className='bg-gray-950 border-gray-800'
							/>
						</div>
						
						<div className="grid grid-cols-2 gap-4">
							<div className='space-y-2'>
								<Label>Author</Label>
								<Input
									placeholder='e.g., John Doe'
									value={newCitation.author}
									onChange={(e) => setNewCitation({ ...newCitation, author: e.target.value })}
									className='bg-gray-950 border-gray-800'
								/>
							</div>
							<div className='space-y-2'>
								<Label>Year</Label>
								<Input
									placeholder='e.g., 2024'
									value={newCitation.year}
									onChange={(e) => setNewCitation({ ...newCitation, year: e.target.value })}
									className='bg-gray-950 border-gray-800'
								/>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button variant='outline' onClick={() => setIsAddModalOpen(false)} className="border-gray-700 hover:bg-gray-800 hover:text-white">
							Cancel
						</Button>
						<Button 
							onClick={handleAddCitation} 
							disabled={!newCitation.sourceTitle.trim()}
							className="bg-blue-600 hover:bg-blue-700"
						>
							Add Citation
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}