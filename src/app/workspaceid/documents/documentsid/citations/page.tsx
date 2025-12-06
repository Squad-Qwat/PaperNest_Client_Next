"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useDocuments } from "@/lib/store";
import { Navbar } from "@/components/layout/navbar";
import { SearchInput } from "@/components/ui/search-input";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Note: Assuming you have a Select component from shadcn, if not, use a standard <select>
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectGroup,
  SelectLabel
} from "@/components/ui/select";

export default function CitationsPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { getDocument, addCitation, deleteCitation } = useDocuments();

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // --- NEW LOGIC: Multi-stage Form State ---
  const [citationType, setCitationType] = useState<string>("None");
  
  const [newCitation, setNewCitation] = useState({
    title: "",
    authors: "",
    publicationYear: new Date().getFullYear(),
    publisher: "",
    // Additional fields from citation.js
    informasi: "",
    namaSitus: "",
    url: "",
    halaman: "",
    volume: "",
    nomor: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const documentId = parseInt(params.documentid as string);
  const document = currentUser ? getDocument(currentUser.id, documentId) : undefined;
  const citations = document?.citations || [];

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

  const formatAPACitation = (citation: typeof citations[0]) => {
    return `${citation.authors} (${citation.publicationYear}). ${citation.title}. ${citation.publisher}.`;
  };

  const handleCopyCitation = (citation: typeof citations[0]) => {
    const formatted = formatAPACitation(citation);
    navigator.clipboard.writeText(formatted);
    alert("Citation copied to clipboard!");
  };

  // --- UPDATED LOGIC: Handle Reset and Close ---
  const resetForm = () => {
    setCitationType("None");
    setNewCitation({
      title: "",
      authors: "",
      publicationYear: new Date().getFullYear(),
      publisher: "",
      informasi: "",
      namaSitus: "",
      url: "",
      halaman: "",
      volume: "",
      nomor: ""
    });
    setFormErrors({});
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    resetForm();
  };

  // --- NEW LOGIC: Integrated handleCancelButton from citation.js ---
  const handleCancelAction = () => {
    if (citationType === "None") 
    {
      // Stage 1: Close modal
      handleModalClose();
      return;
    } 
    // Stage 2 to Stage 1: Reset type but keep modal open
    setCitationType("None");
  };

  const handleCreateCitation = () => {
    const errors: Record<string, string> = {};

    if (!newCitation.title.trim()) errors.title = "Title is required";
    if (!newCitation.authors.trim()) errors.authors = "Authors are required";
    
    // Logic from citation.js: Determine publisher based on type
    let finalPublisher = "";
    if (["Buku", "Tesis", "Makalah"].includes(citationType)) {finalPublisher = newCitation.publisher;} 
    else if (citationType === "Jurnal") {finalPublisher = newCitation.informasi;} 
    else if (citationType === "Web") {finalPublisher = newCitation.namaSitus;}

    if (!finalPublisher?.trim()) errors.publisher = "Publisher/Source information is required";

    if (Object.keys(errors).length > 0) 
    {
      setFormErrors(errors);
      return;
    }

    if (currentUser && document) 
    {
      addCitation(currentUser.id, documentId, 
      {
        title: newCitation.title.trim(),
        authors: newCitation.authors.trim(),
        publicationYear: newCitation.publicationYear,
        publisher: finalPublisher.trim(),
      });
      handleModalClose();
    }
  };

  const handleDeleteCitation = (citationId: string) => 
  {
    if (currentUser) 
    {
      deleteCitation(currentUser.id, documentId, citationId);
      setDeleteConfirm(null);
    }
  };

  if (!currentUser) 
  {
    router.push("/login");
    return null;
  }

  if (!document) {return <div className="min-h-screen bg-gray-950 text-white p-8">Document not found</div>;}

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar mode="document" documentId={params.documentid as string} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header and Search ... (same as original) */}
        <div className="mb-8">
          <button onClick={() => router.push(`/${params.workspaceid}`)} className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Citations - {document.title}</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search citations..." />
          </div>
          <Button onClick={() => setShowCreateModal(true)}>Add Citation</Button>
        </div>

        {/* Citations List ... (same as original) */}
        <div className="space-y-4">
           {filteredCitations.map((citation) => (
              <div key={citation.id} className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-all">
                <h3 className="text-lg font-semibold text-gray-100 mb-2">{citation.title}</h3>
                <p className="text-gray-400 text-sm mb-3">{citation.authors} ({citation.publicationYear})</p>
                <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 mb-3">
                  <p className="text-sm text-gray-300 font-mono">{formatAPACitation(citation)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleCopyCitation(citation)}>Copy</Button>
                  <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(citation.id)}>Delete</Button>
                </div>
              </div>
           ))}
        </div>
      </main>

      {/* --- REFACTORED: Create Citation Modal with Stage Logic --- */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        title="Add New Citation"
        size="lg"
      >
        <div className="space-y-4">
          {/* Stage 1: Select Type */}
          <div className="space-y-2">
            <Label>Citation Type</Label>
            <Select value={citationType} onValueChange={setCitationType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">Select a type...</SelectItem>
                <SelectGroup>
                  <SelectLabel>General</SelectLabel>
                  <SelectItem value="Buku">Buku</SelectItem>
                  <SelectItem value="Web">Web</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Scientific</SelectLabel>
                  <SelectItem value="Jurnal">Jurnal</SelectItem>
                  <SelectItem value="Tesis">Tesis</SelectItem>
                  <SelectItem value="Makalah">Makalah</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Stage 2: Specific Fields (Only show if type is not 'None') */}
          {citationType !== "None" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newCitation.title}
                  onChange={(e) => setNewCitation({ ...newCitation, title: e.target.value })}
                  className={formErrors.title ? "border-red-500" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="authors">Authors</Label>
                <Input
                  id="authors"
                  value={newCitation.authors}
                  onChange={(e) => setNewCitation({ ...newCitation, authors: e.target.value })}
                  placeholder="e.g., Smith, J."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={newCitation.publicationYear}
                    onChange={(e) => setNewCitation({ ...newCitation, publicationYear: parseInt(e.target.value) })}
                  />
                </div>

                {/* Dynamic Publisher Field based on JS logic */}
                {["Buku", "Tesis", "Makalah"].includes(citationType) && (
                  <div className="space-y-2">
                    <Label>Publisher</Label>
                    <Input
                      value={newCitation.publisher}
                      onChange={(e) => setNewCitation({ ...newCitation, publisher: e.target.value })}
                    />
                  </div>
                )}

                {citationType === "Jurnal" && (
                  <div className="space-y-2">
                    <Label>Journal Name</Label>
                    <Input
                      value={newCitation.informasi}
                      onChange={(e) => setNewCitation({ ...newCitation, informasi: e.target.value })}
                    />
                  </div>
                )}

                {citationType === "Web" && (
                  <div className="space-y-2">
                    <Label>Website Name</Label>
                    <Input
                      value={newCitation.namaSitus}
                      onChange={(e) => setNewCitation({ ...newCitation, namaSitus: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <ModalFooter>
          {/* handleCancelAction provides the "Back" vs "Cancel" logic */}
          <Button variant="outline" onClick={handleCancelAction}>
            {citationType !== "None" ? "Back" : "Cancel"}
          </Button>
          
          {/* Submit button only appears in Stage 2 */}
          {citationType !== "None" && (
            <Button onClick={handleCreateCitation}>Add Citation</Button>
          )}
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDeleteCitation(deleteConfirm)}
        title="Delete Citation"
        message="Are you sure you want to delete this citation?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}