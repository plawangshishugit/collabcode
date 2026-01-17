import { useEffect, useRef } from "react";
import type * as monaco from "monaco-editor";
import { getRoomSocket } from "./useRoomSocket";

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

export function useCursorTracking(
  roomId: string,
  editorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>,
  monacoRef: React.MutableRefObject<typeof monaco | null>
) {
  const socket = getRoomSocket();
  const decorationsRef = useRef<string[]>([]);

  useEffect(() => {
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
      socket.off("cursor:update");
    };
  }, [roomId, socket, editorRef, monacoRef]);

  function bindCursorEvents(
    editor: monaco.editor.IStandaloneCodeEditor
  ) {
    const throttledEmit = throttle(
      (position: monaco.Position) => {
        socket.emit("cursor:move", {
          roomId,
          cursor: position,
        });
      },
      50
    );

    editor.onDidChangeCursorPosition((e) => {
      throttledEmit(e.position);
    });
  }

  return { bindCursorEvents };
}
