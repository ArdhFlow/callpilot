export type Lead = {
  need?: string;
  monthlyBill?: number;
  budget?: string;
  timeline?: string;
  objection?: string;
  sentiment?: string;
  score: number;
  nextBestAction?: string;
};

export type Call = {
  callId: string;
  status: "live" | "ended";
  startedAt: number;
  updatedAt: number;
  caller: { name: string; phone: string };
  transcript: { role: "agent" | "caller"; text: string; ts: number }[];
  lead: Lead;
  handoff?: {
    requested: boolean;
    reason: string;
    summary: string;
    assignedTo?: string;
    accepted?: boolean;
  };
  summary?: string;
};

const g = globalThis as unknown as { __calls?: Call[]; __seeded?: boolean };
if (!g.__calls) g.__calls = [];
export const calls: Call[] = g.__calls;

export function getOrCreateCall(callId: string): Call {
  let call = calls.find((c) => c.callId === callId);
  if (!call) {
    call = {
      callId,
      status: "live",
      startedAt: Date.now(),
      updatedAt: Date.now(),
      caller: { name: "Unknown caller", phone: "Web call" },
      transcript: [],
      lead: { score: 20 },
    };
    calls.unshift(call);
  }
  return call;
}

export function scoreLead(l: Lead): number {
  let s = 20;
  if (l.need) s += 15;
  if (l.monthlyBill && l.monthlyBill >= 3000) s += 15;
  if (l.budget) s += 15;
  if (l.timeline) s += 15;
  if (l.sentiment === "positive") s += 10;
  if (l.sentiment === "negative") s -= 10;
  return Math.max(0, Math.min(100, s));
}

// Seed fake past calls so the dashboard looks lived-in
if (!g.__seeded) {
  g.__seeded = true;
  const names = ["Priya Das", "Amit Shah", "Sneha Roy", "Vikram Singh", "Neha Gupta"];
  names.forEach((n, i) => {
    calls.push({
      callId: `seed_${i}`,
      status: "ended",
      startedAt: Date.now() - (i + 1) * 3600_000,
      updatedAt: Date.now() - (i + 1) * 3600_000,
      caller: { name: n, phone: "+91-98XXXXXX0" + i },
      transcript: [],
      lead: {
        need: "Rooftop solar",
        monthlyBill: 4000 + i * 800,
        timeline: "3 months",
        score: 55 + i * 8,
        objection: i % 2 ? "price" : "trust",
        sentiment: "positive",
      },
      handoff: i % 2
        ? { requested: true, reason: "Wanted a human", summary: "Interested, needs quote", accepted: true, assignedTo: "Ananya (Sales)" }
        : undefined,
    });
  });
}