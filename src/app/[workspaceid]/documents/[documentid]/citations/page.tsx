'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/store' 
import { DocumentService } from '@/lib/firebase/document-service'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { Input } from '@/components/ui/input' 
import { Loader2, Plus, Quote, FileInput, Copy, Check } from 'lucide-react'

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
	const { currentUser } = useAuth()

	const [document, setDocument] = useState<any | null>(null)
	const [citations, setCitations] = useState<Citation[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [isAddModalOpen, setIsAddModalOpen] = useState(false)
	const [copiedId, setCopiedId] = useState<string | null>(null)

	const [newCitation, setNewCitation] = useState({
		sourceTitle: '',
		author: '',
		year: new Date().getFullYear().toString(),
	})

	const workspaceId = params.workspaceid as string
	const documentId = params.documentid as string

	useEffect(() => {
		const fetchDocumentData = async () => {
			if (!currentUser || !documentId || !workspaceId) return
			try {
				setIsLoading(true)
				const doc = await DocumentService.getDocumentById(documentId)
				if (!doc) {
					router.push(`/${workspaceId}`)
					return
				}
				setDocument(doc)
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

	const filteredCitations = useMemo(() => {
		return citations.filter(
			(c) =>
				c.sourceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
				c.author.toLowerCase().includes(searchQuery.toLowerCase())
		)
	}, [citations, searchQuery])

	const handleAddCitation = async () => {
		if (!newCitation.sourceTitle.trim() || !currentUser || !document) return

		const citationEntry: Citation = {
			id: `cit_${Date.now()}`,
			sourceTitle: newCitation.sourceTitle,
			author: newCitation.author,
			year: newCitation.year,
			addedBy: currentUser.name || 'User',
			createdAt: new Date().toISOString(),
		}

		const updatedCitations = [citationEntry, ...citations]

		try {
			await DocumentService.updateDocument(documentId, {
				savedContent: {
					...document.savedContent,
					citations: updatedCitations
				}
			})
			setCitations(updatedCitations)
			setNewCitation({ sourceTitle: '', author: '', year: new Date().getFullYear().toString() })
			setIsAddModalOpen(false)
		} catch (error) {
			console.error('Failed to save citation:', error)
		}
	}

	// NEW: Function to return to the editor and signal an insertion
	const handleInsertToEditor = (cit: Citation) => {
		const citationText = `(${cit.author}, ${cit.year})`
		// We use a query parameter to tell the editor page to insert this text
		// Your Editor component should check for 'insertCitation' on mount
		router.push(`/documents/${documentId}?insertCitation=${encodeURIComponent(citationText)}`)
	}

	const copyToClipboard = (cit: Citation) => {
		const text = `(${cit.author}, ${cit.year})`
		navigator.clipboard.writeText(text)
		setCopiedId(cit.id)
		setTimeout(() => setCopiedId(null), 2000)
	}

	if (isLoading) return (
		<div className="min-h-screen bg-gray-950 flex items-center justify-center">
			<Loader2 className="h-8 w-8 animate-spin text-blue-500" />
		</div>
	)

	return (
		<div className='min-h-screen bg-gray-950 text-gray-100'>
			<Navbar mode='document' documentId={documentId} />

			<main className='max-w-5xl mx-auto px-4 py-8'>
				<div className='flex justify-between items-end mb-8'>
					<div>
						<button onClick={() => router.back()} className='text-gray-400 hover:text-white mb-4 transition-colors'>
							← Back to Editor
						</button>
						<h1 className='text-3xl font-bold'>Citations - {document.title}</h1>
					</div>
					<Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
						<Plus className="w-4 h-4 mr-2" /> Add New Source
					</Button>
				</div>

				<SearchInput 
					value={searchQuery} 
					onChange={setSearchQuery} 
					placeholder='Search sources...' 
					className='mb-8'
				/>

				<div className='grid gap-4'>
					{filteredCitations.map((cit) => (
						<Card key={cit.id} className='bg-gray-900 border-gray-800 hover:border-blue-500/50 transition-colors'>
							<CardContent className='p-6 flex items-center gap-6'>
								<div className="hidden md:flex p-3 bg-blue-500/10 rounded-full">
									<Quote className="w-5 h-5 text-blue-400" />
								</div>
								
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-1">
										<h3 className="font-bold text-lg">{cit.sourceTitle}</h3>
										<Badge variant="secondary" className="bg-gray-800 text-gray-300">{cit.year}</Badge>
									</div>
									<p className="text-gray-400">By {cit.author}</p>
								</div>

								<div className="flex gap-2">
									<Button 
										variant="outline" 
										size="sm" 
										className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800"
										onClick={() => copyToClipboard(cit)}
									>
										{copiedId === cit.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
										<span className="ml-2 hidden lg:inline">Copy Cite</span>
									</Button>
									
									<Button 
										size="sm" 
										className="bg-blue-600 hover:bg-blue-700"
										onClick={() => handleInsertToEditor(cit)}
									>
										<FileInput className="w-4 h-4 mr-2" />
										Insert into Doc
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</main>

			{/* Modal remains largely same but ensures Author/Year are required for insertion */}
			<Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
				<DialogContent className="bg-gray-900 border-gray-800 text-white">
					<DialogHeader>
						<DialogTitle>Add Citation</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label>Title</Label>
							<Input className="bg-gray-950 border-gray-800" value={newCitation.sourceTitle} onChange={e => setNewCitation({...newCitation, sourceTitle: e.target.value})}/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Author (Last Name)</Label>
								<Input className="bg-gray-950 border-gray-800" value={newCitation.author} onChange={e => setNewCitation({...newCitation, author: e.target.value})}/>
							</div>
							<div className="space-y-2">
								<Label>Year</Label>
								<Input className="bg-gray-950 border-gray-800" value={newCitation.year} onChange={e => setNewCitation({...newCitation, year: e.target.value})}/>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button className="bg-blue-600" onClick={handleAddCitation}>Save Source</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}