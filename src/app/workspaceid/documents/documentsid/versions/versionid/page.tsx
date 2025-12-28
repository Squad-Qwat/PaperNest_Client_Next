"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth, useDocuments } from "@/store";
import { Search, Clock, User, FileText, AlertCircle, Trash2, Plus, ChevronLeft } from "lucide-react";

interface Version {
  id: string;
  date: string;
  author: string;
  comment: string;
  documentId: number;
  documentTitle: string;
}

export default function VersionPage() {
  const { currentUser } = useAuth();
  const { getDocuments } = useDocuments();
  
  // Mock version data across multiple documents
  const [allVersions, setAllVersions] = useState<Version[]>([
    {
      id: "v1",
      date: "2024-12-15T10:30:00",
      author: "Abiyyu Cakra",
      comment: "Initial commit: Created document structure and added introduction section",
      documentId: 1,
      documentTitle: "Machine Learning in Healthcare"
    },
    {
      id: "v2",
      date: "2024-12-15T14:20:00",
      author: "Abiyyu Cakra",
      comment: "Added methodology section with research framework",
      documentId: 1,
      documentTitle: "Machine Learning in Healthcare"
    },
    {
      id: "v3",
      date: "2024-12-16T09:15:00",
      author: "Sarah Williams",
      comment: "Review changes: Updated literature review and added new citations",
      documentId: 1,
      documentTitle: "Machine Learning in Healthcare"
    },
    {
      id: "v1",
      date: "2024-12-14T11:00:00",
      author: "Abiyyu Cakra",
      comment: "Initial draft: Climate data collection and analysis setup",
      documentId: 2,
      documentTitle: "Climate Change Impact Study"
    },
    {
      id: "v2",
      date: "2024-12-14T16:45:00",
      author: "Abiyyu Cakra",
      comment: "Added statistical analysis and visualization charts",
      documentId: 2,
      documentTitle: "Climate Change Impact Study"
    },
    {
      id: "v1",
      date: "2024-12-10T13:20:00",
      author: "Sarah Williams",
      comment: "Initial commit: Quantum computing basics and theory",
      documentId: 3,
      documentTitle: "Quantum Computing Fundamentals"
    },
    {
      id: "v2",
      date: "2024-12-11T10:00:00",
      author: "Sarah Williams",
      comment: "Added quantum algorithms section with examples",
      documentId: 3,
      documentTitle: "Quantum Computing Fundamentals"
    },
    {
      id: "v3",
      date: "2024-12-12T14:30:00",
      author: "Sarah Williams",
      comment: "Updated references and added practical applications",
      documentId: 3,
      documentTitle: "Quantum Computing Fundamentals"
    }
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [viewMode, setViewMode] = useState<"search" | "detail">("search");
  
  const [newCommit, setNewCommit] = useState({
    comment: ""
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    versionKey: string | null;
  }>({
    isOpen: false,
    versionKey: null
  });

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.trim().toLowerCase();
    return allVersions.filter(version => 
      version.id.toLowerCase() === query ||
      version.id.toLowerCase().includes(query)
    );
  }, [searchQuery, allVersions]);

  const selectedDocVersions = useMemo(() => {
    if (!selectedVersion) return [];
    return allVersions
      .filter(v => v.documentId === selectedVersion.documentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedVersion, allVersions]);

  const handleSearch = useCallback(() => {
    if (searchResults.length > 0) {
      setSelectedVersion(searchResults[0]);
      setViewMode("detail");
    }
  }, [searchResults]);

  const handleViewVersion = useCallback((version: Version) => {
    setSelectedVersion(version);
    setViewMode("detail");
  }, []);

  const handleBackToSearch = useCallback(() => {
    setViewMode("search");
    setSelectedVersion(null);
    setNewCommit({ comment: "" });
  }, []);

  const handleAddVersion = useCallback(() => {
    if (!newCommit.comment.trim() || !currentUser || !selectedVersion) return;

    const documentVersions = allVersions.filter(v => v.documentId === selectedVersion.documentId);
    const maxVersionNum = documentVersions.reduce((max, v) => {
      const num = parseInt(v.id.substring(1));
      return num > max ? num : max;
    }, 0);

    const newVersion: Version = {
      id: `v${maxVersionNum + 1}`,
      date: new Date().toISOString(),
      author: `${currentUser.firstName} ${currentUser.lastName}`,
      comment: newCommit.comment.trim(),
      documentId: selectedVersion.documentId,
      documentTitle: selectedVersion.documentTitle
    };

    setAllVersions(prev => [...prev, newVersion]);
    setNewCommit({ comment: "" });
  }, [newCommit, currentUser, selectedVersion, allVersions]);

  const handleDeleteVersion = useCallback((versionKey: string) => {
    setAllVersions(prev => prev.filter((v, idx) => `${v.documentId}-${v.id}-${idx}` !== versionKey));
    setDeleteDialog({ isOpen: false, versionKey: null });
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

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

  const uniqueVersionIds = useMemo(() => {
    const ids = new Set(allVersions.map(v => v.id));
    return Array.from(ids).sort();
  }, [allVersions]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to search document versions</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (viewMode === "detail" && selectedVersion) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <Button 
              variant="ghost" 
              onClick={handleBackToSearch}
              className="mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{selectedVersion.documentTitle}</h1>
                <p className="text-gray-600 mt-1">Version History & Management</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Document Info</CardTitle>
                  <CardDescription>Current document details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-500">Document Title</Label>
                    <p className="font-medium mt-1">{selectedVersion.documentTitle}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Total Versions</Label>
                    <p className="font-medium mt-1">{selectedDocVersions.length} commits</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Latest Version</Label>
                    <p className="font-medium mt-1">{selectedDocVersions[0]?.id || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Last Updated</Label>
                    <p className="font-medium mt-1">{formatDate(selectedDocVersions[0]?.date || '')}</p>
                  </div>
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
                    {selectedDocVersions.length} {selectedDocVersions.length === 1 ? 'commit' : 'commits'} for this document
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedDocVersions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No versions yet</p>
                      <p className="text-sm">Create your first commit above</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedDocVersions.map((version, index) => {
                        const versionKey = `${version.documentId}-${version.id}-${allVersions.findIndex(v => v === version)}`;
                        return (
                          <div
                            key={versionKey}
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
                                onClick={() => setDeleteDialog({ isOpen: true, versionKey })}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, versionKey: null })}
          onConfirm={() => deleteDialog.versionKey && handleDeleteVersion(deleteDialog.versionKey)}
          title="Delete Version"
          message="Are you sure you want to delete this version? This action cannot be undone and will remove this commit from the history."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Version Search</h1>
          <p className="text-gray-600">Search for specific document versions by their ID</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Version</CardTitle>
            <CardDescription>
              Enter a version ID to find matching commits across all documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Version ID</Label>
              <div className="flex gap-2">
                <input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter version ID (e.g., v1, v2, v3...)"
                  className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button onClick={handleSearch} disabled={searchResults.length === 0} className="px-6">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">Available Version IDs:</p>
              <div className="flex flex-wrap gap-2">
                {uniqueVersionIds.map(id => (
                  <button
                    key={id}
                    onClick={() => setSearchQuery(id)}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {searchQuery && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                {searchResults.length === 0 
                  ? `No versions found for "${searchQuery}"`
                  : `Found ${searchResults.length} ${searchResults.length === 1 ? 'version' : 'versions'} matching "${searchQuery}"`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No matching versions found</p>
                  <p className="text-sm mt-1">Try searching for a different version ID</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((version, index) => (
                    <div
                      key={`${version.documentId}-${version.id}-${index}`}
                      className="border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleViewVersion(version)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {version.id}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(version.date)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{version.documentTitle}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-700">{version.author}</span>
                        </div>
                        
                        <div className="bg-white border border-gray-200 rounded p-3">
                          <p className="text-sm text-gray-700 leading-relaxed">{version.comment}</p>
                        </div>

                        <div className="pt-2 border-t border-gray-200">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewVersion(version);
                            }}
                            className="w-full"
                          >
                            View Full History
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!searchQuery && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Search className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Ready to search</p>
                <p className="text-sm mt-2">Enter a version ID above to find matching commits</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}