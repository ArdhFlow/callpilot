import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCall, scoreLead } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const msg = body.message;
  console.log("VAPI EVENT:", msg?.type); // helps debugging
  if (!msg) return NextResponse.json({ ok: true });

  const callId = msg.call?.id ?? "demo-call";
  const call = getOrCreateCall(callId);
  call.updatedAt = Date.now();

  if (msg.type === "transcript" && msg.transcriptType === "final") {
    call.transcript.push({
      role: msg.role === "assistant" ? "agent" : "caller",
      text: msg.transcript,
      ts: Date.now(),
    });
  }

  if (msg.type === "tool-calls") {
    const list = msg.toolCallList ?? msg.toolCalls ?? [];
    const results = list.map((tc: any) => {
      const name = tc.name ?? tc.function?.name;
      let args = tc.arguments ?? tc.function?.arguments ?? {};
      if (typeof args === "string") {
        try { args = JSON.parse(args); } catch { args = {}; }
      }

      if (name === "update_lead") {
        if (args.callerName) call.caller.name = args.callerName;
        call.lead = {
          ...call.lead,
          ...Object.fromEntries(
            Object.entries(args).filter(([k, v]) => k !== "callerName" && v !== undefined && v !== "")
          ),
        };
        call.lead.score = scoreLead(call.lead);
      }

      if (name === "request_human") {
        call.handoff = {
          requested: true,
          reason: args.reason ?? "Caller asked for a human",
          summary: args.summary ?? "",
        };
      }

      if (name === "book_demo") {
        call.lead.nextBestAction = `Site visit requested: ${args.preferredTime ?? "time TBD"}`;
        call.lead.score = Math.min(100, call.lead.score + 10);
      }

      return { name, toolCallId: tc.id, result: "ok" };
    });
    return NextResponse.json({ results });
  }

  if (msg.type === "status-update" && msg.status === "ended") call.status = "ended";
  if (msg.type === "end-of-call-report") {
    call.status = "ended";
    call.summary = msg.summary ?? call.summary;
  }

  return NextResponse.json({ ok: true });
}