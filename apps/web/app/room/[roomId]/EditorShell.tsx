"use client";

import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";

import VersionHistory from "./components/VersionHistory";
import OutputPanel from "./components/OutputPanel";
import EditorToolbar from "./components/EditorToolbar";

type Props = {
  roomId: string;
  editor: monaco.editor.IStandaloneCodeEditor | null;
  setEditor: (e: monaco.editor.IStandaloneCodeEditor) => void;
  userName: string;
  users: any[];
  versions: any[];
  canRun: boolean;
  canUndo: boolean;
  onRun: () => void;
  onUndo: () => void;
  output: string[];
  error: string | null;
};

export default function EditorShell({
  roomId,
  editor,
  setEditor,
  userName,
  users,
  versions,
  canRun,
  canUndo,
  onRun,
  onUndo,
  output,
  error,
}: Props) {
  return (
    <div className="flex h-screen">
      <div className="flex flex-col flex-1 relative">
        <EditorToolbar
          roomId={roomId}
          userName={userName}
          users={users}
          canRun={canRun}
          canUndo={canUndo}
          onRun={onRun}
          onUndo={onUndo}
        />

        <div className="flex-1">
          <Editor
            height="100%"
            language="javascript"
            theme="vs-dark"
            onMount={(ed) => setEditor(ed)}
          />
        </div>

        <OutputPanel
          output={output}
          error={error}
        />
      </div>

      <VersionHistory
        versions={versions}
        onRestore={onUndo}
      />
    </div>
  );
}
