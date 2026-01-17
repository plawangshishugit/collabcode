"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import { io } from "socket.io-client";
import type * as monaco from "monaco-editor";

const socket = io("http://localhost:4000");

function throttle(fn: Function, limit: number) {
  let lastCall = 0;
  return (...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [code, setCode] = useState("// Start coding...\n");

  const editorRef =
    useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const monacoRef = useRef<typeof monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!roomId) return;

    socket.emit("room:join", { roomId });

    socket.on("code:update", ({ code }) => {
      setCode(code);
    });

    socket.on("cursor:update", ({ cursor }) => {
      if (!editorRef.current || !monacoRef.current) return;

      const decorations =
        editorRef.current.deltaDecorations(
          decorationsRef.current,
          [
            {
              range: new monacoRef.current.Range(
                cursor.lineNumber,
                cursor.column,
                cursor.lineNumber,
                cursor.column
              ),
              options: {
                className: "remote-cursor",
                stickiness:
                  monacoRef.current.editor
                    .TrackedRangeStickiness
                    .NeverGrowsWhenTypingAtEdges,
              },
            },
          ]
        );

      decorationsRef.current = decorations;
    });

    return () => {
      socket.off("code:update");
      socket.off("cursor:update");
    };
  }, [roomId]);

  function handleChange(value?: string) {
    if (value === undefined) return;
    setCode(value);
    socket.emit("code:change", { roomId, code: value });
  }

  function handleEditorMount(
    editor: monaco.editor.IStandaloneCodeEditor,
    monacoInstance: typeof monaco
  ) {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;

    const throttledCursorEmit = throttle(
      (position: monaco.Position) => {
        socket.emit("cursor:move", {
          roomId,
          cursor: position,
        });
      },
      50
    );

    editor.onDidChangeCursorPosition((e) => {
      throttledCursorEmit(e.position);
    });
  }

  return (
    <main className="h-screen">
      <Editor
        height="100%"
        language="javascript"
        value={code}
        onChange={handleChange}
        onMount={handleEditorMount}
        theme="vs-dark"
      />
    </main>
  );
}
