import { useEffect, useRef } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export function useYjsProvider(roomId: string) {
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);

  // Shared time travel entry point
  function createYjs(snapshot?: Uint8Array) {
    // Cleanup old instances
    providerRef.current?.destroy();
    ydocRef.current?.destroy();

    const ydoc = new Y.Doc();

    if (snapshot) {
      Y.applyUpdate(ydoc, snapshot);
    }

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

    const ytext = ydoc.getText("monaco");
    ytextRef.current = ytext;

    if (ytext.length === 0) {
      ytext.insert(0, "// Start coding...\n");
    }
  }

  // Initial creation
  useEffect(() => {
    createYjs();

    return () => {
      providerRef.current?.destroy();
      ydocRef.current?.destroy();
    };
  }, [roomId]);

  // Shared time travel entry point
  function restoreFromSnapshot(snapshot: Uint8Array) {
    console.log(" Restoring CRDT snapshot");
    createYjs(snapshot);
  }

  return {
    ydocRef,
    providerRef,
    ytextRef,
    restoreFromSnapshot, 
  };
}
