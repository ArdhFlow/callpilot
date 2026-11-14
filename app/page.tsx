"use client";
import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import type { Call } from "@/lib/store";

export default function Home() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [inCall, setInCall] = useState(false);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [error, setError] = useState("");
  const vapiRef = useRef<Vapi | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Poll the backend every second
  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("/api/calls", { cache: "no-store" });
        const d = await r.json();
        setCalls(d.calls);
      } catch {
        /* ignore */
      }
    };
    load();
    const t = setInterval(load, 1000);
    return () => clearInterval(t);
  }, []);

  // Set up Vapi once
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!key) return;
    const vapi = new Vapi(key);
    vapi.on("call-start", () => {
      setInCall(true);
      setError("");
    });
    vapi.on("call-end", () => {
      setInCall(false);
      setAgentSpeaking(false);
    });
    vapi.on("speech-start", () => setAgentSpeaking(true));
    vapi.on("speech-end", () => setAgentSpeaking(false));
    vapi.on("error", () =>
      setError("Voice error. Check keys, mic permission and internet.")
    );
    vapiRef.current = vapi;
    return () => {
      vapi.stop();
    };
  }, []);

  const startCall = () => {
    if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) {
      setError("Missing NEXT_PUBLIC_VAPI_PUBLIC_KEY in .env.local");
      return;
    }
    const id = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    if (!id) {
      setError("Missing NEXT_PUBLIC_VAPI_ASSISTANT_ID in .env.local");
      return;
    }
    vapiRef.current?.start(id);
  };
  const endCall = () => vapiRef.current?.stop();
  const reset = () => fetch("/api/reset");

  const live = calls.find((c) => c.status === "live");
  const current =
    live ?? calls.find((c) => !c.callId.startsWith("seed_")) ?? null;
  const past = calls.filter((c) => c.callId !== current?.callId);
  const avgScore = calls.length
    ? Math.round(calls.reduce((a, c) => a + c.lead.score, 0) / calls.length)
    : 0;
  const handoffs = calls.filter((c) => c.handoff?.requested).length;
  const score = current?.lead.score ?? 0;
  const scoreColor =
    score >= 75 ? "bg-emerald-400" : score >= 50 ? "bg-amber-400" : "bg-sky-400";
  const transcriptLength = current?.transcript.length ?? 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [transcriptLength]);

  const accept = async () => {
    if (!current) return;
    await fetch("/api/handoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callId: current.callId,
        assignedTo: "Ananya (Sales)",
      }),
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📞 CallPilot</h1>
          <p className="text-slate-400">
            Every call answered. Every lead qualified.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-white"
          >
            Reset demo
          </button>
          {!inCall ? (
            <button
              onClick={startCall}
              className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-black hover:bg-emerald-400"
            >
              🎙️ Start Demo Call
            </button>
          ) : (
            <button
              onClick={endCall}
              className="rounded-xl bg-red-500 px-6 py-3 font-semibold hover:bg-red-400"
            >
              End Call {agentSpeaking ? "🔊 Priya speaking" : "🎤 Listening"}
            </button>
          )}
        </div>
      </header>

      {error && (
        <p className="mb-4 rounded-lg bg-red-500/20 p-3 text-red-300">{error}</p>
      )}

      <section className="mb-6 grid grid-cols-3 gap-4">
        <Kpi label="Total calls" value={calls.length} />
        <Kpi label="Avg lead score" value={avgScore} />
        <Kpi label="Human handoffs" value={handoffs} />
      </section>

      <section className="grid grid-cols-2 gap-6">
        <div className="h-[420px] overflow-y-auto rounded-2xl bg-slate-900 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            Live transcript
            {current?.status === "live" && (
              <span className="animate-pulse rounded-full bg-red-500 px-2 py-0.5 text-xs">
                ● LIVE
              </span>
            )}
          </h2>
          {current && current.transcript.length > 0 ? (
            current.transcript.map((t, i) => (
              <p
                key={i}
                className={`mb-2 text-lg ${
                  t.role === "agent" ? "text-emerald-300" : "text-sky-300"
                }`}
              >
                <b>{t.role === "agent" ? "Priya (AI)" : "Caller"}:</b> {t.text}
              </p>
            ))
          ) : (
            <p className="text-slate-500">
              Start a call to see the conversation here.
            </p>
          )}
          <div ref={endRef} />
        </div>

        <div className="rounded-2xl bg-slate-900 p-5">
          <h2 className="mb-3 font-semibold">Lead intelligence</h2>
          <div className="text-6xl font-bold">{score}</div>
          <div className="mb-1 mt-2 h-3 w-full rounded-full bg-slate-800">
            <div
              className={`h-3 rounded-full transition-all duration-700 ${scoreColor}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <p className="mb-4 text-slate-400">Lead score</p>
          <Field k="Name" v={current?.caller.name} />
          <Field k="Need" v={current?.lead.need} />
          <Field
            k="Monthly bill"
            v={
              current?.lead.monthlyBill
                ? `₹${current.lead.monthlyBill}`
                : undefined
            }
          />
          <Field k="Budget" v={current?.lead.budget} />
          <Field k="Timeline" v={current?.lead.timeline} />
          <div className="flex justify-between border-t border-slate-800 py-2">
            <span className="text-slate-400">Objection</span>
            {current?.lead.objection ? (
              <span className="rounded-full bg-red-500/20 px-3 text-red-300">
                {current.lead.objection}
              </span>
            ) : (
              <span>—</span>
            )}
          </div>
          <Field k="Next action" v={current?.lead.nextBestAction} />
        </div>
      </section>

      {current?.handoff?.requested && (
        <section className="mt-6 rounded-2xl border border-amber-400 bg-amber-500/10 p-5">
          <h2 className="mb-1 font-semibold text-amber-300">
            🚨 Human handoff requested
          </h2>
          <p className="mb-1">
            <b>Reason:</b> {current.handoff.reason}
          </p>
          <p className="mb-3">
            <b>AI brief:</b> {current.handoff.summary}
          </p>
          {current.handoff.accepted ? (
            <p className="text-emerald-300">
              ✅ Accepted by {current.handoff.assignedTo}
            </p>
          ) : (
            <button
              onClick={accept}
              className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-black"
            >
              Accept call
            </button>
          )}
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-2 font-semibold">Recent calls</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th>Caller</th>
              <th>Need</th>
              <th>Score</th>
              <th>Objection</th>
              <th>Handoff</th>
            </tr>
          </thead>
          <tbody>
            {past.map((c) => (
              <tr key={c.callId} className="border-t border-slate-800">
                <td className="py-2">{c.caller.name}</td>
                <td>{c.lead.need ?? "-"}</td>
                <td>{c.lead.score}</td>
                <td>{c.lead.objection ?? "-"}</td>
                <td>{c.handoff?.requested ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-900 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function Field({ k, v }: { k: string; v?: string }) {
  return (
    <div className="flex justify-between border-t border-slate-800 py-2">
      <span className="text-slate-400">{k}</span>
      <span>{v ?? "—"}</span>
    </div>
  );
}