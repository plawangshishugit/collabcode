"use client";

import { useRef } from "react";
import { useParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import type * as monaco from "monaco-editor";

import { useCodeSync } from "./useCodeSync";
import { useCursorTracking } from "./useCursorTracking";

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();

  const editorRef =
    useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const monacoRef = useRef<typeof monaco | null>(null);

  const { code, onCodeChange } = useCodeSync(roomId);
  const { bindCursorEvents } = useCursorTracking(
    roomId,
    editorRef,
    monacoRef
  );

  function handleEditorMount(
    editor: monaco.editor.IStandaloneCodeEditor,
    monacoInstance: typeof monaco
  ) {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;

    bindCursorEvents(editor);
  }

  return (
    <main className="h-screen">
      <Editor
        height="100%"
        language="javascript"
        theme="vs-dark"
        value={code}
        onChange={onCodeChange}
        onMount={handleEditorMount}
      />
    </main>
  );
}
