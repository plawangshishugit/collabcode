"use client";

import { useState, useMemo } from "react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { io } from "socket.io-client";

import { getCurrentUser } from "@/app/lib/auth";

import { useYjsProvider } from "./hooks/useYjsProvider";
import { useMonacoBinding } from "./hooks/useMonacoBinding";
import { useAwareness } from "./hooks/useAwareness";
import { useSnapshots } from "./hooks/useSnapshots";
import { useCodeRunner } from "./hooks/useCodeRunner";

import VersionHistory from "./components/VersionHistory";
import OutputPanel from "./components/OutputPanel";
import EditorToolbar from "./components/EditorToolbar"; 

const socket = io("http://localhost:4000");

export default function EditorClient({ roomId }: { roomId: string }) {
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  const user = useMemo(() => getCurrentUser(), []);

  const { ydocRef, providerRef, ytextRef } = useYjsProvider(roomId);

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

  const { run, output, error, running } = useCodeRunner();

  return (
    <div className="flex h-screen">
      <div className="flex flex-col flex-1 relative">
        {/* ✅ TOOLBAR MOVED OUT */}
        <EditorToolbar
          canRun={!!user && !running}
          onRun={() => run(editor?.getValue() || "")}
          onUndo={() => restoreVersion(versions.length - 2)}
          canUndo={versions.length >= 2}
        />

        <div className="flex-1">
          <Editor
            height="100%"
            language="javascript"
            theme="vs-dark"
            onMount={(ed) => setEditor(ed)}
          />
        </div>

        <OutputPanel output={output} error={error} />
      </div>

      <VersionHistory
        versions={versions}
        onRestore={restoreVersion}
      />
    </div>
  );
}
