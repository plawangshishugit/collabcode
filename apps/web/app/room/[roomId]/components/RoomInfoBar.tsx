export default function RoomInfoBar({
  roomId,
  users,
}: {
  roomId: string;
  users: number;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 text-xs bg-zinc-900 border-b border-zinc-700">
      <span>Room: {roomId.slice(0, 8)}…</span>
      <div className="flex items-center gap-3">
        <span>👥 {users} users</span>
        <button
          onClick={() =>
            navigator.clipboard.writeText(
              `${location.origin}/room/${roomId}`
            )
          }
          className="underline"
        >
          Copy Link
        </button>
      </div>
    </div>
  );
}
