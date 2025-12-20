"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useDocuments } from "@/hooks/useDocuments";
import { documentsService } from "@/lib/api/services/documents.service";
import { Navbar } from "@/components/layout/navbar";
import { SearchInput } from "@/components/ui/search-input";
import { StatusBadge } from "@/components/ui/badge";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { WorkspaceSettingsModal } from "@/components/workspace/WorkspaceSettingsModal";
import { RadioGroup } from "@/components/ui/radio-group";
import { OptionCard } from "@/components/ui/option-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const workspaceId = params.workspaceid as string;
  const { workspace, loading: workspaceLoading, refetch: refetchWorkspace } = useWorkspace(workspaceId);
  const { documents, loading: documentsLoading, refetch: refetchDocuments } = useDocuments(workspaceId);

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newDoc, setNewDoc] = useState({
    title: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredDocuments = useMemo(() => {
    if (!searchQuery) return documents;
    
    const query = searchQuery.toLowerCase();
    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(query) ||
        (doc.description && doc.description.toLowerCase().includes(query))
    );
  }, [documents, searchQuery]);

  
  const handleCreateDocument = async () => {
    const errors: Record<string, string> = {};

    if (!newDoc.title.trim()) {
      errors.title = "Title is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (!workspaceId) return;

    setIsCreating(true);
    try {
      // Backend doesn't accept description field, only title
      await documentsService.create(workspaceId, {
        title: newDoc.title.trim(),
      });

      setNewDoc({ title: "", description: "" });
      setFormErrors({});
      setShowCreateModal(false);
      await refetchDocuments();
    } catch (err) {
      console.error("Error creating document:", err);
      setFormErrors({ submit: err instanceof Error ? err.message : "Failed to create document" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!workspaceId) return;

    setIsDeleting(true);
    try {
      await documentsService.delete(workspaceId, docId);
      setDeleteConfirm(null);
      await refetchDocuments();
    } catch (err) {
      console.error("Error deleting document:", err);
      alert(err instanceof Error ? err.message : "Failed to delete document");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenDocument = (docId: string) => {
    router.push(`/${workspaceId}/documents/${docId}`);
  };

  if (!user) {
    return null;
  }

  if (workspaceLoading || documentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Workspace not found</p>
          <Button onClick={() => router.push("/")}>Go to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar mode="workspace" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{workspace.icon || '📚'}</span>
              <h1 className="text-3xl font-bold text-gray-900">
                {workspace.title}
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowSettingsModal(true)}
            >
              ⚙️ Settings
            </Button>
          </div>
          {workspace.description && (
            <p className="text-gray-600">{workspace.description}</p>
          )}
        </div>

        {/* Section Title */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Dokumen Terbaru</h2>
        </div>

        {/* Search and Create */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Cari dokumen..."
            />
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Dokumen Baru
          </Button>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-600 text-lg mb-2">
              {searchQuery ? "No documents found" : "No documents yet"}
            </p>
            <p className="text-gray-500 text-sm">
              {searchQuery
                ? "Try a different search term"
                : "Create your first document to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.documentId}
                className="bg-white border rounded-lg p-6 hover:border-teal-600 hover:shadow-lg transition-all group cursor-pointer"
                onClick={() => handleOpenDocument(doc.documentId)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-2 flex-1">
                    {doc.title}
                  </h3>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {doc.description || "No description"}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>{new Date(doc.updatedAt).toLocaleDateString('id-ID')}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDocument(doc.documentId);
                    }}
                    className="flex-1"
                  >
                    Buka
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(doc.documentId);
                    }}
                    className=" bg-gray-100 hover:bg-red-600 text-gray-600 hover:text-white"
                    aria-label="Delete document"
                    disabled={isDeleting}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Document Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewDoc({ title: "", description: "" });
          setFormErrors({});
        }}
        title="Create New Document"
        size="lg"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              type="text"
              value={newDoc.title}
              onChange={(e) => {
                setNewDoc({ ...newDoc, title: e.target.value });
                setFormErrors({ ...formErrors, title: "" });
              }}
              placeholder="Document title"
              className={formErrors.title ? "border-red-500" : ""}
              disabled={isCreating}
            />
            {formErrors.title && (
              <p className="mt-1 text-sm text-red-400">{formErrors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newDoc.description}
              onChange={(e) => {
                setNewDoc({ ...newDoc, description: e.target.value });
                setFormErrors({ ...formErrors, description: "" });
              }}
              placeholder="Brief description of your document"
              rows={3}
              className={`resize-none ${formErrors.description ? "border-red-500" : ""}`}
              disabled={isCreating}
            />
            {formErrors.description && (
              <p className="mt-1 text-sm text-red-400">{formErrors.description}</p>
            )}
          </div>

          {formErrors.submit && (
            <p className="text-sm text-red-400">{formErrors.submit}</p>
          )}
        </div>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowCreateModal(false);
              setNewDoc({ title: "", description: "" });
              setFormErrors({});
            }}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreateDocument} disabled={isCreating}>
            {isCreating ? "Creating..." : "Create Document"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDeleteDocument(deleteConfirm)}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      {/* Workspace Settings Modal */}
      {workspace && (
        <WorkspaceSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          workspace={workspace}
          onSuccess={async () => {
            // Refetch workspace data after update
            await refetchWorkspace();
          }}
        />
      )}
    </div>
  );
}