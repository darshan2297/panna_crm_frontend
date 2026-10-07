"use client";

import io, { Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Shared Socket.IO connection for the CRM.
 * Reuse this singleton instead of opening a new connection per component.
 */
export function getSocket(): Socket {
  if (!socket) {
    const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(
      /\/api\/v1\/?$/,
      ""
    );
    socket = io(base, { transports: ["websocket", "polling"] });
  }
  return socket;
}
