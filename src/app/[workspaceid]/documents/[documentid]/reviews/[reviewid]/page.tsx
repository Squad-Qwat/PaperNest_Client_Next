"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useDocuments } from "@/lib/store";
import { Navbar } from "@/components/layout/navbar";
import { SearchInput } from "@/components/ui/search-input";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { Review } from "@/types";

export default function ReviewIdPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { getDocument, deleteReview } = useDocuments();

  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Extracting IDs from the dynamic route
  const workspaceId = params.workspaceId as string;
  const documentId = parseInt(params.documentid as string);
  const reviewId = params.reviewid as string;

  // 1. Get the document first
  const document = useMemo(() => {
    if (!currentUser || !documentId) return null;
    return getDocument(currentUser.id, documentId);
  }, [currentUser, documentId, getDocument]);

  // 2. Filter for the specific Review ID and apply Search query
  const displayReview = useMemo(() => {
    if (!document || !document.reviews) return null;
    
    // Find the specific review requested in the URL
    const targetReview = document.reviews.find((r) => r.id === reviewId);
    
    if (!targetReview) return null;

    // Apply the "Search bar" filter to this specific review
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      targetReview.title.toLowerCase().includes(searchLower) ||
      targetReview.reviewer.toLowerCase().includes(searchLower) ||
      targetReview.comment.toLowerCase().includes(searchLower);

    return matchesSearch ? targetReview : null;
  }, [document, reviewId, searchQuery]);

  const handleDelete = () => {
    if (currentUser && documentId && reviewId) {
      deleteReview(currentUser.id, documentId, reviewId);
      router.push(`/${workspaceId}/documents/${documentId}`);
    }
  };

  if (!currentUser || !document) return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar mode="document" documentId={documentId.toString()} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 mb-8">
          <button 
            onClick={() => router.back()}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            ← Back to All Reviews
          </button>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                Review Details
                <Badge variant="outline" className="font-mono text-xs">
                  ID: {reviewId}
                </Badge>
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                From Document: <span className="font-semibold">{document.title}</span>
              </p>
            </div>

            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search in this review..."
              className="w-full sm:w-72"
            />
          </div>
        </div>

        <Separator className="mb-8" />

        {/* The Filtered Review Content */}
        {!displayReview ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed">
            <h3 className="text-lg font-medium text-gray-900">
              {searchQuery ? "No matches found for your search" : "Review not found"}
            </h3>
            <p className="text-gray-500 mt-1">
              {searchQuery ? "Try clearing your search bar" : "The review ID might be incorrect"}
            </p>
            {searchQuery && (
              <Button variant="link" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <Card className="shadow-md border-t-4 border-t-primary">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <StatusBadge status={displayReview.status} />
                <span className="text-sm text-gray-400">{displayReview.date}</span>
              </div>
              <CardTitle className="text-2xl mt-4">{displayReview.title}</CardTitle>
              <CardDescription className="text-base">
                Reviewer: <span className="font-medium text-gray-900">{displayReview.reviewer}</span>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="py-6">
              <div className="bg-gray-50 p-6 rounded-lg border italic text-gray-700 leading-relaxed">
                "{displayReview.comment}"
              </div>
            </CardContent>

            <CardFooter className="border-t bg-gray-50/50 flex justify-between gap-3 px-6 py-4">
              <p className="text-xs text-gray-400">
                Authorized perspective: Lecturer
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/${workspaceId}/documents/${documentId}`)}
                >
                  View Document
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setDeleteConfirm(true)}
                >
                  Delete Review
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}
      </main>

      {/* Reusing your ConfirmDialog component */}
      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Single Review"
        message="Are you sure you want to delete this specific review entry? This cannot be undone."
        confirmText="Yes, Delete"
        variant="danger"
      />
    </div>
  );
}