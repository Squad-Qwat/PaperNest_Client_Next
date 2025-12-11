"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useDocuments } from "@/lib/store";
import { Navbar } from "@/components/navbar";
import { SearchInput } from "@/components/ui/search-input";
import { StatusBadge } from "@/components/ui/badge";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DocumentStatus } from "@/types";

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { getDocuments, createDocument, deleteDocument } = useDocuments();

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  
  const [newDoc, setNewDoc] = useState({
    title: "",
    description: "",
    status: "personal" as DocumentStatus,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  
  const documents = currentUser ? getDocuments(currentUser.id) : [];

  
  const filteredDocuments = useMemo(() => {
    if (!searchQuery) return documents;
    
    const query = searchQuery.toLowerCase();
    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(query) ||
        doc.description.toLowerCase().includes(query)
    );
  }, [documents, searchQuery]);

  
  const handleCreateDocument = () => {
    const errors: Record<string, string> = {};

    if (!newDoc.title.trim()) {
      errors.title = "Title is required";
    }
    if (!newDoc.description.trim()) {
      errors.description = "Description is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (currentUser) {
      createDocument(currentUser.id, {
        title: newDoc.title.trim(),
        description: newDoc.description.trim(),
        status: newDoc.status,
        lastUpdated: "baru saja",
      });

      
      setNewDoc({ title: "", description: "", status: "personal" });
      setFormErrors({});
      setShowCreateModal(false);
    }
  };

  
  const handleDeleteDocument = (docId: number) => {
    if (currentUser) {
      deleteDocument(currentUser.id, docId);
      setDeleteConfirm(null);
    }
  };

  
  const handleOpenDocument = (docId: number) => {
    router.push(`/${params.workspaceid}/documents/${docId}`);
  };

  if (!currentUser) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar mode="workspace" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{currentUser.workspace.icon}</span>
            <h1 className="text-3xl font-bold text-gray-900">
              {currentUser.workspace.name}
            </h1>
          </div>
          <p className="text-gray-600">{currentUser.workspace.description}</p>
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
                key={doc.id}
                className="bg-white border rounded-lg p-6 hover:border-teal-600 hover:shadow-lg transition-all group cursor-pointer"
                onClick={() => handleOpenDocument(doc.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-2 flex-1">
                    {doc.title}
                  </h3>
                  <StatusBadge status={doc.status} />
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {doc.description}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>{doc.lastUpdated}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDocument(doc.id);
                    }}
                    className="flex-1"
                  >
                    Buka
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(doc.id);
                    }}
                    className=" bg-gray-100 hover:bg-red-600 text-gray-600 hover:text-white"
                    aria-label="Delete document"
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
          setNewDoc({ title: "", description: "", status: "personal" });
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
            />
            {formErrors.description && (
              <p className="mt-1 text-sm text-red-400">{formErrors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNewDoc({ ...newDoc, status: "personal" })}
                className={`px-4 py-2.5 border rounded-lg font-medium transition-all ${
                  newDoc.status === "personal"
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-700"
                }`}
              >
                Personal
              </button>
              <button
                type="button"
                onClick={() => setNewDoc({ ...newDoc, status: "shared" })}
                className={`px-4 py-2.5 border rounded-lg font-medium transition-all ${
                  newDoc.status === "shared"
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-700"
                }`}
              >
                Shared
              </button>
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowCreateModal(false);
              setNewDoc({ title: "", description: "", status: "personal" });
              setFormErrors({});
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleCreateDocument}>Create Document</Button>
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
    </div>
  );
}