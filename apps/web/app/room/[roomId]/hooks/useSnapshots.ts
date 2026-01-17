import { useEffect, useRef } from "react";
import * as Y from "yjs";

export function useSnapshots(
  ydoc: Y.Doc | null,
  socket: any,
  roomId: string
) {
  const snapshotsRef = useRef<Uint8Array[]>([]);

  useEffect(() => {
    if (!ydoc) return;

    let timer: NodeJS.Timeout;

    const updateHandler = () => {
      clearTimeout(timer);

      timer = setTimeout(() => {
        snapshotsRef.current.push(Y.encodeStateAsUpdate(ydoc));
        console.log("📸 Snapshot saved");
      }, 1000);
    };

    ydoc.on("update", updateHandler);

    return () => {
      ydoc.off("update", updateHandler);
      clearTimeout(timer);
    };
  }, [ydoc]);

  function restorePrevious() {
    if (snapshotsRef.current.length < 2) return;

    const snapshot =
      snapshotsRef.current[snapshotsRef.current.length - 2];

    socket.emit("crdt:restore", {
      roomId,
      snapshot,
    });
  }

  return {
    snapshotsRef,
    restorePrevious, //  ALWAYS PRESENT
  };
}
