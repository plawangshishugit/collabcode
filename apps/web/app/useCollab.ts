"use client";

import * as Y from "yjs";
import { useEffect, useRef } from "react";
import type * as monaco from "monaco-editor";

type YTextDelta = {
  insert?: string | object;
  delete?: number;
  retain?: number;
  attributes?: Record<string, any>;
};

const user = {
  id: Math.random().toString(36).slice(2),
  name: "User " + Math.floor(Math.random() * 100),
  color: `hsl(${Math.random() * 360}, 70%, 60%)`,
};

const awarenessRef = useRef<Map<string, any>>(new Map());
const decorationsRef =
  useRef<monaco.editor.IEditorDecorationsCollection | null>(null);

export function useCollab() {
  const ydocRef = useRef<Y.Doc | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const applyingRemoteRef = useRef(false);

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

    /**
     * Apply Yjs → Monaco (delta-based)
     */
    ytext.observe((event) => {
      const editor = editorRef.current;
      if (!editor) return;

      applyingRemoteRef.current = true;

      const model = editor.getModel();
      if (!model) return;

      let index = 0;

      event.delta.forEach((d: YTextDelta) => {
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
    });

    ydocRef.current = ydoc;
    ytextRef.current = ytext;
    wsRef.current = ws;

    return () => {
      ws.close();
      ydoc.destroy();
    };
  }, []);

  /**
   * Monaco → Yjs
   */
  function onEditorMount(editor: monaco.editor.IStandaloneCodeEditor) {
    editorRef.current = editor;
    editor.onDidChangeCursorSelection(() => {
  const selection = editor.getSelection();
  const model = editor.getModel();
  if (!selection || !model) return;

  const start = model.getOffsetAt(selection.getStartPosition());
  const end = model.getOffsetAt(selection.getEndPosition());

  wsRef.current?.send(
    JSON.stringify({
      type: "awareness",
      user: user.id,
      payload: {
        name: user.name,
        color: user.color,
        cursor: { start, end },
      },
    })
  );
});
    editor.onDidChangeCursorSelection(() => {
    const selection = editor.getSelection();
    const model = editor.getModel();
    if (!selection || !model) return;

    const start = model.getOffsetAt(selection.getStartPosition());
    const end = model.getOffsetAt(selection.getEndPosition());

    wsRef.current?.send(
      JSON.stringify({
        type: "awareness",
        user: user.id,
        payload: {
          name: user.name,
          color: user.color,
          cursor: { start, end },
        },
      })
    );
  });
    editor.onDidChangeModelContent((e) => {
      if (applyingRemoteRef.current) return;

      const ytext = ytextRef.current;
      const model = editor.getModel();
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
    });
  }

  function undo() {
    wsRef.current?.send(JSON.stringify({ type: "undo" }));
  }

  function redo() {
    wsRef.current?.send(JSON.stringify({ type: "redo" }));
  }
function renderRemoteCursors() {
  const editor = editorRef.current;
  const decorationsCollection = decorationsRef.current;

  if (!editor || !decorationsCollection) return;

  const model = editor.getModel();
  if (!model) return;

  const decorations: monaco.editor.IModelDeltaDecoration[] = [];

  awarenessRef.current.forEach((state) => {
    const { cursor, color, name } = state;
    if (!cursor) return;

    const startPos = model.getPositionAt(cursor.start);
    const endPos = model.getPositionAt(cursor.end);

    decorations.push({
      range: {
        startLineNumber: startPos.lineNumber,
        startColumn: startPos.column,
        endLineNumber: endPos.lineNumber,
        endColumn: endPos.column,
      },
      options: {
        className: "remote-selection",
        hoverMessage: { value: name },
      },
    });

    decorations.push({
      range: {
        startLineNumber: startPos.lineNumber,
        startColumn: startPos.column,
        endLineNumber: startPos.lineNumber,
        endColumn: startPos.column,
      },
      options: {
        className: "remote-cursor",
      },
    });
  });

  // ✅ modern replacement for deltaDecorations
  decorationsCollection.set(decorations);
}
  return { onEditorMount, undo, redo };
}
