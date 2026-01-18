import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

export function useAnalytics(roomId: string) {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    socket.on("analytics:update", (data) => {
      setAnalytics(data);
    });

    return () => {
      socket.off("analytics:update");
    };
  }, [roomId]);

  return analytics;
}
