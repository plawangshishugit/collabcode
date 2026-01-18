"use client";

export default function AnalyticsPanel({
  analytics,
}: {
  analytics: any;
}) {
  if (!analytics) return null;

  return (
    <aside className="w-64 bg-zinc-950 border-l border-zinc-800 p-3 text-xs text-zinc-200">
      <h3 className="font-semibold mb-3">Session Analytics</h3>

      <ul className="space-y-1">
        <li>👥 Active users: {analytics.activeUsers}</li>
        <li>⌨️ Edits: {analytics.edits}</li>
        <li>🔁 Restores: {analytics.restores}</li>
        <li>📸 Snapshots: {analytics.snapshots}</li>
        <li>
          ⏱️ Session start:{" "}
          {new Date(analytics.sessionStart).toLocaleTimeString()}
        </li>
      </ul>
    </aside>
  );
}
