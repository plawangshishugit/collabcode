import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";

type SnapshotMeta = {
  index: number;
  timestamp: number;
};

export function useSnapshots(
  ydoc: Y.Doc | null,
  socket: any,
  roomId: string
) {
  const snapshotsRef = useRef<Uint8Array[]>([]);
  const [versions, setVersions] = useState<SnapshotMeta[]>([]);
  const isRestoringRef = useRef(false);

  useEffect(() => {
    if (!ydoc) return;

    let timer: NodeJS.Timeout;

    const onUpdate = () => {
      if (isRestoringRef.current) return;

      clearTimeout(timer);

      timer = setTimeout(() => {
        const snapshot = Y.encodeStateAsUpdate(ydoc);

        snapshotsRef.current.push(snapshot);

        setVersions((prev) => [
          ...prev,
          {
            index: snapshotsRef.current.length - 1,
            timestamp: Date.now(),
          },
        ]);

        socket.emit("snapshot:created", { roomId });
        console.log("📸 Snapshot captured");
      }, 1000);
    };

    ydoc.on("update", onUpdate);

    return () => {
      ydoc.off("update", onUpdate);
      clearTimeout(timer);
    };
  }, [ydoc, socket, roomId]);

  function restoreVersion(index: number) {
    const snapshot = snapshotsRef.current[index];
    if (!snapshot) return;

    isRestoringRef.current = true;

    socket.emit("crdt:restore", {
      roomId,
      snapshot,
    });

    setTimeout(() => {
      isRestoringRef.current = false;
    }, 500);
  }

  return {
    versions,
    restoreVersion,
  };
}
