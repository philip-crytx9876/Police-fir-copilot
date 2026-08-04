# 🚓 Police FIR & Investigation Intelligence Copilot (Philippines)

> A prototype that extracts entities from messy police complaints (FIRs),
> cross-references a structured criminal database, builds case graphs,
> drafts investigative action plans, answers investigator questions, and
> exposes a warehouse-style Snowflake demo for cross-case intelligence —
> localized for the **Philippines** (Revised Penal Code, special penal laws
> like RA 10175 and PD 1612, PNP station/rank naming) and powered by
> **Groq (GPT-OSS-120B)**.

![theme](https://img.shields.io/badge/theme-Light%20%7B%20blue%20%2B%20white%20%2B%20green%20%2B%20red%20%7D-1d4ed8)
![ai](https://img.shields.io/badge/AI-Groq-16a34a)
![stack](https://img.shields.io/badge/stack-React%20%2B%20Tailwind%20%2B%20Express-dc2626)

---

## ✨ Features

| # | Feature | What it does |
|---|---|---|
| 1 | **Multi-Lingual FIR Parser** | Upload a real **PDF** (text is extracted server-side) or paste raw narrative text (English / Filipino / Taglish / Cebuano / Ilocano). Returns typed JSON: suspects, victim, stolen items, locations, timestamps, vehicles, RPC/RA sections. |
| 2 | **Repeat Offender SQL Matcher** | Rule-based + AI re-ranked search across the criminal-history DB by MO, physical descriptors, and operating area. |
| 3 | **Case Timeline & Relationship Graph** | Merges multiple FIRs into a unified timeline + an evidence-board node graph (SVG, no extra graph libs). Groq infers cross-case relationships. |
| 4 | **Investigative Action Plan Draft** | Produces a referral outline, witnesses, evidence-preservation list, RPC/RA-grounded next steps, and risk flags. |
| 5 | **Snowflake Intelligence View** | Shows a dynamic warehouse-style dashboard of investigation clusters, risk scores, watchlist hits, and timeline events — ideal for fast analytical review. |
| 6 | **Copilot Chat (Q&A)** | Free-form investigator Q&A grounded in the in-house DB **and** whichever FIR you just uploaded/parsed — ask "what's the solution for this case?" and it answers using that FIR's specifics. |

### 📄 Upload → Chat workflow

1. Go to **FIR Parser**, click **Upload PDF**, and pick an FIR (a demo one is included — see below). The server extracts the real text from the PDF (`pdf-parse`), auto-runs the parser, and the result becomes the active context.
2. Switch to **Copilot Chat**. The sidebar shows "Active context" is now this FIR. Ask things like *"what are the details of this FIR?"* or *"what's the solution / next steps for this case?"* — the assistant answers using the actual uploaded complaint plus the in-house offender/case DB, not a generic answer.
3. Optionally jump to **Offender Match**, **Snowflake**, or **Action Plan** to go deeper on suspects, case clustering, or draft a referral outline for the same case.

### ❄️ Snowflake and cocoCLI

**Snowflake** is a cloud data warehouse used for secure analytics, large-scale data consolidation, and fast cross-table investigations. In this project, the Snowflake service is a best-fit analytical layer for investigation data because it can join FIR records, offender history, timeline events, and risk signals into a single reporting view.

**cocoCLI** is the command-line companion for operationalizing that flow: it helps validate exported data, check schemas, and move cleaned warehouse data to reporting or downstream tools. In a real deployment, a team could use Snowflake + cocoCLI to store case metadata, maintain consistent warehouse views, and automate export checks before sharing intelligence dashboards.

The demo page in the frontend reads dynamic warehouse-style case data from a lightweight backend service and presents a live monitoring board with alerts, watchlist hits, and timeline events.

---

## 📎 Demo PDF

A ready-to-use sample FIR PDF is included at:

```
client/public/demo/demo-fir-cubao-bag-snatching.pdf
```

It describes a bag/laptop-snatching complaint in Cubao, Quezon City — matching the profile of a known offender already seeded in the mock DB (`server/data/offenders.json`), so the **Offender Match** and **Copilot Chat** features have something real to surface. Download it from the app's Dashboard ("Try the demo FIR PDF" link) or open it directly from `client/public/demo/` and upload it via **FIR Parser → Upload PDF**.

---

## 🚀 Quick Start — 2 commands

```bash
# 1) install everything (root + server + client)
npm install

# 2) run frontend + backend together
npm run dev
```

Then open <http://localhost:5173>.

> The root `package.json` chains installs via `postinstall` and uses
> `concurrently` to run both dev servers. **You only ever run npm install + npm run dev.**

### Optional: just one side

```bash
npm run dev:server   # API only on :5000
npm run dev:client   # UI only on :5173
```

---

## 🔑 Configure Groq (default AI provider)

1. Create a free API key at <https://console.groq.com/keys>.
2. Copy the env file and paste your key:

   ```bash
   cp .env.example server/.env
   # then edit server/.env
   ```

   ```env
   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
   GROQ_MODEL=openai/gpt-oss-120b
   ```

3. Restart `npm run dev`. Health check: <http://localhost:5000/api/health>

> Want a different model? Groq also hosts `openai/gpt-oss-20b`,
> `llama-3.1-8b-instant`, `qwen/qwen3.6-27b`, etc. Just change
> `GROQ_MODEL` in `server/.env` — no code change needed. See
> <https://console.groq.com/docs/models> for the current lineup.

---

## 🧱 Project layout

```
police-fir-copilot/
├── package.json          ← single root, 2 commands (install + dev)
├── vercel.json           ← Vercel deployment config
├── .env.example          ← Groq config template
├── api/                  ← Vercel serverless entry (wraps server/index.js)
│   └── index.js
├── server/               ← Express + Groq provider
│   ├── index.js
│   ├── services/
│   │   ├── groq-ai.js
│   │   └── snowflake-service.js    (warehouse-style case intelligence demo)
│   ├── routes/
│   │   ├── parser.js         (Feature 1 — parse + PDF extraction)
│   │   ├── matcher.js        (Feature 2)
│   │   ├── graph.js          (Feature 3)
│   │   ├── actionplan.js     (Feature 4)
│   │   ├── chat.js           (Q&A, grounded in current FIR context)
│   │   └── snowflake.js      (Snowflake warehouse demo API)
│   └── data/
│       ├── cases.json
│       ├── offenders.json
│       └── snowflake-cases.json
└── client/               ← React + Vite + Tailwind (light theme)
    ├── public/demo/           (demo FIR PDF for the upload flow)
    ├── tailwind.config.js
    ├── src/
    │   ├── App.jsx
    │   ├── api.js
    │   └── components/
    │       ├── Dashboard.jsx
    │       ├── FIRParser.jsx     (PDF upload + parse)
    │       ├── OffenderMatcher.jsx
    │       ├── GraphView.jsx
    │       ├── ActionPlan.jsx
    │       ├── Chatbot.jsx
    │       └── SnowflakeDemo.jsx
    └── …
```

---

## ▲ Deploy to Vercel

The repo ships with a `vercel.json` that builds the Vite client as static
output and runs the Express API (`server/index.js`) as a single serverless
function via `api/index.js`.

1. Push the repo to GitHub (or run `vercel` from the project root with the
   [Vercel CLI](https://vercel.com/docs/cli)).
2. Import the repo in the [Vercel dashboard](https://vercel.com/new), or run:

   ```bash
   npm i -g vercel
   vercel
   ```

3. Set these **Environment Variables** in the Vercel project settings
   (Project → Settings → Environment Variables):

   ```env
   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
   GROQ_MODEL=openai/gpt-oss-120b
   GROQ_ENDPOINT=https://api.groq.com/openai/v1/chat/completions
   ```

4. Deploy. Vercel runs `npm install` at the root (which chains into
   `server/` and `client/` via `postinstall`) and builds the client with
   `npm run build --prefix client`. `/api/*` requests are routed to the
   serverless function; everything else is served from `client/dist`
   with SPA fallback.

> Note: `server/index.js` only calls `app.listen()` when **not** running on
> Vercel (`process.env.VERCEL` is set automatically in that environment) —
> `api/index.js` imports the same Express app and Vercel handles the
> request/response cycle itself, so no code is duplicated between local
> dev and production.

---

## 🌏 Localization notes (Philippines)

- **Static DB** (`server/data/cases.json`, `server/data/offenders.json`) uses PNP station naming (e.g. Quezon City Police District, Manila Police District, Cebu City Police Office), PNP ranks (PCpl, PSSg, PSI), Philippine addresses/areas (Cubao, Bacoor, Divisoria, Tondo, Cebu), `+63` phone formats, and Philippine peso (₱) values.
- **Legal references** point to the Revised Penal Code (e.g. Art. 294 Robbery, Art. 308 Theft, Art. 315 Estafa) and special penal laws (PD 1612 Anti-Fencing Law, RA 10175 Cybercrime Prevention Act) instead of IPC/CrPC.
- **6 seeded cases**, including 2 newly added: a Cubao bag/laptop-snatching case (`FIR/2024/0512`) and a Cebu online-selling estafa/cybercrime case (`FIR/2024/0678`) — giving the demo a non-snatching crime type as well.
- **Language options** in the parser reflect the Philippines: English, Filipino (Tagalog), Taglish, Cebuano (Bisaya), Ilocano.

All names, addresses, and phone numbers in the seed data are fictional and for demo purposes only.

---

## 🎨 UI/UX (light theme: blue + white + green + red)

- **File-card** motif (folded corner + red pin dot) for every panel
- **"CLASSIFIED · INTEL"** stamp element on the hero
- **Ruled-paper** background for the timeline (notebook feel)
- **Pinboard dot-grid** for the relationship graph (evidence-board feel)
- **Radio-comm** blinking cursor for the chatbot
- **Status chips** colour-coded — blue (info), green (active/cleared), red (alert/at large), amber (pending)
- **Risk bars** with green/amber/red thresholds
- Police-blue sidebar with a glossy badge watermark

---

## 🛠 Tech

- **Frontend:** React 18, Vite 5, TailwindCSS 3, lucide-react
- **Backend:** Node 18+, Express 4, multer, pdf-parse, dotenv
- **AI:** Groq inference API (default `openai/gpt-oss-120b`)
- **Graph:** custom SVG renderer (no extra graph library)
- **Concurrency:** `concurrently` for the 2-command workflow

---

## 📜 License

MIT — for prototype / evaluation use.
