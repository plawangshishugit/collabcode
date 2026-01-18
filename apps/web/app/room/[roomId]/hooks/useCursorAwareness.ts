import { useEffect } from "react";
import * as monaco from "monaco-editor";

export function useCursorAwareness(
  editor: monaco.editor.IStandaloneCodeEditor | null,
  awareness: any
) {
  useEffect(() => {
    if (!editor || !awareness) return;

    const cursorListener = editor.onDidChangeCursorPosition(
      (e: monaco.editor.ICursorPositionChangedEvent) => {
        awareness.setLocalStateField("cursor", e.position);
      }
    );

    return () => {
      cursorListener.dispose();
    };
  }, [editor, awareness]);
}
