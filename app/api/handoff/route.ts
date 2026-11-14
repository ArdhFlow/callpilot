import { NextRequest, NextResponse } from "next/server";
import { calls } from "@/lib/store";

export async function POST(req: NextRequest) {
  const { callId, assignedTo } = await req.json();
  const call = calls.find((c) => c.callId === callId);
  if (!call || !call.handoff) return NextResponse.json({ ok: false }, { status: 404 });
  call.handoff.accepted = true;
  call.handoff.assignedTo = assignedTo ?? "Ananya (Sales)";
  return NextResponse.json({ ok: true });
}