export type UserIdentity = {
  id: string;
  name: string;
  color: string;
};

const COLORS = [
  "#e6194b",
  "#3cb44b",
  "#ffe119",
  "#4363d8",
  "#f58231",
  "#911eb4",
  "#46f0f0",
  "#f032e6",
];

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function randomName() {
  return `Guest-${Math.floor(Math.random() * 1000)}`;
}

export function getUserIdentity(): UserIdentity {
  // SSR safety
  if (typeof window === "undefined") {
    return {
      id: "server",
      name: "Server",
      color: "#999999",
    };
  }

  /**
   * IMPORTANT CHANGE
   * Use sessionStorage instead of localStorage
   * → each browser tab = unique user
   */
  const stored = sessionStorage.getItem("collabcode:user");

  if (stored) {
    return JSON.parse(stored);
  }

  const identity: UserIdentity = {
    id: crypto.randomUUID(),
    name: randomName(),
    color: randomColor(),
  };

  sessionStorage.setItem(
    "collabcode:user",
    JSON.stringify(identity)
  );

  return identity;
}
