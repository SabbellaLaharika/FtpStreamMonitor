"use client";

import { io } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000";

export const socket = io(WS_URL, {
  autoConnect: true,
});
