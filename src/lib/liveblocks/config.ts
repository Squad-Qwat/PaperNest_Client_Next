/**
 * Liveblocks Configuration
 * Setup for real-time collaboration with Liveblocks
 */

import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

// Initialize Liveblocks client
const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "",
  throttle: 100, // Throttle updates to 100ms
});

// Create Room context with TypeScript types
type Presence = {
  cursor: { x: number; y: number } | null;
  user: {
    id: string;
    name: string;
    avatar?: string;
    color?: string;
  } | null;
};

type Storage = {
  // Define your Yjs storage structure here if needed
  // For now, Yjs handles the document structure
};

type UserMeta = {
  id: string;
  info: {
    name: string; // Full name from database
    email?: string;
    avatar?: string;
    color?: string; // Generated color for collaboration cursor
  };
};

type RoomEvent = {
  // Define custom room events here
};

// Export the room context hooks
const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useOthers,
  useOthersMapped,
  useOthersConnectionIds,
  useOther,
  useSelf,
  useStorage,
  useMutation,
  useHistory,
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
  // useBatch, // Not available in Liveblocks v3.12.1
  useEventListener,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);

export {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useOthers,
  useOthersMapped,
  useOthersConnectionIds,
  useOther,
  useSelf,
  useStorage,
  useMutation,
  useHistory,
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
  // useBatch, // Not available in Liveblocks v3.12.1
  useEventListener,
};

// Export client for advanced usage
export { client };

// Helper function to generate room ID from document ID
export function getDocumentRoomId(documentId: string): string {
  return `document:${documentId}`;
}

// Helper function to generate room ID from workspace and document
export function getWorkspaceDocumentRoomId(workspaceId: string, documentId: string): string {
  return `workspace:${workspaceId}:document:${documentId}`;
}
