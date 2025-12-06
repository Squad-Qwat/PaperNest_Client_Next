"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useDocuments } from "@/lib/store";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SearchInput } from "@/components/ui/search-input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function VersionIdPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { getDocument } = useDocuments();

  const [searchQuery, setSearchQuery] = useState("");
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);

  const workspaceId = params.workspaceId as string;
  const documentId = parseInt(params.documentid as string);
  const versionId = params.versionid as string; // e.g., "r1042"

  // 1. Get the document context from store.tsx
  const document = useMemo(() => {
    if (!currentUser || !documentId) return null;
    return getDocument(currentUser.id, documentId);
  }, [currentUser, documentId, getDocument]);

  // 2. Filter: Match the URL ID first, then apply Search bar criteria
  const filteredVersion = useMemo(() => {
    if (!document || !document.versions) return null;

    // Find the specific version matching the URL parameter
    const target = document.versions.find((v) => v.id === versionId);
    if (!target) return null;

    // Apply search filter if user is typing
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      target.id.toLowerCase().includes(searchLower) ||
      target.author.toLowerCase().includes(searchLower) ||
      target.message.toLowerCase().includes(searchLower);

    return matchesSearch ? target : null;
  }, [document, versionId, searchQuery]);

  const handleRevert = () => {
    // SVN Revert logic simulation
    console.log(`Reverting document ${documentId} to revision ${versionId}`);
    router.push(`/${workspaceId}/documents/${documentId}`);
  };

  if (!currentUser || !document) return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar mode="document" documentId={documentId.toString()} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 mb-8">
          <button 
            onClick={() => router.back()}
            className="text-sm text-blue-600 hover:underline w-fit"
          >
            ← Back to All Versions
          </button>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Revision Details
              </h1>
              <p className="text-sm text-gray-500">
                Viewing commit history for <span className="font-medium">{document.title}</span>
              </p>
            </div>

            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search details..."
              className="w-full sm:w-80"
            />
          </div>
        </div>

        <Separator className="mb-8" />

        {!filteredVersion ? (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed">
            <h3 className="text-lg font-medium text-gray-900">
              {searchQuery ? "No matching version details" : "Revision not found"}
            </h3>
            <p className="text-gray-500 mt-1">
              {searchQuery ? "Try checking your search terms" : `Revision ${versionId} does not exist for this document.`}
            </p>
          </div>
        ) : (
          <Card className="border-t-4 border-t-blue-600 shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center mb-2">
                <Badge variant="outline" className="font-mono text-blue-700 bg-blue-50">
                  Revision {filteredVersion.id}
                </Badge>
                <span className="text-sm text-gray-400 font-mono">{filteredVersion.date}</span>
              </div>
              <CardTitle className="text-xl">Commit by {filteredVersion.author}</CardTitle>
              <CardDescription className="text-sm">
                SVN-like Global Revision Identifier
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-gray-950 text-gray-100 p-4 rounded-md font-mono text-sm">
                <p className="text-blue-400 mb-2"># Commit Message</p>
                <p className="leading-relaxed">"{filteredVersion.message}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded border">
                  <p className="text-gray-500 mb-1 font-semibold uppercase text-[10px]">Changes</p>
                  {/* Note: Mock data in store doesn't have line counts, providing a fallback */}
                  <p className="text-gray-900">Lines modified in {filteredVersion.id}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded border">
                  <p className="text-gray-500 mb-1 font-semibold uppercase text-[10px]">Author Role</p>
                  <p className="text-gray-900">Workspace Member</p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t bg-gray-50/30 flex justify-between px-6 py-4">
              <p className="text-xs text-gray-400 italic">
                {currentUser.role === "Lecturer" 
                  ? "Read-only history view" 
                  : "Student revision control active"}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                {currentUser.role === "Student" && (
                  <Button onClick={() => setShowRevertConfirm(true)}>
                    Revert to This Version
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        )}
      </main>

      <ConfirmDialog
        isOpen={showRevertConfirm}
        onClose={() => setShowRevertConfirm(false)}
        onConfirm={handleRevert}
        title="Revert Document"
        message={`Are you sure you want to revert the current document back to revision ${versionId}? Current unsaved changes will be overwritten.`}
        confirmText="Confirm Revert"
        variant="warning"
      />
    </div>
  );
}