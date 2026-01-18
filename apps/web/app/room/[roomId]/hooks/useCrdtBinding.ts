import { useEffect } from "react";
import { MonacoBinding } from "y-monaco";
import * as monaco from "monaco-editor";
import * as Y from "yjs";

export function useCrdtBinding(
  editor: monaco.editor.IStandaloneCodeEditor | null,
  ytext: Y.Text | null,
  awareness: any
) {
  useEffect(() => {
    if (!editor || !ytext || !awareness) return;

    const binding = new MonacoBinding(
      ytext,
      editor.getModel()!,
      new Set([editor]),
      awareness
    );

    return () => {
      binding.destroy?.();
    };
  }, [editor, ytext, awareness]);
}
