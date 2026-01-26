import { NextResponse } from "next/server";

const rooms = globalThis.rooms ?? new Map();
(globalThis as any).rooms = rooms;

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const room = rooms.get(params.id);

  if (!room) {
    return NextResponse.json({ role: "viewer" });
  }

  const role = room.ownerId === userId ? "owner" : "viewer";
  return NextResponse.json({ role });
}
