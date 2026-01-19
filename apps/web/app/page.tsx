"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getOrCreateUser, CollabUser } from "./lib/user";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<CollabUser | null>(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    setUser(getOrCreateUser());
  }, []);

  function startSession() {
    const roomId = crypto.randomUUID();
    router.push(`/room/${roomId}`);
  }

  function joinSession() {
    if (!input.trim()) return;

    // Allow full URL or just roomId
    const value = input.trim();
    const roomId = value.includes("/room/")
      ? value.split("/room/")[1]
      : value;

    router.push(`/room/${roomId}`);
  }

  if (!user) return null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-md p-6 rounded-xl bg-zinc-900 border border-zinc-800 space-y-6">
        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">CollabCode</h1>
          <p className="text-sm text-zinc-400">
            Real-time collaborative coding
          </p>
        </div>

        {/* User */}
        <div className="text-xs text-center text-zinc-400">
          👤 You are signed in as{" "}
          <span className="text-zinc-200">{user.name}</span>
        </div>

        {/* Create */}
        <div className="space-y-2">
          <button
            onClick={startSession}
            className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 transition"
          >
            ➕ Start a New Session
          </button>
          <p className="text-[11px] text-zinc-500 text-center">
            A session is created instantly and can be shared via link.
          </p>
        </div>

        {/* Join */}
        <div className="space-y-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste Room ID or Full Link"
            className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-sm"
          />
          <button
            onClick={joinSession}
            className="w-full py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-sm"
          >
            Join Session
          </button>
        </div>

        {/* Footer */}
        <div className="text-[11px] text-zinc-500 text-center">
          Live • Secure • Conflict-free • No signup required
        </div>
      </div>
    </main>
  );
}
