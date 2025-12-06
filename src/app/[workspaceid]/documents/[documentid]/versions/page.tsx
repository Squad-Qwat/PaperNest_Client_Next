"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useDocuments } from "@/lib/store";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SearchInput } from "@/components/ui/search-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function VersionsPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { getDocument, updateDocument } = useDocuments();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [commitComment, setCommitComment] = useState("");

  const documentId = parseInt(params.documentid as string);
  const isStudent = currentUser?.role === "Student";

  // 1. Get the document from the central store
  const document = useMemo(() => {
    if (!currentUser || !documentId) return null;
    return getDocument(currentUser.id, documentId);
  }, [currentUser, documentId, getDocument]);

  // 2. Determine the next revision number based on existing versions
  const nextRevision = useMemo(() => {
    if (!document?.versions?.length) return 1000;
    const latestRev = Math.max(
      ...document.versions.map((v) => parseInt(v.id.replace("r", "")))
    );
    return latestRev + 1;
  }, [document]);

  // 3. Filter history based on search query
  const filteredHistory = useMemo(() => {
    if (!document?.versions) return [];
    return document.versions.filter(
      (item) =>
        item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [document, searchQuery]);

  const handleCommit = () => {
    if (!commitComment.trim() || !currentUser || !document) return;

    const newVersion = {
      id: `r${nextRevision}`,
      author: `${currentUser.firstName} ${currentUser.lastName}`,
      date: new Date().toLocaleString("sv-SE").slice(0, 16).replace("T", " "), // Format: YYYY-MM-DD HH:MM
      message: commitComment,
    };

    // 4. Update the actual store instead of local state
    updateDocument(currentUser.id, document.id, {
      versions: [newVersion, ...(document.versions || [])],
    });

    setCommitComment("");
    setIsCommitModalOpen(false);
  };

  if (!currentUser || !document) return null;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar mode="document" documentId={documentId.toString()} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push(`/${params.workspaceid}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-4 transition-colors"
          >
            ← Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold text-gray-100 mb-2">
            Versions - {document.title}
          </h1>
          <p className="text-gray-400">{document.description}</p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by revision or message..."
              className="w-full md:w-64"
            />
            {isStudent && (
              <Button onClick={() => setIsCommitModalOpen(true)}>
                Commit Changes
              </Button>
            )}
          </div>
        </div>

        <Separator className="mb-8" />

        <div className="space-y-4">
          {filteredHistory.map((v) => (
            <Card key={v.id} className="overflow-hidden border border-gray-800 rounded-lg p-6 hover:border-gray-700 bg-gray-900">
              <CardHeader className="p-0 mb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-green-700 bg-yellow-100">
                      {v.id}
                    </Badge>
                    <CardTitle className="text-base text-white">{v.author}</CardTitle>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">{v.date}</span>
                </div>
              </CardHeader>
              <CardContent className="bg-gray-950 border border-gray-800 rounded-lg p-3">
                <p className="text-sm text-gray-400 leading-relaxed">
                  <span className="font-semibold text-green-500 mr-2">Message:</span>
                  {v.message}
                </p>
              </CardContent>
            </Card>
          ))}

          {filteredHistory.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-xl">
              <p className="text-gray-500">No versions found.</p>
            </div>
          )}
        </div>
      </main>

      <Dialog open={isCommitModalOpen} onOpenChange={setIsCommitModalOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-800">
          <DialogHeader>
            <DialogTitle>Commit Changes</DialogTitle>
            <DialogDescription className="text-gray-400">
              Describe the changes made to <strong>{document.title}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Commit Message</Label>
              <Textarea 
                placeholder="e.g., Updated the results section"
                value={commitComment}
                onChange={(e) => setCommitComment(e.target.value)}
                className="bg-gray-950 border-gray-800"
              />
            </div>
            <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-800">
              <p className="text-xs text-blue-400">
                This will create version <strong>r{nextRevision}</strong>.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCommitModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCommit} disabled={!commitComment.trim()}>
              Commit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}