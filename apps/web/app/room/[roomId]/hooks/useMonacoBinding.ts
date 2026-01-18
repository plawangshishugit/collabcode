import { useEffect } from "react";
import { MonacoBinding } from "y-monaco";
import * as monaco from "monaco-editor";
import * as Y from "yjs";

export function useMonacoBinding(
  editor: monaco.editor.IStandaloneCodeEditor | null,
  ytext: Y.Text | null,
  awareness: any
) {
  useEffect(() => {
    if (!editor || !ytext || !awareness) return;

    // 1️⃣ Bind CRDT text <-> Monaco
    const binding = new MonacoBinding(
      ytext,
      editor.getModel()!,
      new Set([editor]),
      awareness
    );

    // 2️⃣ Broadcast cursor position via awareness
    const cursorListener = editor.onDidChangeCursorPosition(
      (e: monaco.editor.ICursorPositionChangedEvent) => {
        awareness.setLocalStateField("cursor", e.position);
      }
    );

    return () => {
      cursorListener.dispose(); // cleanup cursor listener
      binding.destroy?.();      // cleanup CRDT binding
    };
  }, [editor, ytext, awareness]);
}
