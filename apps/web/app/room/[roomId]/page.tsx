"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

export default function RoomPage() {
  const { roomId } = useParams();
  const [code, setCode] = useState("// Start coding...\n");

  useEffect(() => {
    socket.emit("room:join", { roomId });

    socket.on("code:update", ({ code }) => {
      setCode(code);
    });

    return () => {
      socket.off("code:update");
    };
  }, [roomId]);

  function handleChange(value?: string) {
    if (value === undefined) return;
    setCode(value);
    socket.emit("code:change", { roomId, code: value });
  }

  return (
    <main className="h-screen">
      <Editor
        height="100%"
        language="javascript"
        value={code}
        onChange={handleChange}
        theme="vs-dark"
      />
    </main>
  );
}
