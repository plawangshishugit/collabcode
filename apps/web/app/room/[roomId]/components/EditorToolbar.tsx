"use client";

type Props = {
  canRun: boolean;
  canUndo: boolean;
  onRun: () => void;
  onUndo: () => void;
};

export default function EditorToolbar({
  canRun,
  canUndo,
  onRun,
  onUndo,
}: Props) {
  return (
    <div className="flex items-center gap-2 p-2 bg-zinc-900 border-b border-zinc-700">
      <button
        onClick={onRun}
        disabled={!canRun}
        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50"
        title={!canRun ? "Login required to run code" : "Run code"}
      >
        ▶️ Run
      </button>

      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="px-3 py-1 text-xs bg-zinc-800 text-zinc-200 rounded hover:bg-zinc-700 disabled:opacity-40"
      >
        ⏪ Shared Undo
      </button>
    </div>
  );
}
