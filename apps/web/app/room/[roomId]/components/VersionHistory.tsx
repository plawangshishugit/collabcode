"use client";

type Version = {
  index: number;
  timestamp: number;
};

export default function VersionHistory({
  versions,
  onRestore,
}: {
  versions: Version[];
  onRestore: (index: number) => void;
}) {
  return (
    <aside className="w-64 bg-zinc-900 border-l border-zinc-700 p-3 overflow-y-auto">
      <h3 className="text-sm font-semibold mb-3 text-zinc-200">
        Version History
      </h3>

      {versions.length === 0 && (
        <p className="text-xs text-zinc-500">No snapshots yet</p>
      )}

      <ul className="space-y-2">
        {versions
          .slice()
          .reverse()
          .map((v) => (
            <li
              key={v.index}
              className="flex justify-between items-center text-xs text-zinc-300 bg-zinc-800 rounded px-2 py-1"
            >
              <span>
                {new Date(v.timestamp).toLocaleTimeString()}
              </span>

              <button
                onClick={() => onRestore(v.index)}
                className="text-blue-400 hover:text-blue-300"
              >
                Restore
              </button>
            </li>
          ))}
      </ul>
    </aside>
  );
}
