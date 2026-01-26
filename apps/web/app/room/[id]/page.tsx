"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useCollab } from "../../useCollab";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react"),
  { ssr: false }
);

export default function RoomPage() {
  /* ---------- Route ---------- */
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="h-screen flex items-center justify-center">
        Invalid room
      </div>
    );
  }

  /* ---------- Collaboration ---------- */
  const {
    onEditorMount,
    undo,
    redo,
    joinRoom,
    role,
    isConnected,
  } = useCollab();

  /* ---------- Join room (ONCE) ---------- */
  useEffect(() => {
    if (!isConnected) return;
    joinRoom(id);
  }, [id, isConnected, joinRoom]);

  /* ---------- Connection gate ---------- */
  if (!isConnected) {
    return (
      <div className="h-screen flex items-center justify-center text-lg">
        Connecting…
      </div>
    );
  }

  /* ---------- Permission gate ---------- */
  if (role === null) {
    return (
      <div className="h-screen flex items-center justify-center text-lg">
        Joining room…
      </div>
    );
  }

  /* ---------- UI ---------- */
  return (
    <main className="h-screen flex flex-col">
      <header className="p-3 border-b flex gap-2 items-center">
        <span className="text-sm text-gray-500">
          Room: {id}
        </span>

        {role === "owner" && (
          <>
            <button
              onClick={undo}
              className="px-3 py-1 border rounded"
            >
              Undo
            </button>
            <button
              onClick={redo}
              className="px-3 py-1 border rounded"
            >
              Redo
            </button>
          </>
        )}

        <span
          className={`ml-auto text-xs px-2 py-1 rounded ${
            role === "owner"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {role === "owner"
            ? "Editor (Owner)"
            : "Viewer (Read-only)"}
        </span>
      </header>

      <MonacoEditor
        height="100vh"
        defaultLanguage="typescript"
        theme="vs-dark"
        onMount={onEditorMount}
        options={{
          readOnly: role !== "owner",
          cursorStyle:
            role === "owner" ? "line" : "line-thin",
          fontSize: 14,
          minimap: { enabled: false },
          automaticLayout: true,
        }}
      />
    </main>
  );
}
