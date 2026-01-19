"use client";

export default function OutputPanel({
  output,
  error,
}: {
  output: string[];
  error: string | null;
}) {
  return (
    <div className="h-40 bg-black text-green-400 text-xs p-2 overflow-y-auto border-t border-zinc-700">
      {error && (
        <div className="text-red-400">❌ {error}</div>
      )}

      {!error && output.length === 0 && (
        <div className="text-zinc-500">
          No output
        </div>
      )}

      {output.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}
