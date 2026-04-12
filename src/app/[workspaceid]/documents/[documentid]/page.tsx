"use client"

import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState, useMemo } from "react"
import { toast } from "sonner"
import AIAssistant from "@/components/document/ai/AIAssistant"
import SidenavPanel from "@/components/document/SidenavPanel"
import DynamicContentPanel from "@/components/document/DynamicContentPanel"
// UI Components
import DocumentEditor from "@/components/document/editor/DocumentEditor"
import DocumentHeader from "@/components/document/editor/DocumentHeader"
import { Room } from "@/hooks/liveblocks/room"
import { useWorkspace } from "@/lib/api/hooks/use-workspaces"
import { useDocumentWithRoomState, useBatchUpdateDocument } from "@/lib/api/hooks/use-documents"
import "@/components/document/editor/EditorStyles.css"
import ModalVersions from "@/components/document/ModalVersions"
import { useAuth } from "@/context/AuthContext"
import { DocumentEditorSkeleton } from "@/components/document/editor/DocumentEditorSkeleton"
import { useIsMobile } from "@/hooks/use-mobile"
import { DesktopOnlyGuard } from "@/components/layout/DesktopOnlyGuard"
import type { Document } from "@/lib/api/types/document.types"
import type { BatchOperation, OperationType } from "@/lib/api/types/batchOperation.types"

export default function DocumentPage() {
  const router = useRouter()
  const params = useParams()
  const workspaceId = params.workspaceid as string
  const documentId = params.documentid as string
  
  const { user, loading: authLoading } = useAuth()
  const isMobile = useIsMobile()

  // State Management
  const [title, setTitle] = useState("")
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false)
  const [activePanel, setActivePanel] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0 })
  const [editorError, setEditorError] = useState<string | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [paperSize, setPaperSize] = useState("A4")
  const [paperSizeSubmenuOpen, setPaperSizeSubmenuOpen] = useState(false)
  const [modalVersionsOpen, setModalVersionsOpen] = useState(false)
  const [editorFunctions, setEditorFunctions] = useState<any>(null)
  const [isPdfHidden, setIsPdfHidden] = useState(false)
  
  const defaultFontFamily = '"Times New Roman", Times, serif'
  const defaultFontSize = "11pt"

  // TanStack Query Hooks
  const {
    data: workspace,
    isLoading: workspaceLoading,
    error: workspaceError
  } = useWorkspace(workspaceId)

  const {
    data: documentWithRoomData,
    isLoading: documentLoading,
    error: documentError,
    refetch: refetchDocument
  } = useDocumentWithRoomState(documentId)

  const batchUpdateMutation = useBatchUpdateDocument()

  // Derived Data
  const documentData = documentWithRoomData?.document || null
  const activeUsersInRoom = documentWithRoomData?.room?.activeUsers || 0

  // Sync title when document loads
  useEffect(() => {
    if (documentData?.title) {
        setTitle(documentData.title)
    }
  }, [documentData?.title])

  // Redirect Logic
  useEffect(() => {
    if (!workspaceLoading && !workspace) {
      toast.error("Access denied or workspace not found")
      router.push("/")
    }
    if (workspaceError || documentError) {
      console.error("Fetch error:", workspaceError || documentError)
      router.push("/")
    }
  }, [workspace, workspaceLoading, workspaceError, documentError, router])

  // Handle version restoration
  const handleVersionRestored = useCallback(async () => {
    console.log("Version restored, refreshing document...")
    const { data: newDocData } = await refetchDocument()
    const newDoc = newDocData?.document

    const view = editorFunctions?.getInternalView?.()

    if (newDoc && view) {
      console.log("Updating editor content with restored version...")
      const newContent = newDoc.savedContent

      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: newContent || "",
        },
      })
    }
  }, [refetchDocument, editorFunctions])

  // Global event handlers
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && aiAssistantOpen) {
        setAiAssistantOpen(false)
      }
    }

    const handleClick = (event: MouseEvent) => {
      if (contextMenu.show) {
        setContextMenu({ show: false, x: 0, y: 0 })
      }
      const target = event.target as HTMLElement
      if (
        activeDropdown &&
        !target.closest(".dropdown-menu") &&
        !target.closest(".dropdown-trigger")
      ) {
        setActiveDropdown(null)
      }
    }

    window.addEventListener("resize", handleResize)
    document.addEventListener("click", handleClick)

    return () => {
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("click", handleClick)
    }
  }, [aiAssistantOpen, contextMenu.show, activeDropdown])

  const handleSave = useCallback(async () => {
    if (!documentData || !user) return

    try {
      console.log("💾 Saving document with batch operation:", documentId)

      // Get current content from editor
      let currentContent = null
      if (editorFunctions?.getCurrentContent) {
        currentContent = editorFunctions.getCurrentContent()
      }

      const contentToSave = currentContent || documentData.savedContent

      // Build batch operations
      const batchOperations: BatchOperation[] = [
        {
          operationType: "save-content" as OperationType,
          payload: { content: contentToSave || "" },
        },
        {
          operationType: "update-metadata" as OperationType,
          payload: {
            title: title || "Untitled Document",
            defaultFont: defaultFontFamily,
            defaultFontSize: defaultFontSize,
            paperSize: paperSize,
          },
        },
        {
          operationType: "create-checkpoint" as OperationType,
          payload: {
            message: "Auto-save checkpoint",
            userId: user.userId,
          },
        },
      ]

      await batchUpdateMutation.mutateAsync({
        documentId,
        request: { operations: batchOperations },
      })

      setLastSavedAt(new Date())
      toast.success("Document saved")
      
    } catch (error) {
      console.error("❌ Error saving document:", error)
      toast.error("Failed to save document")
    }
  }, [
    documentData,
    user,
    documentId,
    editorFunctions,
    title,
    paperSize,
    batchUpdateMutation
  ])

  const onEditorReady = useCallback((functions: any) => {
    setEditorFunctions(functions)
  }, [])

  const onAutoSaveStateChange = useCallback((saving: boolean, savedAt: Date | null) => {
    setIsAutoSaving(saving)
    if (savedAt) setLastSavedAt(savedAt)
  }, [])

  const handlePanelIconClick = (panelId: string) => {
    setActivePanel(activePanel === panelId ? null : panelId)
  }

  const handleNavigateToSection = useCallback((heading: string, position: number) => {
    const view = editorFunctions?.getInternalView?.()
    if (!view) return
    view.dispatch({
      selection: { anchor: position },
      scrollIntoView: true,
    })
    view.focus()
  }, [editorFunctions])

  const handleInsertTextAtCursor = useCallback((text: string) => {
    const view = editorFunctions?.getInternalView?.()
    if (!view) return
    const { from } = view.state.selection.main
    view.dispatch({
      changes: { from, insert: text },
      selection: { anchor: from + text.length }
    })
    view.focus()
  }, [editorFunctions])

  const handleResizeStart = useCallback(() => setIsPdfHidden(true), [])
  const handleResizeEnd = useCallback(() => setIsPdfHidden(false), [])

  const toggleDropdown = (dropdownName: string) => {
    setActiveDropdown(dropdownName === activeDropdown ? null : dropdownName)
  }

  // Loading States
  if (workspaceLoading || documentLoading || authLoading) {
    return <DocumentEditorSkeleton />
  }

  if (editorError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Editor Error</h2>
          <p className="text-gray-600 mb-4">{editorError}</p>
          <button
            type="button"
            onClick={() => globalThis.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-svh overflow-hidden bg-white flex flex-col">
      {isMobile && <DesktopOnlyGuard workspaceId={workspaceId} />}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden isolate">
        <DocumentHeader
          title={title}
          setTitle={setTitle}
          aiAssistantOpen={aiAssistantOpen}
          toggleAiAssistant={() => setAiAssistantOpen(!aiAssistantOpen)}
          handleSave={handleSave}
          isSaving={batchUpdateMutation.isPending}
          isAutoSaving={isAutoSaving}
          lastSavedAt={lastSavedAt}
          activeDropdown={activeDropdown}
          toggleDropdown={toggleDropdown}
          paperSize={paperSize}
          setPaperSize={setPaperSize}
          paperSizeSubmenuOpen={paperSizeSubmenuOpen}
          setPaperSizeSubmenuOpen={setPaperSizeSubmenuOpen}
          toggleModalVersions={() => setModalVersionsOpen(!modalVersionsOpen)}
          user={user}
          workspaceId={workspaceId}
          workspace={workspace || undefined}
          documentId={documentId}
          onInsertSnippet={editorFunctions?.insertSnippet}
          getCurrentContent={editorFunctions?.getCurrentContent}
          insertTable={editorFunctions?.insertTable}
          undo={editorFunctions?.undo}
          redo={editorFunctions?.redo}
          canUndo={editorFunctions?.canUndo}
          canRedo={editorFunctions?.canRedo}
          handleCompile={editorFunctions?.handleCompile}
          isCompiling={editorFunctions?.isCompiling}
          visibleCollaborators={editorFunctions?.visibleCollaborators}
          hiddenCollaboratorsCount={editorFunctions?.hiddenCollaboratorsCount}
          viewMode={editorFunctions?.viewMode}
          toggleViewMode={editorFunctions?.toggleViewMode}
          visualEditor={editorFunctions?.visualEditor}
          compilerMode={editorFunctions?.compilerMode}
          onCompilerModeChange={editorFunctions?.setCompilerMode}
          debugContentExtraction={editorFunctions?.debugContentExtraction}
        />

        <Room documentId={documentId} fallback={<DocumentEditorSkeleton />}>
          <div className="flex flex-1 overflow-hidden">
            <SidenavPanel activePanel={activePanel} onPanelClick={handlePanelIconClick} />

            <DynamicContentPanel
              activePanel={activePanel}
              onClose={() => setActivePanel(null)}
              onWidthChange={() => {}}
              onResizeStart={handleResizeStart}
              onResizeEnd={handleResizeEnd}
              currentContent={documentData?.savedContent}
              onNavigateToSection={handleNavigateToSection}
              documentId={documentId}
              onInsertText={handleInsertTextAtCursor}
              getCurrentContent={editorFunctions?.getCurrentContent}
            />

            <DocumentEditor
              document={documentData}
              title={title}
              user={user}
              onEditorReady={onEditorReady}
              shouldInitializeFromFirestore={activeUsersInRoom === 0}
              isPdfHidden={isPdfHidden}
            />

            <AIAssistant
              editor={editorFunctions}
              aiAssistantOpen={aiAssistantOpen}
              toggleAiAssistant={() => setAiAssistantOpen(!aiAssistantOpen)}
              documentId={documentId}
              onResizeStart={handleResizeStart}
              onResizeEnd={handleResizeEnd}
            />

            <ModalVersions
              isOpen={modalVersionsOpen}
              onClose={() => setModalVersionsOpen(false)}
              documentId={documentId}
              onVersionRestored={handleVersionRestored}
            />
          </div>
        </Room>
      </div>
    </div>
  )
}


