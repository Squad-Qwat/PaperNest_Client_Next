// Base types for the application

export type UserRole = 'Student' | 'Lecturer'

export type DocumentStatus = 'personal' | 'shared'

export type ReviewStatus = 'approved' | 'pending' | 'rejected'

export interface Workspace {
	icon: string
	name: string
	description: string
}

export interface Citation {
	id: string
	docId: number
	docTitle: string
	title: string
	authors: string
	publicationYear: number
	publisher: string
}

export interface Review {
	id: string
	docId: number
	docTitle: string
	title: string
	reviewer: string
	comment: string
	date: string
	status: ReviewStatus
}

export interface Document {
	id: number
	title: string
	description: string
	status: DocumentStatus
	lastUpdated: string
	citations: Citation[]
	reviews: Review[]
}

export interface User {
	id: number
	email: string
	password: string
	firstName: string
	lastName: string
	username: string
	role: UserRole
	workspace: Workspace
	documents: Document[]
	lastLogin?: string
}

export interface Review {
	id: string
}

export interface AuthContextType {
	currentUser: User | null
	users: User[]
	login: (email: string, password: string) => Promise<boolean>
	logout: () => void
	register: (userData: Omit<User, 'id' | 'documents'>) => Promise<User>
	switchUser: (userId: number) => void
	updateUser: (userId: number, updates: Partial<User>) => void
}

export interface DocumentContextType {
	getDocuments: (userId: number) => Document[]
	getDocument: (userId: number, docId: number) => Document | undefined
	createDocument: (
		userId: number,
		document: Omit<Document, 'id' | 'citations' | 'reviews'>
	) => Document
	updateDocument: (userId: number, docId: number, updates: Partial<Document>) => void
	deleteDocument: (userId: number, docId: number) => void
	addCitation: (
		userId: number,
		docId: number,
		citation: Omit<Citation, 'id' | 'docId' | 'docTitle'>
	) => void
	deleteCitation: (userId: number, docId: number, citationId: string) => void
	addReview: (
		userId: number,
		docId: number,
		review: Omit<Review, 'id' | 'docId' | 'docTitle'>
	) => void
	deleteReview: (userId: number, docId: number, reviewId: string) => void
}
