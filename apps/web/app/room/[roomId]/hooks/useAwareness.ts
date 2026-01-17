import { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";

function randomColor() {
  const colors = [
    "#e6194b",
    "#3cb44b",
    "#ffe119",
    "#4363d8",
    "#f58231",
    "#911eb4",
    "#46f0f0",
    "#f032e6",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function useAwareness(
  editor: monaco.editor.IStandaloneCodeEditor | null,
  awareness: any
) {
  const decorationsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!editor || !awareness) return;

    // set local user once
    awareness.setLocalState({
      user: {
        name: `User-${Math.floor(Math.random() * 1000)}`,
        color: randomColor(),
      },
    });

    // broadcast cursor
    const cursorListener = editor.onDidChangeCursorPosition((e) => {
      awareness.setLocalStateField("cursor", {
        lineNumber: e.position.lineNumber,
        column: e.position.column,
      });
    });

    // render remote cursors
    const awarenessListener = () => {
      const states = Array.from(awareness.getStates().values());

      const decorations = states.flatMap((state: any) => {
        if (!state.cursor) return [];

        return [
          {
            range: new monaco.Range(
              state.cursor.lineNumber,
              state.cursor.column,
              state.cursor.lineNumber,
              state.cursor.column
            ),
            options: { className: "remote-cursor" },
          },
        ];
      });

      decorationsRef.current = editor.deltaDecorations(
        decorationsRef.current,
        decorations
      );
    };

    awareness.on("change", awarenessListener);

    return () => {
      cursorListener.dispose();
      awareness.off("change", awarenessListener);
    };
  }, [editor, awareness]);
}
