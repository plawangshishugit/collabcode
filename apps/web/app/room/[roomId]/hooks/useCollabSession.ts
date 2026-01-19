"use client";

import { useState, useMemo, useEffect } from "react";
import * as monaco from "monaco-editor";
import { io, Socket } from "socket.io-client";

import { getOrCreateUser } from "@/app/lib/user";
import { toAwarenessUser } from "../utils/toAwarenessUser";

import { useYjsProvider } from "./useYjsProvider";
import { useMonacoBinding } from "./useMonacoBinding";
import { useAwareness } from "./useAwareness";
import { useSnapshots } from "./useSnapshots";
import { useCodeRunner } from "./useCodeRunner";

export function useCollabSession(roomId: string) {
  /* ─────────────────────────────────────────────
     Editor instance
  ───────────────────────────────────────────── */
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  /* ─────────────────────────────────────────────
     User identity (stable)
  ───────────────────────────────────────────── */
  const user = useMemo(() => getOrCreateUser(), []);
  const awarenessUser = useMemo(
    () => toAwarenessUser(user),
    [user]
  );

  /* ─────────────────────────────────────────────
     Socket (single instance)
  ───────────────────────────────────────────── */
  const socket = useMemo<Socket>(
    () => io("http://localhost:4000"),
    []
  );

  useEffect(() => {
    socket.emit("room:join", { roomId });

    return () => {
      socket.disconnect();
    };
  }, [socket, roomId]);

  /* ─────────────────────────────────────────────
     Yjs / CRDT
  ───────────────────────────────────────────── */
  const { ydocRef, providerRef, ytextRef } =
    useYjsProvider(roomId);

  /* ─────────────────────────────────────────────
     Monaco ↔ Yjs binding
  ───────────────────────────────────────────── */
  useMonacoBinding(
    editor,
    ytextRef.current,
    providerRef.current?.awareness,
    socket,
    roomId
  );

  /* ─────────────────────────────────────────────
     Awareness (cursors + presence)
  ───────────────────────────────────────────── */
  useAwareness(
    editor,
    providerRef.current?.awareness,
    awarenessUser
  );

  /* ─────────────────────────────────────────────
     Live users (REACTIVE)
  ───────────────────────────────────────────── */
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const awareness = providerRef.current?.awareness;
    if (!awareness) return;

    const updateUsers = () => {
      const nextUsers = Array.from(
        awareness.getStates().values()
      )
        .map((s: any) => s.user)
        .filter(Boolean)
        .map((u: any) => ({
          ...u,
          isYou: u.id === awarenessUser.id,
        }));

      setUsers(nextUsers);
    };

    updateUsers(); // initial sync
    awareness.on("change", updateUsers);

    return () => {
      awareness.off("change", updateUsers);
    };
  }, [providerRef, awarenessUser.id]);

  /* ─────────────────────────────────────────────
     Version history / snapshots
  ───────────────────────────────────────────── */
  const { versions, restoreVersion } = useSnapshots(
    ydocRef.current,
    socket,
    roomId
  );

  /* ─────────────────────────────────────────────
     Code execution (Web Worker)
  ───────────────────────────────────────────── */
  const { run, output, error, running } =
    useCodeRunner();

  /* ─────────────────────────────────────────────
     Public API
  ───────────────────────────────────────────── */
  return {
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
  };
}