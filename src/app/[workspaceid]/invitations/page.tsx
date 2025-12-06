"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { User } from "@/types";

export default function InvitationPage() {
  const router = useRouter();
  const { currentUser, users } = useAuth();
  
  // State for Invite Dialog
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<User | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // State for Confirmation Dialog
  const [userToInvite, setUserToInvite] = useState<User | null>(null);

  // Mock data for current team members (for display purposes)
  const currentMembers = users.filter(u => u.id === currentUser?.id); 

  // 1. Handle Search Logic
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    // Search in the global users store
    const foundUser = users.find(
      (u) => 
        u.email.toLowerCase() === searchQuery.toLowerCase() || 
        u.username.toLowerCase() === searchQuery.toLowerCase()
    );

    setSearchResult(foundUser || null);
    setHasSearched(true);
  };

  // 2. Reset dialog when closed
  const handleCloseInviteDialog = () => {
    setIsInviteOpen(false);
    setSearchQuery("");
    setSearchResult(null);
    setHasSearched(false);
  };

  // 3. Handle Invite Action
  const handleInviteConfirm = () => {
    // Here you would call an API to send the invite
    console.log(`Inviting user: ${userToInvite?.email}`);
    
    // Close confirmation
    setUserToInvite(null);
    // Close main dialog
    handleCloseInviteDialog();
    
    // Optional: Show a success message or toast here
    alert(`Invitation sent to ${userToInvite?.firstName}!`);
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar mode="workspace" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage who has access to this workspace.
            </p>
          </div>
          <Button onClick={() => setIsInviteOpen(true)}>
            <svg
              className="w-4 h-4 mr-2"
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
            Invite Member
          </Button>
        </div>

        <Separator className="mb-8" />

        {/* Current Members List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Current Members</h2>
          <div className="grid gap-4">
            {currentMembers.map((member) => (
              <Card key={member.id} className="flex flex-row items-center justify-between p-4 bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                    {member.firstName[0]}
                    {member.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {member.firstName} {member.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
                <Badge variant={member.role === "Lecturer" ? "default" : "secondary"}>
                  {member.role}
                </Badge>
              </Card>
            ))}
            
            {/* Dummy Mock Members for Visual Completeness */}
            <Card className="flex flex-row items-center justify-between p-4 bg-white opacity-60">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                    JD
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">John Doe (Example)</h3>
                    <p className="text-sm text-gray-500">john@example.com</p>
                  </div>
                </div>
                <Badge variant="outline">Viewer</Badge>
            </Card>
          </div>
        </div>
      </main>

      {/* --- Modal 1: Search & Invite --- */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite to Workspace</DialogTitle>
            <DialogDescription>
              Search for a user by email or username to invite them to this workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex gap-2">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="email@example.com"
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={!searchQuery}>
                Search
              </Button>
            </div>

            {/* Search Results Area */}
            {hasSearched && (
              <div className="mt-2 animate-in fade-in zoom-in-95 duration-200">
                {searchResult ? (
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
                        {searchResult.firstName[0]}{searchResult.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {searchResult.firstName} {searchResult.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {searchResult.role} • {searchResult.email}
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => setUserToInvite(searchResult)}
                    >
                      Invite
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center border-2 border-dashed rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">
                      No user found matching "{searchQuery}"
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try searching for "lecturer@example.com"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseInviteDialog}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Modal 2: Confirmation --- */}
      <ConfirmDialog
        isOpen={userToInvite !== null}
        onClose={() => setUserToInvite(null)}
        onConfirm={handleInviteConfirm}
        title="Send Invitation"
        message={`Are you sure you want to invite ${userToInvite?.firstName} ${userToInvite?.lastName} to this workspace? They will be able to view shared documents.`}
        confirmText="Send Invite"
        variant="info"
      />
    </div>
  );
}