"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useCollab } from "../../useCollab";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react"),
  { ssr: false }
);

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const { onEditorMount, undo, redo, joinRoom, role } = useCollab();

  // join room once
  joinRoom(id);

  return (
    <main className="h-screen flex flex-col">
      <header className="p-3 border-b flex gap-2">
        <span className="text-sm text-gray-500">
          Room: {id}
        </span>
        <button onClick={undo} className="px-3 py-1 border rounded">
          Undo
        </button>
        <button onClick={redo} className="px-3 py-1 border rounded">
          Redo
        </button>
      </header>

      <MonacoEditor
        height="100vh"
        defaultLanguage="typescript"
        theme="vs-dark"

        onMount={onEditorMount}
        options={{
          readOnly: role === "viewer",
          cursorStyle: role ==="viewer" ? "line-thin" : "line",
          fontSize: 14,
          minimap: { enabled: false },
          automaticLayout: true,
        }}
      />
    </main>
  );
}

