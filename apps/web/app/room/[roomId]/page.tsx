import dynamic from "next/dynamic";

const EditorClient = dynamic(() => import("./EditorClient"), {
  ssr: false,
});

export default function RoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  return (
    <main className="h-screen">
      <EditorClient roomId={params.roomId} />
    </main>
  );
}
