"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  function createRoom() {
    const id = crypto.randomUUID().slice(0, 8);
    router.push(`/room/${id}`);
  }

  return (
    <main className="h-screen flex items-center justify-center">
      <div className="flex flex-col gap-4 items-center">
        <h1 className="text-2xl font-bold">
          Collaborative Editor
        </h1>

        <button
          onClick={createRoom}
          className="px-6 py-3 border rounded text-lg hover:bg-gray-100"
        >
          Create New Room
        </button>
      </div>
    </main>
  );
}
