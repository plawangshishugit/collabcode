"use client";

import { useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { io } from "socket.io-client";

import { useYjsProvider } from "./hooks/useYjsProvider";
import { useMonacoBinding } from "./hooks/useMonacoBinding";
import { useAwareness } from "./hooks/useAwareness";
import { useSnapshots } from "./hooks/useSnapshots";
import VersionHistory from "./components/VersionHistory";

const socket = io("http://localhost:4000");

export default function EditorClient({ roomId }: { roomId: string }) {
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  const { ydocRef, providerRef, ytextRef } = useYjsProvider(roomId);

  useMonacoBinding(
    editor,
    ytextRef.current,
    providerRef.current?.awareness
  );

  useAwareness(editor, providerRef.current?.awareness);

  const { versions, restoreVersion } = useSnapshots(
    ydocRef.current,
    socket,
    roomId
  );

  return (
    <div className="flex h-screen">
      <div className="flex-1">
        <button
          onClick={() =>
            restoreVersion(versions.length - 2)
          }
          disabled={versions.length < 2}
          className="absolute top-3 right-72 z-10 text-xs bg-zinc-800 text-zinc-200 px-3 py-1 rounded hover:bg-zinc-700 disabled:opacity-40"
        >
          ⏪ Shared Undo
        </button>
        <Editor
          height="100%"
          language="javascript"
          theme="vs-dark"
          onMount={(ed) => setEditor(ed)}
        />
      </div>

      <VersionHistory
        versions={versions}
        onRestore={restoreVersion}
      />
    </div>
  );
}
