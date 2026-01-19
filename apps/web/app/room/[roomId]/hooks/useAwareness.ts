import { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import { injectCursorStyle } from "../utils/injectCursorStyle";

export type AwarenessUser = {
  id: string;
  name: string;
  color: string;
};

export function useAwareness(
  editor: monaco.editor.IStandaloneCodeEditor | null,
  awareness: any,
  identity: AwarenessUser | null
) {
  const decorationsRef =
    useRef<monaco.editor.IEditorDecorationsCollection | null>(
      null
    );

  const initializedRef = useRef(false);

  useEffect(() => {
    if (!editor || !awareness || !identity) return;

    // 🧱 Create decorations collection ONCE per editor
    if (!decorationsRef.current) {
      decorationsRef.current =
        editor.createDecorationsCollection();
    }

    // 👤 One-time local identity publish
    if (!initializedRef.current) {
      injectCursorStyle(identity.id, identity.color);
      awareness.setLocalStateField("user", identity);
      initializedRef.current = true;
    }

    // 📍 Broadcast local cursor position
    const cursorListener =
      editor.onDidChangeCursorPosition(
        (
          e: monaco.editor.ICursorPositionChangedEvent
        ) => {
          awareness.setLocalStateField(
            "cursor",
            e.position
          );
        }
      );

    // 🎯 Render remote cursors
    const renderRemoteCursors = () => {
      const states = Array.from(
        awareness.getStates().values()
      );

      const decorations: monaco.editor.IModelDeltaDecoration[] =
        states
          .filter(
            (s: any) =>
              s.user &&
              s.cursor &&
              s.user.id !== identity.id
          )
          .map((s: any) => {
            injectCursorStyle(
              s.user.id,
              s.user.color
            );

            return {
              range: new monaco.Range(
                s.cursor.lineNumber,
                s.cursor.column,
                s.cursor.lineNumber,
                s.cursor.column
              ),
              options: {
                className: `remote-cursor cursor-${s.user.id}`,
                after: {
                  content: ` ${s.user.name}`,
                  inlineClassName:
                    "remote-cursor-label",
                },
                overviewRuler: {
                  color: s.user.color,
                  position:
                    monaco.editor
                      .OverviewRulerLane.Right,
                },
              },
            };
          });

      decorationsRef.current?.set(decorations);
    };

    awareness.on("change", renderRemoteCursors);
    renderRemoteCursors();

    return () => {
      cursorListener.dispose();
      awareness.off("change", renderRemoteCursors);

      decorationsRef.current?.clear();
      decorationsRef.current = null;
      initializedRef.current = false;
    };
  }, [editor, awareness, identity]);
}
