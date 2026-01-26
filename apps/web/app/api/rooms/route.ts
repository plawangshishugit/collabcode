import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST() {
  const roomId = crypto.randomUUID().slice(0, 8);
  const ownerToken = crypto.randomUUID();

  return NextResponse.json({
    roomId,
    ownerToken,
  });
}
