import { useEffect } from "react";
import * as monaco from "monaco-editor";

function throttle(fn: () => void, limit: number) {
  let last = 0;
  return () => {
    const now = Date.now();
    if (now - last > limit) {
      last = now;
      fn();
    }
  };
}

export function useEditAnalytics(
  editor: monaco.editor.IStandaloneCodeEditor | null,
  socket: any,
  roomId: string
) {
  useEffect(() => {
    if (!editor) return;

    const emitEdit = throttle(() => {
      socket.emit("analytics:edit", { roomId });
    }, 500);

    const contentListener = editor.onDidChangeModelContent(() => {
      emitEdit();
    });

    return () => {
      contentListener.dispose();
    };
  }, [editor, socket, roomId]);
}
