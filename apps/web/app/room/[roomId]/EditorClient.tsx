"use client";

import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import * as monaco from "monaco-editor";

export default function EditorClient({ roomId }: { roomId: string }) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);

  // 1️⃣ Create Yjs document + provider (DOES NOT depend on editor)
  useEffect(() => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const provider = new WebsocketProvider(
      "ws://localhost:1234",
      roomId,
      ydoc
    );
    providerRef.current = provider;

    provider.on("status", (e: { status: "connected" | "disconnected" }) => {
      console.log("PROVIDER STATUS:", e.status);
    });

    const ytext = ydoc.getText("monaco");
    ytextRef.current = ytext;

    // Optional initial content
    if (ytext.length === 0) {
      ytext.insert(0, "// Start coding...\n");
    }

    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [roomId]);

  // 2️⃣ Bind Monaco editor when it mounts
  function handleEditorMount(
    editor: monaco.editor.IStandaloneCodeEditor
  ) {
    editorRef.current = editor;

    if (!ydocRef.current || !ytextRef.current || !providerRef.current) {
      return;
    }

    new MonacoBinding(
      ytextRef.current,
      editor.getModel()!,
      new Set([editor]),
      providerRef.current.awareness
    );
  }

  return (
    <Editor
      height="100%"
      language="javascript"
      theme="vs-dark"
      onMount={handleEditorMount}
    />
  );
}
