"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { EditorContent } from "@tiptap/react";
import { useDocumentEditor } from "@/hooks/editor/use-document-editor";

// UI Components
import DocumentHeader from "@/components/document/DocumentHeader";
import EditorToolbar from "@/components/document/EditorToolbar";
import AIAssistant from "@/components/document/AIAssistant";
import "@/components/document/EditorStyles.css";
import ContextMenu from "@/components/editor/context-menu";

// Komponen Editor yang ada di dalam Room
export default function DocumentEditor({
  document,
  title,
  setTitle,
  paperSize,
  defaultFontFamily,
  defaultFontSize,
  setEditorError,
  contextMenu,
  setContextMenu,
  handleSave,
  isSaving,
  user,
  aiAssistantOpen,
  // Expose editor functions
  onEditorReady,
}) {
  // Menggunakan custom hook untuk editor dengan Yjs collaboration
  const { 
    editor, 
    insertTable,
    // Content management
    getCurrentContent,
    getCurrentHTML,
    saveCurrentContent,
    // Debug functions
    debugContentExtraction,
    // Undo/Redo operations
    undo,
    redo,
    canUndo,
    canRedo,
    // Collaboration features
    yProvider,
    yDoc,
    undoManager,
    awareness,
    isConnected,
    collaborationReady,
    getAwarenessStates,
    setLocalAwarenessState,
    setAwarenessField
  } = useDocumentEditor({
    paperSize,
    defaultFontFamily,
    defaultFontSize,
    document,
    title,
    user,
    setEditorError,
    enableLiveblocks: true, // Karena DocumentEditor ada di dalam Room
    enableAutoSave: true,
  });

  // Debug collaboration status
  useEffect(() => {
    if (collaborationReady) {
      console.log('🤝 Collaboration ready:', {
        isConnected,
        awarenessStates: getAwarenessStates().size,
        yDocExists: !!yDoc
      })
    }
  }, [collaborationReady, isConnected, getAwarenessStates, yDoc])

  // Expose editor functions to parent component
  useEffect(() => {
    if (editor && onEditorReady && getCurrentContent && getCurrentHTML && saveCurrentContent) {
      onEditorReady({
        getCurrentContent,
        getCurrentHTML,
        saveCurrentContent,
        editor
      })
    }
  }, [editor, onEditorReady, getCurrentContent, getCurrentHTML, saveCurrentContent])

  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0 });
  };

  return (
    <>
      <EditorToolbar
        editor={editor}
        insertTable={insertTable}
        aiAssistantOpen={aiAssistantOpen}
        // Pass undo/redo functions untuk collaboration-aware operations
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        // Debug function (only in development)
        debugContentExtraction={debugContentExtraction}
      />
      {/* Document Content */}
      <div
        className={`flex-1 overflow-auto bg-gray-50 transition-all duration-300 ${
          aiAssistantOpen ? "pr-80" : "pr-0"
        } w-full`}
      >
        <div className="pt-6">
          <div className="max-w-[850px] mx-auto my-12 bg-transparent shadow-sm rounded-lg min-h-[1100px]">
            <div className="">
              <EditorContent
                editor={editor}
                className="prose max-w-none focus:outline-none min-h-[800px]"
              />
            </div>
          </div>
        </div>
      </div>
      {contextMenu.show && (
        <ContextMenu
          editor={editor}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={closeContextMenu}
        />
      )}
    </>
  );
}
