"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

export default function Home() {
  useEffect(() => {
    socket.on("connect", () => {
      console.log("🟢 Connected to server:", socket.id);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold">
        CollabCode – Stage 0
      </h1>
      <p className="mt-2 text-gray-600">
        Check console for WebSocket connection.
      </p>
    </main>
  );
}
