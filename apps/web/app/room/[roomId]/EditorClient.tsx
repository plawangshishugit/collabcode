"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { io } from "socket.io-client";

import { useYjsProvider } from "./hooks/useYjsProvider";
import { useMonacoBinding } from "./hooks/useMonacoBinding";
import { useAwareness } from "./hooks/useAwareness";
import { useSnapshots } from "./hooks/useSnapshots";

const socket = io("http://localhost:4000");

export default function EditorClient({ roomId }: { roomId: string }) {
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  // 🔑 CRDT lifecycle + restore API
  const {
    ydocRef,
    providerRef,
    ytextRef,
    restoreFromSnapshot,
  } = useYjsProvider(roomId);

  // 🔗 Monaco <-> CRDT binding
  useMonacoBinding(
    editor,
    ytextRef.current,
    providerRef.current?.awareness
  );

  // 👤 Cursor + presence
  useAwareness(editor, providerRef.current?.awareness);

  // 📸 Local snapshot history + broadcast restore
  const { restorePrevious } = useSnapshots(
    ydocRef.current,
    socket,
    roomId
  );

  // 🔄 Apply shared restore from other users
  useEffect(() => {
    socket.on("crdt:restore", ({ snapshot }) => {
      console.log("🔄 Received shared restore");
      restoreFromSnapshot(new Uint8Array(snapshot));
    });

    return () => {
      socket.off("crdt:restore");
    };
  }, [restoreFromSnapshot]);

  return (
    <>
      {/* 🔄 Shared Undo Button */}
      <button
        onClick={restorePrevious}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 10,
          padding: "6px 10px",
          background: "#222",
          color: "#fff",
          borderRadius: "4px",
          border: "1px solid #444",
          cursor: "pointer",
        }}
      >
        🔄 Shared Undo
      </button>

      <Editor
        height="100%"
        language="javascript"
        theme="vs-dark"
        onMount={(ed) => setEditor(ed)}
      />
    </>
  );
}
