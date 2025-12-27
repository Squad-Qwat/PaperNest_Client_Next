/**
 * Liveblocks Authentication Endpoint
 * Handles authentication and user metadata for Liveblocks collaboration
 */

import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    // Get the authorization token from the request headers
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("[Liveblocks Auth] No authorization header found");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify the token and get user info from your backend
    const userResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!userResponse.ok) {
      console.error("[Liveblocks Auth] Failed to fetch user info:", userResponse.status);
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const response = await userResponse.json();

    // Extract user from nested response structure
    const user = response.data?.user || response.user || response;

    // Validate user data
    if (!user || !user.userId) {
      console.error("[Liveblocks Auth] Invalid user data:", response);
      return new NextResponse("Invalid user data", { status: 400 });
    }

    console.log("[Liveblocks Auth] User authenticated:", { 
      userId: user.userId, 
      name: user.name 
    });

    // Start a Liveblocks session with user metadata
    const session = liveblocks.prepareSession(user.userId, {
      userInfo: {
        name: user.name || user.username || "Unknown User", // Full name from database
        email: user.email,
        avatar: user.photoURL || undefined,
        color: generateColorFromString(user.userId || user.username || user.email), // Generate consistent color
      },
    });

    // Get room from request body (optional)
    const body = await request.json().catch(() => ({}));
    const { room } = body;

    // Authorize access to the room (optional: add room-based permissions here)
    if (room) {
      session.allow(room, session.FULL_ACCESS);
    }

    // Get the authorization token
    const { status, body: responseBody } = await session.authorize();

    return new NextResponse(responseBody, { status });
  } catch (error) {
    console.error("[Liveblocks Auth] Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/**
 * Generate a consistent color from a string (user ID)
 * This ensures each user always gets the same color
 */
function generateColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}
