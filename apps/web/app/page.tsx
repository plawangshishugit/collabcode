"use client";

import dynamic from "next/dynamic";
import { useCollab } from "./useCollab";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react"),
  { ssr: false }
);

export default function Home() {
  const { onEditorMount, undo, redo } = useCollab();

  return (
    <main className="h-screen flex flex-col">
      <header className="p-3 border-b flex gap-2">
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
      </header>

      <MonacoEditor
        height="100%"
        defaultLanguage="typescript"
        defaultValue=""
        onMount={onEditorMount}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          automaticLayout: true,
        }}
      />
    </main>
  );
}
