"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useDocuments } from "@/lib/store";
import { Navbar } from "@/components/navbar";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { getDocument } = useDocuments();

  const documentId = parseInt(params.documentid as string);
  const document = currentUser ? getDocument(currentUser.id, documentId) : undefined;

  useEffect(() => {
    if (!currentUser) {
      router.push("/login");
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return null;
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar mode="document" documentId={params.documentid as string} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">Document not found</p>
            <Button
              onClick={() => router.push(`/${params.workspaceid}`)}
              className="mt-4"
            >
              Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar mode="document" documentId={params.documentid as string} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/${params.workspaceid}`)}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-6 transition-colors"
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

        {/* Document Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-100 mb-3">
                {document.title}
              </h1>
              <p className="text-gray-400 text-lg mb-4">{document.description}</p>
            </div>
            <StatusBadge status={document.status} />
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span>Last updated {document.lastUpdated}</span>
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {document.citations.length} citations
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
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
              {document.reviews.length} reviews
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() =>
              router.push(
                `/${params.workspaceid}/documents/${documentId}/citations`
              )
            }
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-600 hover:bg-gray-800 transition-all group text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-gray-100 group-hover:text-blue-400 transition-colors">
                Manage Citations
              </h3>
              <svg
                className="w-6 h-6 text-gray-500 group-hover:text-blue-400 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
            <p className="text-gray-400 mb-4">
              Add, edit, and manage citations for this document
            </p>
            <div className="text-2xl font-bold text-blue-500">
              {document.citations.length}
            </div>
            <p className="text-sm text-gray-500">Total citations</p>
          </button>

          <button
            onClick={() =>
              router.push(`/${params.workspaceid}/documents/${documentId}/reviews`)
            }
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-green-600 hover:bg-gray-800 transition-all group text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-gray-100 group-hover:text-green-400 transition-colors">
                Manage Reviews
              </h3>
              <svg
                className="w-6 h-6 text-gray-500 group-hover:text-green-400 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
            <p className="text-gray-400 mb-4">
              View and manage peer reviews for this document
            </p>
            <div className="text-2xl font-bold text-green-500">
              {document.reviews.length}
            </div>
            <p className="text-sm text-gray-500">Total reviews</p>
          </button>
        </div>

        {/* Document Content Placeholder */}
        <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            Document Content
          </h2>
          <div className="bg-gray-950 border border-gray-800 rounded-lg p-6 text-center">
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
            <p className="text-gray-500 text-lg mb-2">Document Editor</p>
            <p className="text-gray-600 text-sm">
              This is a placeholder for the document editor. The actual editor
              integration will be implemented in future versions.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
