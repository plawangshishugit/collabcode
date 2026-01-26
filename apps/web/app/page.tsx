"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  async function createRoom() {
    const res = await fetch("/api/rooms", { method: "POST" });
    const { roomId, ownerToken } = await res.json();

    router.push(`/room/${roomId}?ownerToken=${ownerToken}`);
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <button
        onClick={createRoom}
        className="px-4 py-2 border rounded"
      >
        Create New Room
      </button>
    </div>
  );
}
