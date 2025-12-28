import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  addDoc,
  QueryConstraint
} from 'firebase/firestore'
import { firestore } from '@/lib/firebase/config'
import { Document } from '@/lib/api/types/document.types'

// Types untuk Document operations
export interface CreateDocumentData {
  workspaceId: string
  title: string
  savedContent?: any // Tiptap JSON content
  currentVersionId?: string
  createdBy: string
}

export interface UpdateDocumentData {
  title?: string;
  description?: string;
  savedContent?: any;
  currentVersionId?: string;
}

export interface FirestoreDocumentData {
  documentId: string
  workspaceId: string
  title: string
  description?: string
  savedContent: any
  currentVersionId: string
  createdBy: string
  createdAt: any
  updatedAt: any
}

export interface DocumentFilters {
  workspaceId?: string
  createdBy?: string
  searchQuery?: string
  limitCount?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export class DocumentService {
  private static readonly COLLECTION_NAME = 'documents'

  /**
   * Create new document
   */
  static async createDocument(data: CreateDocumentData): Promise<Document> {
    try {
      console.log('📝 Creating new document:', data.title)
      
      const docRef = collection(firestore, this.COLLECTION_NAME)
      
      const firestoreData: Omit<FirestoreDocumentData, 'documentId'> = {
        workspaceId: data.workspaceId,
        title: data.title,
        savedContent: data.savedContent || null,
        currentVersionId: data.currentVersionId || 'v1',
        createdBy: data.createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      
      console.log('💾 Writing document to Firestore...')
      const docSnapshot = await addDoc(docRef, firestoreData)
      
      console.log(`✅ Document created with ID: ${docSnapshot.id}`)
      
      // Return the created document
      return {
        documentId: docSnapshot.id,
        workspaceId: data.workspaceId,
        title: data.title,
        savedContent: data.savedContent || null,
        currentVersionId: data.currentVersionId || 'v1',
        createdBy: data.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    } catch (error) {
      console.error('❌ Error creating document:', error)
      throw new Error('Failed to create document')
    }
  }

  /**
   * Get document by ID
   */
  static async getDocumentById(docId: string): Promise<Document | null> {
    try {
      console.log('📖 Fetching document:', docId)
      
      const docRef = doc(firestore, this.COLLECTION_NAME, docId)
      const docSnapshot = await getDoc(docRef)
      
      if (!docSnapshot.exists()) {
        console.log('📄 Document not found')
        return null
      }
      
      const data = docSnapshot.data() as Omit<FirestoreDocumentData, 'documentId'>
      
      console.log('✅ Document fetched successfully')
      return this.mapFirestoreToDocument({ ...data, documentId: docSnapshot.id })
    } catch (error) {
      console.error('❌ Error fetching document:', error)
      throw new Error('Failed to fetch document')
    }
  }

  /**
   * Update document
   */
  static async updateDocument(docId: string, data: UpdateDocumentData): Promise<void> {
    try {
      console.log('🔄 Updating document:', docId)
      
      const docRef = doc(firestore, this.COLLECTION_NAME, docId)
      
      // Check if document exists
      const docSnapshot = await getDoc(docRef)
      if (!docSnapshot.exists()) {
        throw new Error('Document not found')
      }
      
      const updateData: Partial<FirestoreDocumentData> = {
        ...data,
        updatedAt: serverTimestamp(),
      }
      
      await updateDoc(docRef, updateData)
      console.log('✅ Document updated successfully')
    } catch (error) {
      console.error('❌ Error updating document:', error)
      throw new Error('Failed to update document')
    }
  }

  /**
   * Delete document
   */
  static async deleteDocument(docId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting document:', docId)
      
      const docRef = doc(firestore, this.COLLECTION_NAME, docId)
      await deleteDoc(docRef)
      
      console.log('✅ Document deleted successfully')
    } catch (error) {
      console.error('❌ Error deleting document:', error)
      throw new Error('Failed to delete document')
    }
  }

  /**
   * Get documents with filters
   */
  static async getDocuments(filters: DocumentFilters = {}): Promise<Document[]> {
    try {
      console.log('📚 Fetching documents with filters:', filters)
      
      const constraints: QueryConstraint[] = []
      
      // Add filters
      if (filters.workspaceId) {
        constraints.push(where('workspaceId', '==', filters.workspaceId))
      }
      
      if (filters.createdBy) {
        constraints.push(where('createdBy', '==', filters.createdBy))
      }
      
      // Add sorting
      const sortField = filters.sortBy || 'updatedAt'
      const sortDirection = filters.sortOrder || 'desc'
      constraints.push(orderBy(sortField, sortDirection))
      
      // Add limit
      if (filters.limitCount) {
        constraints.push(limit(filters.limitCount))
      }
      
      const q = query(collection(firestore, this.COLLECTION_NAME), ...constraints)
      const querySnapshot = await getDocs(q)
      
      const documents = querySnapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data() as Omit<FirestoreDocumentData, 'documentId'>
        return this.mapFirestoreToDocument({ ...data, documentId: docSnapshot.id })
      })
      
      // Client-side search filtering if search query is provided
      let filteredDocuments = documents
      if (filters.searchQuery) {
        const searchTerm = filters.searchQuery.toLowerCase()
        filteredDocuments = documents.filter(doc => 
          doc.title.toLowerCase().includes(searchTerm)
        )
      }
      
      console.log(`✅ Fetched ${filteredDocuments.length} documents`)
      return filteredDocuments
    } catch (error) {
      console.error('❌ Error fetching documents:', error)
      throw new Error('Failed to fetch documents')
    }
  }

  /**
   * Get user's documents (convenience method)
   */
  static async getUserDocuments(
    userId: string, 
    limitCount: number = 50
  ): Promise<Document[]> {
    return this.getDocuments({
      createdBy: userId,
      limitCount,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    })
  }

  /**
   * Get workspace documents (convenience method)
   */
  static async getWorkspaceDocuments(
    workspaceId: string,
    limitCount: number = 50
  ): Promise<Document[]> {
    return this.getDocuments({
      workspaceId: workspaceId,
      limitCount,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    })
  }

  /**
   * Search documents by title
   */
  static async searchDocuments(
    searchQuery: string, 
    workspaceId?: string,
    userId?: string, 
    limitCount: number = 20
  ): Promise<Document[]> {
    const filters: DocumentFilters = {
      searchQuery,
      limitCount,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    }
    
    if (workspaceId) {
      filters.workspaceId = workspaceId
    }
    
    if (userId) {
      filters.createdBy = userId
    }
    
    return this.getDocuments(filters)
  }

  /**
   * Check if user can access document in workspace
   */
  static async canUserAccessDocument(docId: string, userId: string, workspaceId: string): Promise<boolean> {
    try {
      const document = await this.getDocumentById(docId)
      
      if (!document) {
        return false
      }
      
      // User can access if document belongs to their workspace and they created it
      return document.workspaceId === workspaceId && document.createdBy === userId
    } catch (error) {
      console.error('❌ Error checking document access:', error)
      return false
    }
  }

  /**
   * Map Firestore document to Document type
   */
  private static mapFirestoreToDocument(data: FirestoreDocumentData): Document {
    return {
      documentId: data.documentId,
      workspaceId: data.workspaceId,
      title: data.title,
      savedContent: data.savedContent,
      currentVersionId: data.currentVersionId,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    }
  }
}
