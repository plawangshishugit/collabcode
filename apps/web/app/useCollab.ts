"use client";

import * as Y from "yjs";
import { useEffect, useRef } from "react";
import type * as monaco from "monaco-editor";

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
/* User identity (stable per tab) */
/* ---------------------------------- */

const user = {
  id: Math.random().toString(36).slice(2),
  name: "User " + Math.floor(Math.random() * 100),
  color: `hsl(${Math.random() * 360}, 70%, 60%)`,
};

/* ---------------------------------- */
/* Main hook */
/* ---------------------------------- */

export function useCollab() {
  /* ---------- Core refs ---------- */
  const ydocRef = useRef<Y.Doc | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  /* ---------- Monaco refs ---------- */
  const editorRef =
    useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef =
    useRef<monaco.editor.IEditorDecorationsCollection | null>(null);

  /* ---------- Awareness & rooms ---------- */
  const awarenessRef =
    useRef<Map<string, AwarenessState>>(new Map());
  const joinedRoomRef = useRef<string | null>(null);

  /* ---------- Sync guards ---------- */
  const applyingRemoteRef = useRef(false);

  /* ---------------------------------- */
  /* WebSocket + Yjs setup */
  /* ---------------------------------- */

  useEffect(() => {
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText("editor");
    const ws = new WebSocket("ws://localhost:3001");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "sync" || data.type === "update") {
        Y.applyUpdate(ydoc, new Uint8Array(data.update));
      }

      if (data.type === "awareness") {
        awarenessRef.current.set(data.user, data.payload);
        renderRemoteCursors();
      }
    };

    ydoc.on("update", (update) => {
      ws.send(
        JSON.stringify({
          type: "update",
          update: Array.from(update),
        })
      );
    });

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

    wsRef.current?.send(
      JSON.stringify({
        type: "awareness",
        user: user.id,
        payload: {
          name: user.name,
          color: user.color,
          cursor: {
            start: model.getOffsetAt(
              selection.getStartPosition()
            ),
            end: model.getOffsetAt(
              selection.getEndPosition()
            ),
          },
        },
      })
    );
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

  function joinRoom(roomId: string) {
    if (joinedRoomRef.current === roomId) return;
    if (!wsRef.current) return;

    joinedRoomRef.current = roomId;
    wsRef.current.send(JSON.stringify({ type: "join", roomId }));
  }

  function undo() {
    wsRef.current?.send(JSON.stringify({ type: "undo" }));
  }

  function redo() {
    wsRef.current?.send(JSON.stringify({ type: "redo" }));
  }

  return { onEditorMount, undo, redo, joinRoom };
}
