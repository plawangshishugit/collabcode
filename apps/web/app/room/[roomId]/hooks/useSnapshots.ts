import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { getCurrentUser } from "@/app/lib/auth";

type SnapshotMeta = {
  index: number;
  timestamp: number;
  userId?: string;
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

    const user = getCurrentUser();
    let timer: ReturnType<typeof setTimeout>;

    const onUpdate = () => {
      if (isRestoringRef.current) return;

      clearTimeout(timer);

      timer = setTimeout(() => {
        const snapshot = Y.encodeStateAsUpdate(ydoc);

        snapshotsRef.current.push(snapshot);

        // Optional safety cap
        if (snapshotsRef.current.length > 50) {
          snapshotsRef.current.shift();
        }

        setVersions((prev) => [
          ...prev,
          {
            index: snapshotsRef.current.length - 1,
            timestamp: Date.now(),
            userId: user?.id,
          },
        ]);

        socket.emit("crdt:snapshot", {
          roomId,
          snapshot,
          userId: user?.id,
        });

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
    if (!snapshot || !ydoc) return;

    isRestoringRef.current = true;

    // ✅ Apply locally first (CRDT-correct)
    Y.applyUpdate(ydoc, snapshot);

    // ✅ Broadcast to others
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
