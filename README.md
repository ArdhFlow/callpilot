# 📞 CallPilot — AI Voice Sales Agent

> Every call answered. Every lead qualified.

CallPilot is an AI voice agent that answers sales calls, qualifies leads live, handles
objections from a company knowledge base, and hands a human a warm, summarized lead.

## How it works
```
Caller (browser mic) → Vapi (STT → LLM → TTS) → webhook (/api/vapi/webhook)
   → in-memory lead store → live dashboard (polls /api/calls)
```
- The agent calls tools (`update_lead`, `request_human`, `book_demo`) so speech becomes structured CRM data.
- It answers only from approved company knowledge and escalates to a human when unsure.
- The dashboard shows the live transcript, lead score, objections and a handoff card.

## Tech
Next.js 16, React 19, Tailwind 4, Vapi (voice), Claude/LLM via Vapi, ngrok (webhook tunnel).

## Run locally
```bash
npm install
cp .env.example .env.local   # then fill in the two Vapi values
npm run dev
```
In another terminal: `ngrok http 3000`, then set the Vapi assistant and tool Server URL to
`https://<your-ngrok-domain>/api/vapi/webhook`.

Open http://localhost:3000 and click **Start Demo Call**.

## API routes
| Route | Purpose |
|---|---|
| `POST /api/vapi/webhook` | Receives Vapi events and tool calls |
| `GET /api/calls` | Returns all calls for the dashboard |
| `POST /api/handoff` | Accepts a human handoff |
| `GET /api/reset` | Clears demo data (keeps seed calls) |

## Team
Ardhendu (backend) · Anup (voice) · Richik (frontend)
