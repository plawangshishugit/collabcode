"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { io } from "socket.io-client";

import { useYjsProvider } from "./hooks/useYjsProvider";
import { useMonacoBinding } from "./hooks/useMonacoBinding";
import { useAwareness } from "./hooks/useAwareness";
import { useSnapshots } from "./hooks/useSnapshots";
import { useCodeRunner } from "./hooks/useCodeRunner";

import VersionHistory from "./components/VersionHistory";
import OutputPanel from "./components/OutputPanel";

const socket = io("http://localhost:4000");

export default function EditorClient({ roomId }: { roomId: string }) {
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  const { ydocRef, providerRef, ytextRef } = useYjsProvider(roomId);

  // ✅ UPDATED: new signature
  useMonacoBinding(
    editor,
    ytextRef.current,
    providerRef.current?.awareness,
    socket,
    roomId
  );

  useAwareness(editor, providerRef.current?.awareness);

  const { versions, restoreVersion } = useSnapshots(
    ydocRef.current,
    socket,
    roomId
  );

  // 🧪 Web Worker execution
  const { run, output, error, running } = useCodeRunner();

  return (
    <div className="flex h-screen">
      {/* Editor + controls */}
      <div className="flex flex-col flex-1 relative">
        {/* Top bar */}
        <div className="flex items-center gap-2 p-2 bg-zinc-900 border-b border-zinc-700">
          <button
            onClick={() => run(editor?.getValue() || "")}
            disabled={running}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50"
          >
            ▶️ Run
          </button>

          <button
            onClick={() => restoreVersion(versions.length - 2)}
            disabled={versions.length < 2}
            className="px-3 py-1 text-xs bg-zinc-800 text-zinc-200 rounded hover:bg-zinc-700 disabled:opacity-40"
          >
            ⏪ Shared Undo
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1">
          <Editor
            height="100%"
            language="javascript"
            theme="vs-dark"
            onMount={(ed) => setEditor(ed)}
          />
        </div>

        {/* Output */}
        <OutputPanel output={output} error={error} />
      </div>

      {/* Version history */}
      <VersionHistory
        versions={versions}
        onRestore={restoreVersion}
      />
    </div>
  );
}
