"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useDocuments } from "@/lib/store";
import { Navbar } from "@/components/layout/navbar";
import { StatusBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Modal, ModalFooter } from "@/components/ui/modal";
import type { ReviewStatus } from "@/types";

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { getDocument, deleteReview } = useDocuments();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const documentId = parseInt(params.documentid as string);
  const reviewId = params.reviewid as string;
  
  const document = currentUser ? getDocument(currentUser.id, documentId) : undefined;
  const review = document?.reviews.find((r) => r.id === reviewId);

  // Handle delete review
  const handleDeleteReview = () => {
    if (currentUser && review) {
      deleteReview(currentUser.id, documentId, review.id);
      router.push(`/${currentUser.id}/documents/${documentId}/reviews`);
    }
  };

  // Navigate back to reviews list
  const handleBackToReviews = () => {
    router.push(`/${currentUser?.id}/documents/${documentId}/reviews`);
  };

  if (!currentUser) {
    router.push("/login");
    return null;
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar mode="document" documentId={params.documentid as string} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">Document not found</p>
          </div>
        </main>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar mode="document" documentId={params.documentid as string} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <p className="text-gray-500 text-lg mb-4">Review not found</p>
            <Button onClick={handleBackToReviews}>Back to Reviews</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar mode="document" documentId={params.documentid as string} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={handleBackToReviews}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
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
            Back to Reviews
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Review Details
              </h1>
              <p className="text-gray-600">
                Document: {document.title}
              </p>
            </div>
          </div>
        </div>

        {/* Review Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Header Section */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {review.title}
                  </h2>
                  <StatusBadge status={review.status} />
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="font-medium">{review.reviewer}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>{review.date}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comment Section */}
          <div className="px-6 py-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Review Comment
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {review.comment}
              </p>
            </div>
          </div>

          {/* Metadata Section */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 font-medium">Review ID:</span>
                <span className="ml-2 text-gray-700">{review.id}</span>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Document ID:</span>
                <span className="ml-2 text-gray-700">{review.docId}</span>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="px-6 py-4 bg-white border-t border-gray-200 flex gap-3">
            <Button
              variant="outline"
              onClick={handleBackToReviews}
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to List
            </Button>
            
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
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
              Delete Review
            </Button>
          </div>
        </div>

        {/* Related Information */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                About This Review
              </h4>
              <p className="text-sm text-blue-800">
                This review is part of the document "{document.title}". You can view all reviews for this document by clicking the "Back to List" button.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteReview}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone and you will be redirected to the reviews list."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}