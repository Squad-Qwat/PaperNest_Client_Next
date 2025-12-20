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
    <LiveblocksProvider publicApiKey="pk_dev_CV4Wwn1JhYmGqG7iafAwMZP7LUA3zI8WtRBqXgbxjyyb34AQ8buooMP9VbC6-SdE">
      <RoomProvider id={roomId}>
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
