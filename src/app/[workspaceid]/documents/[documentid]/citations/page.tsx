"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useDocuments } from "@/lib/store";
import { Navbar } from "@/components/navbar";
import { SearchInput } from "@/components/ui/search-input";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CitationsPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { getDocument, addCitation, deleteCitation } = useDocuments();

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state for new citation
  const [newCitation, setNewCitation] = useState({
    title: "",
    authors: "",
    publicationYear: new Date().getFullYear(),
    publisher: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const documentId = parseInt(params.documentid as string);
  const document = currentUser ? getDocument(currentUser.id, documentId) : undefined;

  // Get all citations
  const citations = document?.citations || [];

  // Filter citations based on search query
  const filteredCitations = useMemo(() => {
    if (!searchQuery) return citations;

    const query = searchQuery.toLowerCase();
    return citations.filter(
      (citation) =>
        citation.title.toLowerCase().includes(query) ||
        citation.authors.toLowerCase().includes(query) ||
        citation.publisher.toLowerCase().includes(query)
    );
  }, [citations, searchQuery]);

  // Format citation in APA style
  const formatAPACitation = (citation: typeof citations[0]) => {
    return `${citation.authors} (${citation.publicationYear}). ${citation.title}. ${citation.publisher}.`;
  };

  // Handle copy citation to clipboard
  const handleCopyCitation = (citation: typeof citations[0]) => {
    const formatted = formatAPACitation(citation);
    navigator.clipboard.writeText(formatted);
    alert("Citation copied to clipboard!");
  };

  // Handle create citation
  const handleCreateCitation = () => {
    const errors: Record<string, string> = {};

    if (!newCitation.title.trim()) {
      errors.title = "Title is required";
    }
    if (!newCitation.authors.trim()) {
      errors.authors = "Authors are required";
    }
    if (!newCitation.publisher.trim()) {
      errors.publisher = "Publisher is required";
    }
    if (newCitation.publicationYear < 1900 || newCitation.publicationYear > new Date().getFullYear() + 1) {
      errors.publicationYear = "Please enter a valid year";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (currentUser && document) {
      addCitation(currentUser.id, documentId, {
        title: newCitation.title.trim(),
        authors: newCitation.authors.trim(),
        publicationYear: newCitation.publicationYear,
        publisher: newCitation.publisher.trim(),
      });

      // Reset form
      setNewCitation({
        title: "",
        authors: "",
        publicationYear: new Date().getFullYear(),
        publisher: "",
      });
      setFormErrors({});
      setShowCreateModal(false);
    }
  };

  // Handle delete citation
  const handleDeleteCitation = (citationId: string) => {
    if (currentUser) {
      deleteCitation(currentUser.id, documentId, citationId);
      setDeleteConfirm(null);
    }
  };

  if (!currentUser) {
    router.push("/login");
    return null;
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar mode="document" documentId={params.documentid as string} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">Document not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar mode="document" documentId={params.documentid as string} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/${params.workspaceid}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-4 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold text-gray-100 mb-2">
            Citations - {document.title}
          </h1>
          <p className="text-gray-400">{document.description}</p>
        </div>

        {/* Search and Create */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search citations by title, authors, or publisher..."
            />
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
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
            Add Citation
          </Button>
        </div>

        {/* Citations List */}
        {filteredCitations.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="w-16 h-16 mx-auto text-gray-700 mb-4"
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
            <p className="text-gray-500 text-lg mb-2">
              {searchQuery ? "No citations found" : "No citations yet"}
            </p>
            <p className="text-gray-600 text-sm">
              {searchQuery
                ? "Try a different search term"
                : "Add your first citation to get started"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCitations.map((citation) => (
              <div
                key={citation.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-100 mb-2">
                      {citation.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-1">
                      <span className="font-medium">Authors:</span> {citation.authors}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>
                        <span className="font-medium">Year:</span> {citation.publicationYear}
                      </span>
                      <span>
                        <span className="font-medium">Publisher:</span> {citation.publisher}
                      </span>
                    </div>
                  </div>
                </div>

                {/* APA Citation */}
                <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 mb-3">
                  <p className="text-sm text-gray-300 font-mono">
                    {formatAPACitation(citation)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopyCitation(citation)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
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
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy Citation
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(citation.id)}
                    className="px-4 py-2 bg-gray-800 hover:bg-red-600 text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Citation Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewCitation({
            title: "",
            authors: "",
            publicationYear: new Date().getFullYear(),
            publisher: "",
          });
          setFormErrors({});
        }}
        title="Add New Citation"
        size="lg"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              type="text"
              value={newCitation.title}
              onChange={(e) => {
                setNewCitation({ ...newCitation, title: e.target.value });
                setFormErrors({ ...formErrors, title: "" });
              }}
              placeholder="Citation title"
              className={formErrors.title ? "border-red-500" : ""}
            />
            {formErrors.title && (
              <p className="mt-1 text-sm text-red-400">{formErrors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="authors">Authors</Label>
            <Input
              id="authors"
              type="text"
              value={newCitation.authors}
              onChange={(e) => {
                setNewCitation({ ...newCitation, authors: e.target.value });
                setFormErrors({ ...formErrors, authors: "" });
              }}
              placeholder="e.g., Smith, J., & Johnson, M."
              className={formErrors.authors ? "border-red-500" : ""}
            />
            {formErrors.authors && (
              <p className="mt-1 text-sm text-red-400">{formErrors.authors}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="publicationYear">Publication Year</Label>
              <Input
                id="publicationYear"
                type="number"
                value={newCitation.publicationYear}
                onChange={(e) => {
                  setNewCitation({
                    ...newCitation,
                    publicationYear: parseInt(e.target.value) || new Date().getFullYear(),
                  });
                  setFormErrors({ ...formErrors, publicationYear: "" });
                }}
                placeholder="2024"
                className={formErrors.publicationYear ? "border-red-500" : ""}
              />
              {formErrors.publicationYear && (
                <p className="mt-1 text-sm text-red-400">{formErrors.publicationYear}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="publisher">Publisher</Label>
              <Input
                id="publisher"
                type="text"
                value={newCitation.publisher}
                onChange={(e) => {
                  setNewCitation({ ...newCitation, publisher: e.target.value });
                  setFormErrors({ ...formErrors, publisher: "" });
                }}
                placeholder="Publisher name"
                className={formErrors.publisher ? "border-red-500" : ""}
              />
              {formErrors.publisher && (
                <p className="mt-1 text-sm text-red-400">{formErrors.publisher}</p>
              )}
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowCreateModal(false);
              setNewCitation({
                title: "",
                authors: "",
                publicationYear: new Date().getFullYear(),
                publisher: "",
              });
              setFormErrors({});
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleCreateCitation}>Add Citation</Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDeleteCitation(deleteConfirm)}
        title="Delete Citation"
        message="Are you sure you want to delete this citation? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
