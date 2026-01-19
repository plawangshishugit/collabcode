import { CollabUser } from "@/app/lib/user";

export type AwarenessUser = {
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

function colorFromId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function toAwarenessUser(
  user: CollabUser
): AwarenessUser {
  return {
    id: user.id,
    name: user.name,
    color: colorFromId(user.id), // ✅ deterministic
  };
}
