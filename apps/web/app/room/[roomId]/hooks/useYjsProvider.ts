import { useEffect, useRef } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export function useYjsProvider(roomId: string) {
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);

  // 🔁 Create Yjs document + provider ONCE per room
  useEffect(() => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const provider = new WebsocketProvider(
      "ws://localhost:1234",
      roomId,
      ydoc
    );
    providerRef.current = provider;

    provider.on(
      "status",
      (e: { status: "connected" | "disconnected" }) => {
        console.log("🟢 Yjs provider:", e.status);
      }
    );

    // 🧠 Shared text
    const ytext = ydoc.getText("monaco");
    ytextRef.current = ytext;

    // Optional initial content (only once)
    if (ytext.length === 0) {
      ytext.insert(0, "// Start coding...\n");
    }

    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [roomId]);

  // ⏪ Shared time travel (apply snapshot safely)
  function restoreFromSnapshot(snapshot: Uint8Array) {
    if (!ydocRef.current) return;

    console.log("⏪ Applying CRDT snapshot");
    Y.applyUpdate(ydocRef.current, snapshot);
  }

  return {
    ydocRef,
    providerRef,
    ytextRef,
    restoreFromSnapshot,
  };
}
