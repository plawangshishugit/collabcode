export type CollabUser = {
  id: string;
  name: string;
};

export function getOrCreateUser(): CollabUser {
  if (typeof window === "undefined") {
    return {
      id: "server",
      name: "Server",
    };
  }

  // ✅ One user per tab (no localStorage)
  return {
    id: crypto.randomUUID(),
    name: `Guest-${Math.floor(100 + Math.random() * 900)}`,
  };
}
