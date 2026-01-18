import * as monaco from "monaco-editor";
import * as Y from "yjs";

import { useCrdtBinding } from "./useCrdtBinding";
import { useCursorAwareness } from "./useCursorAwareness";
import { useEditAnalytics } from "./useEditAnalytics";

export function useMonacoBinding(
  editor: monaco.editor.IStandaloneCodeEditor | null,
  ytext: Y.Text | null,
  awareness: any,
  socket: any,
  roomId: string
) {
  useCrdtBinding(editor, ytext, awareness);
  useCursorAwareness(editor, awareness);
  useEditAnalytics(editor, socket, roomId);
}
