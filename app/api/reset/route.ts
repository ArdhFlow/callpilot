import { NextResponse } from "next/server";
import { calls } from "@/lib/store";

export async function GET() {
  const keep = calls.filter((c) => c.callId.startsWith("seed_"));
  calls.splice(0, calls.length, ...keep);
  return NextResponse.json({ ok: true, remaining: calls.length });
}