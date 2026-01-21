"use client";

import * as Y from "yjs";
import { useState, useEffect, useRef } from "react";
import type * as monaco from "monaco-editor";
import { getUserIdentity } from "./lib/identity";

/* ---------------------------------- */
/* Types */
/* ---------------------------------- */

type AwarenessState = {
  name: string;
  color: string;
  cursor: { start: number; end: number };
};

type YTextDelta = {
  insert?: string | object;
  delete?: number;
  retain?: number;
  attributes?: Record<string, any>;
};

/* ---------------------------------- */
/* Main hook */
/* ---------------------------------- */

export function useCollab() {
  /* ---------- Identity ---------- */
  const userRef = useRef<ReturnType<typeof getUserIdentity> | null>(null);
  if (!userRef.current && typeof window !== "undefined") {
    userRef.current = getUserIdentity();
  }

  /* ---------- Role ---------- */
  const roleRef = useRef<"owner" | "viewer">("viewer");
  const [role, setRole] = useState<"owner" | "viewer">("viewer");

  /* ---------- Core ---------- */
  const ydocRef = useRef<Y.Doc | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  /* ---------- Monaco ---------- */
  const editorRef =
    useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef =
    useRef<monaco.editor.IEditorDecorationsCollection | null>(null);

  /* ---------- Awareness / rooms ---------- */
  const awarenessRef =
    useRef<Map<string, AwarenessState>>(new Map());
  const joinedRoomRef = useRef<string | null>(null);

  /* ---------- Sync guards ---------- */
  const applyingRemoteRef = useRef(false);

  /* ---------- WebSocket queue ---------- */
  const pendingMessagesRef = useRef<string[]>([]);
  const socketReadyRef = useRef(false);

  /* ---------------------------------- */
  /* Safe send (ONLY way to send WS msgs) */
  /* ---------------------------------- */

  function safeSend(message: object) {
    const ws = wsRef.current;
    const payload = JSON.stringify(message);

    if (!ws || !socketReadyRef.current) {
      pendingMessagesRef.current.push(payload);
      return;
    }

    ws.send(payload);
  }

  /* ---------------------------------- */
  /* WebSocket + Yjs setup */
  /* ---------------------------------- */

  useEffect(() => {
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText("editor");
    const ws = new WebSocket("ws://localhost:3001");

    ws.onopen = () => {
      socketReadyRef.current = true;

      // flush queued messages
      pendingMessagesRef.current.forEach((msg) => ws.send(msg));
      pendingMessagesRef.current = [];
    };

    ws.onclose = () => {
      socketReadyRef.current = false;
    };

    ws.onerror = () => {
      socketReadyRef.current = false;
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "sync" || data.type === "update") {
        Y.applyUpdate(ydoc, new Uint8Array(data.update));
      }

      if (data.type === "permission") {
        roleRef.current = data.role;
        setRole(data.role);
      }

      if (data.type === "awareness") {
        awarenessRef.current.set(data.user, data.payload);
        renderRemoteCursors();
      }
    };

    // Yjs → server (persisted)
    ydoc.on("update", (update) => {
      safeSend({
        type: "update",
        update: Array.from(update),
      });
    });

    // Yjs → Monaco
    ytext.observe((event) => applyYjsToMonaco(event.delta));

    ydocRef.current = ydoc;
    ytextRef.current = ytext;
    wsRef.current = ws;

    return () => {
      decorationsRef.current?.clear();
      ws.close();
      ydoc.destroy();
    };
  }, []);

  /* ---------------------------------- */
  /* Monaco → Yjs */
  /* ---------------------------------- */

  function onEditorMount(
    editor: monaco.editor.IStandaloneCodeEditor
  ) {
    editorRef.current = editor;
    decorationsRef.current =
      editor.createDecorationsCollection();

    editor.onDidChangeModelContent(handleEditorChange);
    editor.onDidChangeCursorSelection(sendCursorAwareness);
  }

  function handleEditorChange(
    e: monaco.editor.IModelContentChangedEvent
  ) {
    if (applyingRemoteRef.current) return;
    if (roleRef.current === "viewer") return;

    const ytext = ytextRef.current;
    const model = editorRef.current?.getModel();
    if (!ytext || !model) return;

    e.changes.forEach((change) => {
      const start = model.getOffsetAt({
        lineNumber: change.range.startLineNumber,
        column: change.range.startColumn,
      });

      if (change.rangeLength > 0) {
        ytext.delete(start, change.rangeLength);
      }

      if (change.text.length > 0) {
        ytext.insert(start, change.text);
      }
    });
  }

  /* ---------------------------------- */
  /* Yjs → Monaco */
  /* ---------------------------------- */

  function applyYjsToMonaco(delta: YTextDelta[]) {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model) return;

    applyingRemoteRef.current = true;
    let index = 0;

    delta.forEach((d) => {
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

      if (typeof d.insert === "string") {
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
  }

  /* ---------------------------------- */
  /* Awareness */
  /* ---------------------------------- */

  function sendCursorAwareness() {
    const editor = editorRef.current;
    const model = editor?.getModel();
    const selection = editor?.getSelection();
    if (!editor || !model || !selection) return;

    const identity = userRef.current;
    if (!identity) return;

    safeSend({
      type: "awareness",
      user: identity.id,
      payload: {
        name: identity.name,
        color: identity.color,
        cursor: {
          start: model.getOffsetAt(selection.getStartPosition()),
          end: model.getOffsetAt(selection.getEndPosition()),
        },
      },
    });
  }

  function renderRemoteCursors() {
    const editor = editorRef.current;
    const decorations = decorationsRef.current;
    if (!editor || !decorations) return;

    const model = editor.getModel();
    if (!model) return;

    const next: monaco.editor.IModelDeltaDecoration[] = [];

    awarenessRef.current.forEach(({ cursor, name }) => {
      const start = model.getPositionAt(cursor.start);
      const end = model.getPositionAt(cursor.end);

      next.push({
        range: {
          startLineNumber: start.lineNumber,
          startColumn: start.column,
          endLineNumber: end.lineNumber,
          endColumn: end.column,
        },
        options: {
          className: "remote-selection",
          hoverMessage: { value: name },
        },
      });
    });

    decorations.set(next);
  }

  /* ---------------------------------- */
  /* Rooms & undo */
  /* ---------------------------------- */

  function joinRoom(
    roomId: string,
    mode: "edit" | "read" = "edit"
  ) {
    if (joinedRoomRef.current === roomId) return;
    if (!userRef.current) return;

    joinedRoomRef.current = roomId;

    safeSend({
      type: "join",
      roomId,
      userId: userRef.current.id,
      mode,
    });
  }

  function undo() {
    if (roleRef.current === "viewer") return;
    if (!userRef.current) return;

    safeSend({
      type: "undo",
      userId: userRef.current.id,
    });
  }

  function redo() {
    if (roleRef.current === "viewer") return;
    if (!userRef.current) return;

    safeSend({
      type: "redo",
      userId: userRef.current.id,
    });
  }

  return { onEditorMount, undo, redo, joinRoom, role };
}
