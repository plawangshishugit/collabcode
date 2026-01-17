import { useEffect, useState } from "react";
import { getRoomSocket } from "./useRoomSocket";

export function useCodeSync(roomId: string) {
  const socket = getRoomSocket();
  const [code, setCode] = useState("// Start coding...\n");

  useEffect(() => {
    if (!roomId) return;

    socket.emit("room:join", { roomId });

    socket.on("code:update", ({ code }) => {
      setCode(code);
    });

    return () => {
      socket.off("code:update");
    };
  }, [roomId, socket]);

  function onCodeChange(value?: string) {
    if (!value) return;
    setCode(value);
    socket.emit("code:change", { roomId, code: value });
  }

  return { code, onCodeChange };
}
