import { useEffect, useRef } from "react";
import type * as monaco from "monaco-editor";
import { getUserIdentity } from "../utils/userIdentity";

export function useAwareness(
  editor: monaco.editor.IStandaloneCodeEditor | null,
  awareness: any
) {
  const decorationsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!editor || !awareness) return;

    const monacoInstance = editor.getModel()?.getLanguageId();
    const identity = getUserIdentity();

    // Set local user state ONCE
    awareness.setLocalState({
      user: identity,
    });

    const onChange = () => {
      const states = Array.from(awareness.getStates().values());

      const decorations = states
        .filter(
          (s: any) =>
            s.user &&
            s.user.id !== identity.id &&
            s.cursor
        )
        .map((s: any) => ({
          range: new (editor as any).constructor.Range(
            s.cursor.lineNumber,
            s.cursor.column,
            s.cursor.lineNumber,
            s.cursor.column
          ),
          options: {
            className: "remote-cursor",
            inlineClassName: `cursor-${s.user.id}`,
          },
        }));

      decorationsRef.current = editor.deltaDecorations(
        decorationsRef.current,
        decorations
      );
    };

    awareness.on("change", onChange);

    return () => {
      awareness.off("change", onChange);
    };
  }, [editor, awareness]);
}
