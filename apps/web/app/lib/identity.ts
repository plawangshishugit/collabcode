export type UserIdentity = {
  id: string;
  name: string;
  color: string;
};

export function getUserIdentity(): UserIdentity {
  // ✅ SSR-safe: NEVER throw
  if (typeof window === "undefined") {
    return {
      id: "ssr",
      name: "ssr",
      color: "transparent",
    };
  }

  let id = localStorage.getItem("collab:user:id");
  let name = localStorage.getItem("collab:user:name");
  let color = localStorage.getItem("collab:user:color");

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("collab:user:id", id);
  }

  if (!name) {
    name = `user-${id.slice(0, 4)}`;
    localStorage.setItem("collab:user:name", name);
  }

  if (!color) {
    color = `hsl(${Math.random() * 360}, 70%, 60%)`;
    localStorage.setItem("collab:user:color", color);
  }

  return { id, name, color };
}
