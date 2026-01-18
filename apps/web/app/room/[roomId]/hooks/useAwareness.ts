import { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import { getUserIdentity } from "../utils/userIdentity";

export function useAwareness(
  editor: monaco.editor.IStandaloneCodeEditor | null,
  awareness: any
) {
  const decorationsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!editor || !awareness) return;

    const identity = getUserIdentity();

    // Set local user identity once
    awareness.setLocalState({
      user: identity,
    });

    const onAwarenessChange = () => {
      const states = Array.from(awareness.getStates().values());

      const decorations = states
        .filter(
          (s: any) =>
            s.user &&
            s.cursor &&
            s.user.id !== identity.id
        )
        .map((s: any) => ({
          range: new monaco.Range(
            s.cursor.lineNumber,
            s.cursor.column,
            s.cursor.lineNumber,
            s.cursor.column
          ),
          options: {
            className: "remote-cursor",
            inlineClassName: "remote-cursor-line",
          },
        }));

      decorationsRef.current = editor.deltaDecorations(
        decorationsRef.current,
        decorations
      );
    };

    awareness.on("change", onAwarenessChange);

    return () => {
      awareness.off("change", onAwarenessChange);
    };
  }, [editor, awareness]);
}
