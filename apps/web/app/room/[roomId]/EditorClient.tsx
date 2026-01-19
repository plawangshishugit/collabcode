"use client";

import { useCollabSession } from "./hooks/useCollabSession";
import EditorShell from "./EditorShell";

export default function EditorClient({ roomId }: { roomId: string }) {
  const {
    editor,
    setEditor,
    user,
    users,
    versions,
    restoreVersion,
    run,
    output,
    error,
    running,
  } = useCollabSession(roomId);

  return (
    <EditorShell
      roomId={roomId}
      editor={editor}
      setEditor={setEditor}
      userName={user.name}
      users={users}
      versions={versions}
      canRun={!running}
      canUndo={versions.length >= 2}
      onRun={() => run(editor?.getValue() || "")}
      onUndo={() => {
        const idx = versions.length - 2;
        if (idx >= 0) restoreVersion(idx);
      }}
      output={output}
      error={error}
    />
  );
}
