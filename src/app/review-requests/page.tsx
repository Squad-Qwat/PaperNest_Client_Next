"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useDocuments } from "@/lib/store";
import { Navbar } from "@/components/layout/navbar";
import { SearchInput } from "@/components/ui/search-input";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Review, ReviewStatus } from "@/types";

// Extended interface to include metadata needed for display/actions
interface ExtendedReview extends Review {
  documentTitle: string;
  documentId: number;
  ownerId: number;
  ownerName: string;
}

export default function ReviewRequestsPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, users } = useAuth(); // We need 'users' to find student documents
  const { deleteReview } = useDocuments();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "all">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    reviewId: string;
    docId: number;
    ownerId: number;
  } | null>(null);

  // LOGIC: If Lecturer, gather reviews from ALL students. If Student, gather own.
  const allReviews: ExtendedReview[] = useMemo(() => {
    if (!currentUser) return [];

    let reviewsList: ExtendedReview[] = [];

    if (currentUser.role === "Lecturer") {
      // Iterate through ALL users to find Student documents
      users.forEach((user) => {
        // Optional: Filter by specific students if needed, currently getting all
        if (user.documents) {
          user.documents.forEach((doc) => {
            if (doc.reviews && doc.reviews.length > 0) {
              doc.reviews.forEach((review) => {
                reviewsList.push({
                  ...review,
                  documentTitle: doc.title,
                  documentId: doc.id,
                  ownerId: user.id, // Important for deleting
                  ownerName: `${user.firstName} ${user.lastName}`,
                });
              });
            }
          });
        }
      });
    } else {
      // Fallback for Student (though UI is hidden) - just show own
      const myUser = users.find((u) => u.id === currentUser.id);
      if (myUser && myUser.documents) {
        myUser.documents.forEach((doc) => {
            if (doc.reviews) {
                doc.reviews.forEach((review) => {
                    reviewsList.push({
                        ...review,
                        documentTitle: doc.title,
                        documentId: doc.id,
                        ownerId: myUser.id,
                        ownerName: "Me",
                    });
                });
            }
        });
      }
    }
    return reviewsList;
  }, [currentUser, users]);

  // Filter Logic
  const filteredReviews = useMemo(() => {
    return allReviews.filter((review) => {
      const matchesSearch =
        review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.documentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesStatus =
        statusFilter === "all" || review.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [allReviews, searchQuery, statusFilter]);

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteReview(deleteConfirm.ownerId, deleteConfirm.docId, deleteConfirm.reviewId);
      setDeleteConfirm(null);
    }
  };

  // Safe check for current user
  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar mode="workspace" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentUser.role === "Lecturer" ? (
          <>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Review Requests
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage review requests from your students
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search reviews, students..."
                  className="w-full sm:w-64"
                />
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as ReviewStatus | "all")
                  }
                >
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="mb-8" />

            {filteredReviews.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-dashed">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-gray-400"
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
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  No review requests found
                </h3>
                <p className="text-gray-500 mt-1">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "When students request reviews, they will appear here"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReviews.map((review) => (
                  <Card key={review.id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-4">
                        <StatusBadge status={review.status} />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {review.date}
                        </span>
                      </div>
                      <CardTitle className="text-lg mt-2 line-clamp-1">
                        {review.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-1">
                        by {review.ownerName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-3">
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium text-gray-900">Document: </span>
                        {review.documentTitle}
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-3">
                        {review.comment}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-3 border-t bg-gray-50/50 flex justify-between gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          router.push(
                            `/${currentUser.id}/documents/${review.documentId}?review=${review.id}`
                          )
                        }
                      >
                        View Document
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() =>
                          setDeleteConfirm({
                            reviewId: review.id,
                            docId: review.documentId,
                            ownerId: review.ownerId,
                          })
                        }
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
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          // Student view - reviews are hidden or shown differently
          <div className="text-center py-16">
             <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
             </div>
            <h2 className="text-xl font-semibold text-gray-900">Student Access Restricted</h2>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              This page is designed for lecturers to manage incoming review requests. You can see your own reviews inside your documents.
            </p>
            <Button className="mt-6" onClick={() => router.push(`/${currentUser.id}`)}>
                Return to Workspace
            </Button>
          </div>
        )}
      </main>

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Review Request"
        message="Are you sure you want to delete this review request? This action cannot be undone."
        variant="danger"
        confirmText="Delete"
      />
    </div>
  );
}