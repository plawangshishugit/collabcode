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

  // ✅ ADD THIS
  const decorationsRef = useRef<string[]>([]);
  
  function randomColor() {
    const colors = [
      "#e6194b",
      "#3cb44b",
      "#ffe119",
      "#4363d8",
      "#f58231",
      "#911eb4",
      "#46f0f0",
      "#f032e6",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

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

    const awareness = provider.awareness;

    awareness.setLocalState({
      user: {
        name: `User-${Math.floor(Math.random() * 1000)}`,
        color: randomColor(),
      },
    });
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
    editor: monaco.editor.IStandaloneCodeEditor,
    monacoInstance: typeof monaco
  ) {
    editorRef.current = editor;

    if (!ydocRef.current || !ytextRef.current || !providerRef.current) {
      return;
    }

    // Bind CRDT text
    new MonacoBinding(
      ytextRef.current,
      editor.getModel()!,
      new Set([editor]),
      providerRef.current.awareness
    );

    const awareness = providerRef.current.awareness;

    // 🔴 1. Broadcast local cursor movement
    editor.onDidChangeCursorPosition((e) => {
      awareness.setLocalStateField("cursor", {
        lineNumber: e.position.lineNumber,
        column: e.position.column,
      });
    });

    // 🔵 2. Render remote cursors
    awareness.on("change", () => {
      const states = Array.from(awareness.getStates().values());

      const decorations = states.flatMap((state: any) => {
        if (!state.cursor || !state.user) return [];

        return [
          {
            range: new monacoInstance.Range(
              state.cursor.lineNumber,
              state.cursor.column,
              state.cursor.lineNumber,
              state.cursor.column
            ),
            options: {
              className: "remote-cursor",
            },
          },
        ];
      });

      decorationsRef.current = editor.deltaDecorations(
        decorationsRef.current,
        decorations
      );
    });
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
