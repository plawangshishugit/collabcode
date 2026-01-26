import { NextResponse } from "next/server";

const rooms = globalThis.rooms ?? new Map();
(globalThis as any).rooms = rooms;

export async function POST(req: Request) {
  const { userId } = await req.json();

  const roomId = crypto.randomUUID().slice(0, 8);

  rooms.set(roomId, {
    ownerId: userId,
  });

  return NextResponse.json({ roomId });
}
