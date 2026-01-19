import { useEffect, useRef } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { getCurrentUser } from "@/app/lib/auth";

export function useYjsProvider(roomId: string) {
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);

  // ✅ Create Yjs ONCE per room
  useEffect(() => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const provider = new WebsocketProvider(
      "ws://localhost:1234",
      roomId,
      ydoc
    );
    providerRef.current = provider;

    provider.on("status", (e: { status: "connected" | "disconnected" }) => {
      console.log("PROVIDER STATUS:", e.status);
    });

    // ✅ Bind text
    const ytext = ydoc.getText("monaco");
    ytextRef.current = ytext;

    if (ytext.length === 0) {
      ytext.insert(0, "// Start coding...\n");
    }

    // ✅ Bind authenticated user to awareness
    const user = getCurrentUser();

    provider.awareness.setLocalState({
      user: {
        id: user?.id,
        name: user?.name || user?.email || "Anonymous",
        color: user?.id
          ? `#${user.id.slice(0, 6)}`
          : "#888888",
      },
    });

    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [roomId]);

  // ✅ CORRECT time-travel: apply update, do NOT recreate doc
  function restoreFromSnapshot(snapshot: Uint8Array) {
    if (!ydocRef.current) return;

    console.log("⏪ Restoring CRDT snapshot");
    Y.applyUpdate(ydocRef.current, snapshot);
  }

  return {
    ydocRef,
    providerRef,
    ytextRef,
    restoreFromSnapshot,
  };
}
