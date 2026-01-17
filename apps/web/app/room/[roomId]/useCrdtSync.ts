import { useEffect, useRef } from "react";
import type * as monaco from "monaco-editor";
import { getRoomSocket } from "./useRoomSocket";

export function useCrdtSync(roomId: string) {
  const socket = getRoomSocket();

  const ydocRef = useRef<any>(null);
  const ytextRef = useRef<any>(null);
  const awarenessRef = useRef<any>(null);

  useEffect(() => {
    if (!roomId) return;

    let Y: any;
    let ydoc: any;

    (async () => {
      // Client-only imports (CRITICAL)
      Y = await import("yjs");

      ydoc = new Y.Doc();
      ydocRef.current = ydoc;

      const ytext = ydoc.getText("monaco");
      ytextRef.current = ytext;

      socket.emit("room:join", { roomId });

      socket.on("crdt:init", (state: Uint8Array) => {
        Y.applyUpdate(ydoc, state);
      });

      socket.on("crdt:update", (update: Uint8Array) => {
        Y.applyUpdate(ydoc, update);
      });

      ydoc.on("update", (update: Uint8Array) => {
        socket.emit("crdt:update", { roomId, update });
      });
    })();

    return () => {
      socket.off("crdt:init");
      socket.off("crdt:update");
      ydoc?.destroy();
    };
  }, [roomId, socket]);

  async function bindEditor(
    editor: monaco.editor.IStandaloneCodeEditor
  ) {
    if (!ydocRef.current || !ytextRef.current) return;

    // Client-only imports
    const [{ MonacoBinding }, { Awareness }] =
      await Promise.all([
        import("y-monaco"),
        import("y-protocols/awareness"),
      ]);

    const awareness = new Awareness(ydocRef.current);
    awarenessRef.current = awareness;

    new MonacoBinding(
      ytextRef.current,
      editor.getModel()!,
      new Set([editor]),
      awareness
    );
  }

  return { bindEditor };
}
