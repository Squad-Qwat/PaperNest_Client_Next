"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/store";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SearchInput } from "@/components/ui/search-input";
import { History, Save, ShieldCheck } from "lucide-react";

// Import your provided components
import { CommitModal } from "@/components/document/CommitModal";
import ModalVersions from "@/components/document/ModalVersions";
import { Version } from "@/types/index";

const MOCK_VERSIONS: Version[] = [
  { id: '5', docId: 1, datetime: '15 Agustus 2023, 16:51', author: 'Fa Ainama Caldera', message: 'Latest version', color: 'bg-purple-500', isCurrent: true },
  { id: '4', docId: 1, datetime: '15 Agustus 2023, 16:15', author: 'Fa Ainama Caldera', message: 'Update Document 2', color: 'bg-purple-500' },
  { id: '3', docId: 1, datetime: '14 Agustus 2023, 14:30', author: 'Rangga', message: 'Update Document 1', color: 'bg-orange-500' },
  { id: '2', docId: 1, datetime: '14 Agustus 2023, 13:00', author: 'Rangga', message: 'First User version', color: 'bg-orange-500' },
  // { id: '1', docId: 1, datetime: '14 Agustus 2023, 11:00', author: 'System', message: 'Initial System Version', color: 'bg-gray-500', isSystem: true },
];

export default function VersionsPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();

  // 1. Initial State using MOCK_VERSIONS from your ModalVersions.tsx
  const [versions, setVersions] = useState<Version[]>(MOCK_VERSIONS);

  const [searchQuery, setSearchQuery] = useState("");
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const documentId = params.documentid as string;
  const isStudent = currentUser?.role === "Student";

  const filteredHistory = useMemo(() => {
    return versions.filter(
      (item) =>
        item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [versions, searchQuery]);

  const handleCommit = (data: { title: string; description: string; isInitial?: boolean }) => {
    const nextId = (versions.length + (versions.length === 0 ? 2 : 1)).toString();
    
    const newVersion: Version = {
      id: nextId,
      docId: parseInt(documentId),
      datetime: new Date().toLocaleString('id-ID', { 
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
      }),
      author: currentUser ? `${currentUser.name}` : 'Anonymous',
      message: data.title,
      color: 'bg-blue-500',
      isCurrent: true,
      isSystem: data.isInitial
    };

    if (versions.length === 0) 
    {
      const systemVersion: Version = {
        id: '1',
        docId: parseInt(documentId),
        datetime: new Date().toLocaleString('id-ID', { 
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
        }),
        author: 'System',
        message: 'Initial System Version',
        color: 'bg-gray-500',
        isSystem: true,
        isCurrent: false
      };

      setVersions([newVersion, systemVersion])
      return
    }

    setVersions(prev => [
      newVersion,
      ...prev.map(v => ({ ...v, isCurrent: false }))
    ]);
  };

  const handleDeleteVersion = (versionId: string) => {
    setVersions(prev => prev.filter(v => v.id !== versionId));
  };

  if (!currentUser) {return null;}

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar mode="document" documentId={documentId} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <button
              onClick={() => router.back()}
              className="text-sm text-gray-400 hover:text-white transition-colors mb-2"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold">Sejarah Revisi</h1>
            <p className="text-gray-400 text-sm">Document: {documentId}</p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="bg-transparent border-gray-800 text-gray-300 hover:bg-gray-900"
              onClick={() => setIsHistoryModalOpen(true)}
            >
              <History className="mr-2 h-4 w-4" />
              Kelola versi
            </Button>
            {isStudent && (
              <Button onClick={() => setIsCommitModalOpen(true)}>
                <Save className="mr-2 h-4 w-4" />
                Commit Perubahan
              </Button>
            )}
          </div>
        </div>

        <div className="mb-8">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search commits..."
            className="w-full bg-gray-900 border-gray-800"
          />
        </div>

        <Separator className="mb-8 bg-gray-800" />

        <div className="relative space-y-2 before:absolute before:inset-y-0 before:left-4 before:w-0.5 before:bg-gray-800">
          {filteredHistory.map((v) => (
            <div key={v.id} className="relative pl-10 pb-4">
              <div className={`absolute left-[13px] top-3 w-2 h-2 rounded-full border-4 border-gray-950 ring-1 ${v.isCurrent ? 'bg-green-500 ring-green-500' : 'bg-purple-500 ring-purple-500'}`} />
              
              <Card className="border-gray-800 bg-gray-900 hover:border-gray-700 transition-all">
                <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`font-mono bg-gray-950 border-gray-800 ${v.isSystem ? 'text-amber-500' : 'text-blue-400'}`}>
                      REV-{v.id}
                    </Badge>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-semibold">{v.message}</CardTitle>
                        {v.isSystem && <ShieldCheck className="h-3 w-3 text-amber-500" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{v.author}</span>
                        {v.isCurrent && <Badge className="text-[10px] bg-green-900/30 text-green-500 border-green-800">Current</Badge>}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">{v.datetime}</span>
                </CardHeader>
              </Card>
            </div>
          ))}
        </div>
      </main>

      <CommitModal 
        isOpen={isCommitModalOpen}
        onClose={() => setIsCommitModalOpen(false)}
        onCommit={handleCommit}
        isFirstVersion={versions.length === 0}
      />

      <ModalVersions 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        documentTitle={`Document ${documentId}`}
        onDeleteVersion={handleDeleteVersion}
      />
    </div>
  );
}