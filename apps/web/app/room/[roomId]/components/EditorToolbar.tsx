"use client";

type UserPresence = {
  id: string;
  name: string;
  color: string;
  isYou?: boolean;
};

type EditorToolbarProps = {
  roomId: string;
  userName: string;
  users: {
    id: string;
    name: string;
    isYou: boolean;
  }[];
  canRun: boolean;
  canUndo: boolean;
  onRun: () => void;
  onUndo: () => void;
};

export default function EditorToolbar({
  roomId,
  userName,
  users,
  canRun,
  canUndo,
  onRun,
  onUndo,
}: EditorToolbarProps) {
  function copyRoomLink() {
    navigator.clipboard.writeText(window.location.href);
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800">
      {/* ───────────────── Left: Room + Presence ───────────────── */}
      <div className="flex items-center gap-4 text-xs text-zinc-400">
        <span>
          Room:{" "}
          <span className="text-zinc-200">
            {roomId.slice(0, 8)}…
          </span>
        </span>

        <button
          onClick={copyRoomLink}
          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
        >
          🔗 Copy Link
        </button>

        <span>
          👥 {users.length}{" "}
          {users.length === 1
            ? "participant"
            : "participants"}
        </span>

        <span className="text-zinc-200">
          You: {userName}
        </span>

        {users
          .filter((u) => !u.isYou)
          .map((u) => (
            <span key={u.id} className="text-zinc-400">
              • {u.name}
            </span>
          ))}
      </div>
      {/* ───────────────── Right: Actions ───────────────── */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRun}
          disabled={!canRun}
          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50"
        >
          ▶️ Run
        </button>

        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="px-3 py-1 text-xs bg-zinc-800 text-zinc-200 rounded hover:bg-zinc-700 disabled:opacity-40"
        >
          ⏪ Undo
        </button>
      </div>
    </div>
  );
}
