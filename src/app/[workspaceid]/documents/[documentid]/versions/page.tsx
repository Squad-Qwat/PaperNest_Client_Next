"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useDocuments } from "@/lib/store";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

// Mock helper to simulate global revision increment
let globalRevision = 1042; 

export default function VersionsPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { getDocument } = useDocuments();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [commitComment, setCommitComment] = useState("");

  const documentId = parseInt(params.documentid as string);
  const isStudent = currentUser?.role === "Student";

  // Get document and simulate a version history array 
  // (In a real app, this would be a property inside the document object in store.tsx)
  const document = useMemo(() => {
    if (!currentUser || !documentId) return null;
    return getDocument(currentUser.id, documentId);
  }, [currentUser, documentId, getDocument]);

  // Simulated SVN-style commit history
  const [history, setHistory] = useState([
    { rev: 1042, author: "Abiyyu Cakra", date: "2023-10-24 14:30", comment: "Finalized methodology section" },
    { rev: 1040, author: "Abiyyu Cakra", date: "2023-10-22 09:15", comment: "Added initial draft of literature review" },
    { rev: 1035, author: "System", date: "2023-10-20 18:00", comment: "Initial workspace creation" },
  ]);

  const filteredHistory = useMemo(() => {
    return history.filter(item => 
      item.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rev.toString().includes(searchQuery)
    );
  }, [history, searchQuery]);

  const handleCommit = () => {
    if (!commitComment.trim()) return;
    
    const newEntry = {
      rev: globalRevision + 1,
      author: `${currentUser?.firstName} ${currentUser?.lastName}`,
      date: new Date().toLocaleString(),
      comment: commitComment,
    };

    globalRevision++;
    setHistory([newEntry, ...history]);
    setCommitComment("");
    setIsCommitModalOpen(false);
  };

  if (!currentUser || !document) return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar mode="document" documentId={documentId.toString()} />

      <main className="max-w-5xl mx-auto px-4 py-8">
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
            Versions - {document.title}
          </h1>
          <p className="text-gray-400">{document.description}</p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <SearchInput 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Search by revision or comment..."
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
            <Card key={v.rev} className="overflow-hidden border-l-4 border-l-primary">
              <CardHeader className="py-4 bg-white">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-blue-700 bg-blue-50">
                      r{v.rev}
                    </Badge>
                    <CardTitle className="text-base">{v.author}</CardTitle>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">{v.date}</span>
                </div>
              </CardHeader>
              <CardContent className="py-4 bg-gray-50/30">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold text-gray-500 mr-2">Message:</span>
                  {v.comment}
                </p>
              </CardContent>
            </Card>
          ))}

          {filteredHistory.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed rounded-xl">
              <p className="text-gray-500">No revisions found matching your search.</p>
            </div>
          )}
        </div>
      </main>

      {/* Commit Modal (Only accessible to Students) */}
      <Dialog open={isCommitModalOpen} onOpenChange={setIsCommitModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Commit Changes</DialogTitle>
            <DialogDescription>
              Provide a clear comment describing the changes you've made to the document.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Commit Message</Label>
              <Textarea 
                placeholder="e.g., Updated the results section with new data"
                value={commitComment}
                onChange={(e) => setCommitComment(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700">
                <strong>Pro-tip:</strong> This will create revision <strong>r{globalRevision + 1}</strong>.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCommitModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCommit} disabled={!commitComment.trim()}>
              Commit to History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}