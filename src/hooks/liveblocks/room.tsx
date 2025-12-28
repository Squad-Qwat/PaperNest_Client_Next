"use client";

import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";

type RoomProps = {
  documentId: string;
  children: ReactNode;
};

export function Room({ documentId, children }: RoomProps) {
  // Use consistent room ID format that matches webhook expectations
  const roomId = `document-${documentId}`;
  
  return (
    <LiveblocksProvider
      authEndpoint={async (room) => {
        // Get the access token from localStorage or cookies
        const token = localStorage.getItem("accessToken");
        
        if (!token) {
          throw new Error("No authentication token found");
        }

        // Call our authentication endpoint with the token
        const response = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ room }),
        });

        if (!response.ok) {
          throw new Error("Authentication failed");
        }

        return await response.json();
      }}
    >
      <RoomProvider id={roomId}>
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
