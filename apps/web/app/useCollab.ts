"use client";

import * as Y from "yjs";
import { useEffect, useRef, useState } from "react";
import type * as monaco from "monaco-editor";
import { getUserIdentity } from "./lib/identity";

/* ---------------------------------- */
/* Types */
/* ---------------------------------- */

type YTextDelta = {
  insert?: string;
  delete?: number;
  retain?: number;
};

/* ---------------------------------- */
/* Hook */
/* ---------------------------------- */

export function useCollab() {
  /* ---------- Identity ---------- */
  const userRef = useRef<ReturnType<typeof getUserIdentity> | null>(null);

  /* ---------- State ---------- */
  const [isConnected, setIsConnected] = useState(false);
  const [role, setRole] = useState<"owner" | "viewer" | null>(null);
  const pendingInitialSyncRef = useRef<boolean>(false);

  /* ---------- Core ---------- */
  const wsRef = useRef<WebSocket | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const undoManagerRef = useRef<Y.UndoManager | null>(null);

  /* ---------- Monaco ---------- */
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  /* ---------- Guards ---------- */
  const applyingRemoteRef = useRef(false);
  const joinedRoomRef = useRef<string | null>(null);
  const strictCleanupRef = useRef(false);

  /* ---------------------------------- */
  /* Setup (ONCE) */
  /* ---------------------------------- */

useEffect(() => {
  let alive = true; // ✅ correct StrictMode-safe guard

  // ✅ identity (client only)
  userRef.current = getUserIdentity();

  const ydoc = new Y.Doc();
  const ytext = ydoc.getText("editor");
  const undoManager = new Y.UndoManager(ytext);

  ydocRef.current = ydoc;
  ytextRef.current = ytext;
  undoManagerRef.current = undoManager;

  const ws = new WebSocket("ws://localhost:3001");
  wsRef.current = ws;

  ws.onopen = () => {
    if (!alive) return;
    console.log("🟢 WS connected");
    setIsConnected(true);
  };

  ws.onmessage = (event) => {
    if (!alive) return;

    const data = JSON.parse(event.data);
    console.log("📥 WS message", data);

    if (data.type === "permission") {
      setRole(data.role);
      editorRef.current?.updateOptions({
        readOnly: data.role !== "owner",
      });
      return;
    }

    if (data.type === "sync") {
      Y.applyUpdate(ydoc, new Uint8Array(data.update));

      // Mark that sync is ready
      pendingInitialSyncRef.current = true;

      // Try applying immediately (if editor already exists)
      const editor = editorRef.current;
      const model = editor?.getModel();
      const ytext = ytextRef.current;

      if (editor && model && ytext) {
        applyingRemoteRef.current = true;
        model.setValue(ytext.toString());
        applyingRemoteRef.current = false;
        pendingInitialSyncRef.current = false;
      }

      return;
    }

    if (data.type === "update") {
      Y.applyUpdate(ydoc, new Uint8Array(data.update));
    }
  };

  ws.onclose = () => {
    if (!alive) return;
    console.log("🔴 WS closed");
    setIsConnected(false);
  };

  // Yjs → Monaco
  const observer = (event: any) => {
    if (applyingRemoteRef.current) return;

    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model) return;

    applyingRemoteRef.current = true;

    let index = 0;
    event.delta.forEach((d: any) => {
      if (d.retain) index += d.retain;

      if (d.delete) {
        const start = model.getPositionAt(index);
        const end = model.getPositionAt(index + d.delete);
        model.applyEdits([
          {
            range: {
              startLineNumber: start.lineNumber,
              startColumn: start.column,
              endLineNumber: end.lineNumber,
              endColumn: end.column,
            },
            text: "",
          },
        ]);
      }

      if (d.insert) {
        const pos = model.getPositionAt(index);
        model.applyEdits([
          {
            range: {
              startLineNumber: pos.lineNumber,
              startColumn: pos.column,
              endLineNumber: pos.lineNumber,
              endColumn: pos.column,
            },
            text: d.insert,
          },
        ]);
        index += d.insert.length;
      }
    });

    applyingRemoteRef.current = false;
  };

  ytext.observe(observer);

  return () => {
    alive = false; // ✅ this is the ONLY guard you need
    ytext.unobserve(observer);
    ws.close();
    ydoc.destroy();
  };
}, []);
useEffect(() => {
  if (!ydocRef.current) return;
  if (!wsRef.current) return;

  const ydoc = ydocRef.current;

  const onYjsUpdate = (update: Uint8Array, origin: any) => {
    // 🚫 Ignore remote updates
    if (origin === "remote") return;

    // 🔐 Only owner can persist
    if (role !== "owner") return;

    wsRef.current!.send(
      JSON.stringify({
        type: "update",
        update: Array.from(update),
        userId: userRef.current!.id,
      })
    );
  };

  ydoc.on("update", onYjsUpdate);

  return () => {
    ydoc.off("update", onYjsUpdate);
  };
}, [role]);
  /* ---------------------------------- */
  /* Editor mount */
  /* ---------------------------------- */

  function onEditorMount(
    editor: monaco.editor.IStandaloneCodeEditor
  ) {
    editorRef.current = editor;

    // 🔒 Respect role (no change)
    editor.updateOptions({
      readOnly: role !== "owner",
    });

    // ✅ APPLY INITIAL SYNC IF IT ALREADY ARRIVED
    if (pendingInitialSyncRef.current && ytextRef.current) {
      applyingRemoteRef.current = true;
      editor.getModel()?.setValue(
        ytextRef.current.toString()
      );
      applyingRemoteRef.current = false;
      pendingInitialSyncRef.current = false;
    }

    // ✅ Local edits → Yjs (no change)
    editor.onDidChangeModelContent((e) => {
      if (applyingRemoteRef.current) return;
      if (role !== "owner") return;

      const model = editor.getModel();
      const ytext = ytextRef.current;
      if (!model || !ytext) return;

      e.changes.forEach((c) => {
        const index = model.getOffsetAt({
          lineNumber: c.range.startLineNumber,
          column: c.range.startColumn,
        });

        if (c.rangeLength > 0) {
          ytext.delete(index, c.rangeLength);
        }

        if (c.text) {
          ytext.insert(index, c.text);
        }
      });
    });
  }

  /* ---------------------------------- */
  /* Room join */
  /* ---------------------------------- */

  function joinRoom(roomId: string) {
    if (!wsRef.current || !userRef.current) return;
    if (joinedRoomRef.current) return;

    joinedRoomRef.current = roomId;

    wsRef.current.send(
      JSON.stringify({
        type: "join",
        roomId,
        userId: userRef.current.id,
      })
    );
  }

  /* ---------------------------------- */
  /* Undo / Redo (CLIENT SIDE ✅) */
  /* ---------------------------------- */

  function undo() {
    if (role !== "owner") return;
    undoManagerRef.current?.undo();
  }

  function redo() {
    if (role !== "owner") return;
    undoManagerRef.current?.redo();
  }

  return {
    onEditorMount,
    joinRoom,
    undo,
    redo,
    role,
    isConnected,
  };
}
