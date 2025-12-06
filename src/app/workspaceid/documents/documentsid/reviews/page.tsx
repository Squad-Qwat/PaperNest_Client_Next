"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useDocuments } from "@/lib/store";
import { Navbar } from "@/components/layout/navbar";
import { SearchInput } from "@/components/ui/search-input";
import { StatusBadge } from "@/components/ui/badge";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { ReviewStatus } from "@/types";

export default function ReviewsPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { getDocument, addReview, deleteReview } = useDocuments();

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state for new review
  const [newReview, setNewReview] = useState({
    title: "",
    reviewer: "",
    comment: "",
    status: "pending" as ReviewStatus,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const documentId = parseInt(params.documentid as string);
  const document = currentUser ? getDocument(currentUser.id, documentId) : undefined;

  // Get all reviews
  const reviews = document?.reviews || [];

  // Filter reviews based on search query
  const filteredReviews = useMemo(() => {
    if (!searchQuery) return reviews;

    const query = searchQuery.toLowerCase();
    return reviews.filter(
      (review) =>
        review.title.toLowerCase().includes(query) ||
        review.reviewer.toLowerCase().includes(query) ||
        review.comment.toLowerCase().includes(query)
    );
  }, [reviews, searchQuery]);

  // Handle create review
  const handleCreateReview = () => {
    const errors: Record<string, string> = {};

    if (!newReview.title.trim()) {
      errors.title = "Title is required";
    }
    if (!newReview.reviewer.trim()) {
      errors.reviewer = "Reviewer name is required";
    }
    if (!newReview.comment.trim()) {
      errors.comment = "Comment is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (currentUser && document) {
      addReview(currentUser.id, documentId, {
        title: newReview.title.trim(),
        reviewer: newReview.reviewer.trim(),
        comment: newReview.comment.trim(),
        date: new Date().toISOString().split("T")[0],
        status: newReview.status,
      });

      // Reset form
      setNewReview({
        title: "",
        reviewer: "",
        comment: "",
        status: "pending",
      });
      setFormErrors({});
      setShowCreateModal(false);
    }
  };

  // Handle delete review
  const handleDeleteReview = (reviewId: string) => {
    if (currentUser) {
      deleteReview(currentUser.id, documentId, reviewId);
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
            Reviews - {document.title}
          </h1>
          <p className="text-gray-400">{document.description}</p>
        </div>

        {/* Search and Create */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search reviews by title, reviewer, or comment..."
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
            Add Review
          </Button>
        </div>

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
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
              {searchQuery ? "No reviews found" : "No reviews yet"}
            </p>
            <p className="text-gray-600 text-sm">
              {searchQuery
                ? "Try a different search term"
                : "Add your first review to get started"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-100">
                        {review.title}
                      </h3>
                      <StatusBadge status={review.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
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
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        {review.reviewer}
                      </span>
                      <span className="flex items-center gap-1">
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
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {review.date}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Comment */}
                <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {review.comment}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteConfirm(review.id)}
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

      {/* Create Review Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewReview({
            title: "",
            reviewer: "",
            comment: "",
            status: "pending",
          });
          setFormErrors({});
        }}
        title="Add New Review"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Review Title
            </label>
            <input
              id="title"
              type="text"
              value={newReview.title}
              onChange={(e) => {
                setNewReview({ ...newReview, title: e.target.value });
                setFormErrors({ ...formErrors, title: "" });
              }}
              placeholder="e.g., Initial Review, Peer Review"
              className={`w-full px-4 py-2.5 bg-gray-950 border rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                formErrors.title ? "border-red-500" : "border-gray-800"
              }`}
            />
            {formErrors.title && (
              <p className="mt-1 text-sm text-red-400">{formErrors.title}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="reviewer"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Reviewer Name
            </label>
            <input
              id="reviewer"
              type="text"
              value={newReview.reviewer}
              onChange={(e) => {
                setNewReview({ ...newReview, reviewer: e.target.value });
                setFormErrors({ ...formErrors, reviewer: "" });
              }}
              placeholder="e.g., Dr. Smith"
              className={`w-full px-4 py-2.5 bg-gray-950 border rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                formErrors.reviewer ? "border-red-500" : "border-gray-800"
              }`}
            />
            {formErrors.reviewer && (
              <p className="mt-1 text-sm text-red-400">{formErrors.reviewer}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Review Comment
            </label>
            <textarea
              id="comment"
              value={newReview.comment}
              onChange={(e) => {
                setNewReview({ ...newReview, comment: e.target.value });
                setFormErrors({ ...formErrors, comment: "" });
              }}
              placeholder="Enter detailed review feedback..."
              rows={4}
              className={`w-full px-4 py-2.5 bg-gray-950 border rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                formErrors.comment ? "border-red-500" : "border-gray-800"
              }`}
            />
            {formErrors.comment && (
              <p className="mt-1 text-sm text-red-400">{formErrors.comment}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Review Status
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setNewReview({ ...newReview, status: "approved" })}
                className={`px-4 py-2.5 border rounded-lg font-medium transition-all ${
                  newReview.status === "approved"
                    ? "bg-green-600 border-green-500 text-white"
                    : "bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-700"
                }`}
              >
                Approved
              </button>
              <button
                type="button"
                onClick={() => setNewReview({ ...newReview, status: "pending" })}
                className={`px-4 py-2.5 border rounded-lg font-medium transition-all ${
                  newReview.status === "pending"
                    ? "bg-yellow-600 border-yellow-500 text-white"
                    : "bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-700"
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setNewReview({ ...newReview, status: "rejected" })}
                className={`px-4 py-2.5 border rounded-lg font-medium transition-all ${
                  newReview.status === "rejected"
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-700"
                }`}
              >
                Rejected
              </button>
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowCreateModal(false);
              setNewReview({
                title: "",
                reviewer: "",
                comment: "",
                status: "pending",
              });
              setFormErrors({});
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleCreateReview}>Add Review</Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDeleteReview(deleteConfirm)}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}