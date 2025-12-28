"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/store";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ArrowLeft, Clock, User, ShieldCheck, History, Info } from "lucide-react";
import { Version } from "@/types/index";

// 1. Synchronized Mock Data (Matches the main page.tsx)
const MOCK_VERSIONS: Version[] = [
  { id: '5', docId: 1, datetime: '15 Agustus 2023, 16:51', author: 'Fa Ainama Caldera', message: 'Latest version', color: 'bg-purple-500', isCurrent: true },
  { id: '4', docId: 1, datetime: '15 Agustus 2023, 16:15', author: 'Fa Ainama Caldera', message: 'Update Document 2', color: 'bg-purple-500' },
  { id: '3', docId: 1, datetime: '14 Agustus 2023, 14:30', author: 'Rangga', message: 'Update Document 1', color: 'bg-orange-500' },
  { id: '2', docId: 1, datetime: '14 Agustus 2023, 13:00', author: 'Rangga', message: 'First User version', color: 'bg-orange-500' },
  // { id: '1', docId: 1, datetime: '14 Agustus 2023, 11:00', author: 'System', message: 'Initial System Version', color: 'bg-gray-500', isSystem: true },
];

export default function VersionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);

  const documentId = params.documentid as string;
  const versionId = params.versionid as string;

  // 2. Locate the specific version based on URL parameter
  const selectedVersion = useMemo(() => {
    return MOCK_VERSIONS.find(v => v.id === versionId);
  }, [versionId]);

  const handleRevert = () => {
    console.log(`Restoring document to version: ${versionId}`);
    setShowRevertConfirm(false);
    // Logic to set this version as current would go here
    router.push(`/document/${documentId}/versions`);
  };

  // Guard Clause: If user is not logged in or version doesn't exist
  if (!currentUser) return null;
  if (!selectedVersion) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">Version Not Found</h2>
          <Button variant="link" onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar mode="document" documentId={documentId} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-sm text-gray-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Kembali ke riwayat
          </button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">Detail Versi</h1>
              <Badge variant="outline" className={`font-mono ${selectedVersion.isSystem ? 'text-amber-500 border-amber-900 bg-amber-950/30' : 'text-blue-400 border-blue-900 bg-blue-950/30'}`}>
                REV-{selectedVersion.id}
              </Badge>
              {selectedVersion.isCurrent && (
                <Badge className="bg-green-900/30 text-green-500 border-green-800">
                  Current Version
                </Badge>
              )}
            </div>
            <p className="text-gray-400">Menampilkan snapshot dokumen pada waktu tertentu.</p>
          </div>
        </div>

        <Card className="border-gray-800 bg-gray-900 overflow-hidden">
          <CardHeader className="border-b border-gray-800 bg-gray-900/50">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  {selectedVersion.message}
                  {selectedVersion.isSystem && <ShieldCheck className="h-5 w-5 text-amber-500" />}
                </CardTitle>
                <CardDescription className="mt-1 flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {selectedVersion.datetime}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> {selectedVersion.author}
                  </span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="p-8 min-h-[400px] bg-white text-gray-900 shadow-inner">
              {/* This is a placeholder for the actual document content snapshot */}
              <div className="prose max-w-none">
                <h2 className="text-2xl font-bold mb-4">Content Preview</h2>
                <p>This is a read-only snapshot of <strong>REV-{selectedVersion.id}</strong>.</p>
                <p className="mt-4 text-gray-500 italic">
                  [Konten dokumen untuk versi ini akan dimuat di sini...]
                </p>
                {selectedVersion.isSystem && (
                    <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-md flex gap-3 text-amber-800 text-sm">
                        <Info className="h-5 w-5 shrink-0" />
                        <p>Ini adalah versi awal yang dibuat oleh sistem saat dokumen pertama kali dikomit.</p>
                    </div>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t border-gray-800 bg-gray-950/30 flex justify-between items-center px-6 py-4">
            <p className="text-xs text-gray-500 italic">
              {currentUser.role === "Lecturer" 
                ? "Audit View Only" 
                : "Revision Control Active"}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.back()} className="border-gray-700 hover:bg-gray-800 text-gray-300">
                Tutup
              </Button>
              {currentUser.role === "Student" && !selectedVersion.isCurrent && (
                <Button 
                  onClick={() => setShowRevertConfirm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <History className="mr-2 h-4 w-4" />
                  Kembali ke versi ini
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </main>

      <ConfirmDialog
        isOpen={showRevertConfirm}
        onClose={() => setShowRevertConfirm(false)}
        onConfirm={handleRevert}
        title="Restore Document"
        message={`Yakin mau mengembalikan dokumen ke versi ${versionId}? Tindakan ini akan membuat versi baru berdasarkan status ini.`}
        confirmText="Konfirmasi"
        variant="warning"
      />
    </div>
  );
}