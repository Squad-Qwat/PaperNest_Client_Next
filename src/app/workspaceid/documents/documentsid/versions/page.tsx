"use client";

import React, { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth, useDocuments } from "@/store";
import { Trash2, Plus, Clock, User } from "lucide-react";

interface Version {
  id: string;
  date: string;
  author: string;
  comment: string;
  content?: string;
}

export default function VersionPage() {
  const { currentUser } = useAuth();
  const { getDocuments } = useDocuments();
  
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [versions, setVersions] = useState<Version[]>([
    {
      id: "v1",
      date: "2024-12-15T10:30:00",
      author: "Abiyyu Cakra",
      comment: "Initial commit: Created document structure and added introduction section"
    },
    {
      id: "v2",
      date: "2024-12-15T14:20:00",
      author: "Abiyyu Cakra",
      comment: "Added methodology section with research framework"
    },
    {
      id: "v3",
      date: "2024-12-16T09:15:00",
      author: "Sarah Williams",
      comment: "Review changes: Updated literature review and added new citations"
    }
  ]);

  const [newCommit, setNewCommit] = useState({
    comment: ""
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    versionId: string | null;
  }>({
    isOpen: false,
    versionId: null
  });

  const documents = currentUser ? getDocuments(currentUser.id) : [];

  const handleAddVersion = useCallback(() => {
    if (!newCommit.comment.trim() || !currentUser) return;

    const newVersion: Version = {
      id: `v${versions.length + 1}`,
      date: new Date().toISOString(),
      author: `${currentUser.firstName} ${currentUser.lastName}`,
      comment: newCommit.comment.trim()
    };

    setVersions(prev => [...prev, newVersion]);
    setNewCommit({ comment: "" });
  }, [newCommit, currentUser, versions.length]);

  const handleDeleteVersion = useCallback((versionId: string) => {
    setVersions(prev => prev.filter(v => v.id !== versionId));
    setDeleteDialog({ isOpen: false, versionId: null });
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays === 1) return "1 hari yang lalu";
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to view document versions</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Version History</h1>
          <p className="text-gray-600">Track all changes and commits for your documents</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Select a document to view versions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {documents.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedDocId === doc.id
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900">{doc.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{doc.lastUpdated}</div>
                  </button>
                ))}
                {documents.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No documents available</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Commit New Version</CardTitle>
                <CardDescription>Create a new version entry for the current state</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="comment">Commit Message</Label>
                  <textarea
                    id="comment"
                    value={newCommit.comment}
                    onChange={(e) => setNewCommit({ comment: e.target.value })}
                    placeholder="Describe the changes made in this version..."
                    className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <Button
                  onClick={handleAddVersion}
                  disabled={!newCommit.comment.trim()}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Commit Version
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Version History</CardTitle>
                <CardDescription>
                  {versions.length} {versions.length === 1 ? 'commit' : 'commits'} total
                </CardDescription>
              </CardHeader>
              <CardContent>
                {versions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No versions yet</p>
                    <p className="text-sm">Create your first commit above</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {versions.map((version, index) => (
                      <div
                        key={version.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {version.id}
                              </span>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(version.date)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{version.author}</span>
                            </div>
                            
                            <p className="text-sm text-gray-700 pl-6">{version.comment}</p>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleteDialog({ isOpen: true, versionId: version.id })}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, versionId: null })}
        onConfirm={() => deleteDialog.versionId && handleDeleteVersion(deleteDialog.versionId)}
        title="Delete Version"
        message="Are you sure you want to delete this version? This action cannot be undone and will remove this commit from the history."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}