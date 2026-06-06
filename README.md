# Tara Finance Agent

An AI-powered personal finance research backend. Ask natural language questions about your spending, investments, and holdings, Tara answers using real data from your database, never guessing.

> **Deployed at:** `https://tara-finance-agent-production-db8d.up.railway.app`

---

## How it works
```
POST /ask  →  Mastra Agent (Tara)  →  Validated Tools  →  PostgreSQL  →  Answer
```

The AI handles language understanding and tool selection. All numbers come from SQL. The model never does arithmetic.

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/aartiparulkar/tara-finance-agent.git
cd tara-finance-agent
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
```

Fill in `.env`:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/tara_finance
OPENAI_API_KEY=your_openai_api_key
MODEL_NAME=gpt-4.1-mini
LOG_LEVEL=info
```

### 3. Create the database

```sql
CREATE DATABASE tara_finance;
```

### 4. Run schema

```bash
npm run schema
```

Creates `transactions`, `funds`, `holdings` and `merchant_canonical` tables with indexes.

### 5. Ingest a snapshot

Place snapshots in the `data/` folder, then:

```bash
npm run ingest sample_a
npm run ingest sample_b
npm run ingest sample_c
```

### 6. Start the server

```bash
npm run dev       # development
npm run build && npm start   # production
```

---

## Environment variables

| Variable       | Required | Description                              |
|----------------|----------|------------------------------------------|
| `DATABASE_URL` | Yes      | Postgres connection string               |
| `OPENAI_API_KEY` | Yes    | OpenAI API key                           |
| `MODEL_NAME`   | Yes      | Model to use (e.g. `gpt-4.1-mini`)       |
| `PORT`         | No       | HTTP port, defaults to `3000`            |
| `NODE_ENV`     | No       | `development` or `production`            |
| `LOG_LEVEL`    | No       | `info`, `debug`, `error` (default `info`)|

---

## API

### `POST /ask`

Ask a natural language question about your finances.

**Request:**
```json
{ "question": "How much did I spend on food last month?" }
```

**Response:**
```json
{
  "success": true,
  "response": "Your food spending last month was ₹8,430.00."
}
```

### `GET /health`

```json
{
  "success": true,
  "uptime": 120,
  "timestamp": "2026-06-05T10:00:00.000Z"
}
```

---

## Example questions

**Spending**
- What is my total spending?
- How much did I spend on food in March 2025 after refunds?
- Which merchants do I spend most on?
- Compare my food and travel spending — which grew faster?
- Which transactions look like recurring subscriptions?
- What was my biggest single expense?

**Investments**
- What is my portfolio worth today?
- What is the return of Axis Bluechip Fund?
- Which of my funds gave the best realised return?
- Show holdings performance.

---

## Running evals

```bash
# Unit evals (normalization, analytics, holdings)
npm run evals

# Agent evals — hits live /ask endpoint, checks 14 questions
npm run eval:agent

# Agent evals against deployed URL
$env:EVAL_URL="https://tara-finance-agent-production-db8d.up.railway.app"
npx tsx src/evals/runAgentEvals.ts
```

---

## Project structure

```
src/
├── agent/
│   ├── orchestration.ts      # askTara() — Mastra generate loop
│   ├── systemPrompt.ts       # Tara's instructions
│   └── taraAgent.ts          # Agent definition with tools
│
├── config/
│   ├── constants.ts
│   └── env.ts                # Environment validation
│
├── db/
│   ├── connection.ts         # pg Pool
│   ├── runSchema.ts          # Creates tables
│   ├── schema.sql
│   └── queries/              # SQL query strings
│
├── evals/
│   ├── runAgentEvals.ts      # End-to-end /ask endpoint evals
│   ├── normalization.evals.ts
│   ├── analytics.evals.ts
│   └── assertions.ts
│
├── ingest/
│   ├── ingestSnapshots.ts    # CLI entry point
│   ├── derivedFields.ts      # merchant_canon, is_refund, is_transfer
│   ├── normalizeMerchants.ts # LCP clustering pipeline
│   └── validators.ts         # Zod schemas for JSON input
│
├── middleware/               # Error handling, request logging
├── routes/                   # /ask, /health
├── services/                 # Business logic, DB calls
├── tools/                    # Mastra tool definitions
├── types/
└── utils/
    ├── merchantResolver.ts   # Query-time fuzzy merchant matching
    ├── fundResolver.ts       # Query-time fuzzy fund name matching
    └── logger.ts
```

---

## Deployment

Deployed on Railway with a managed Postgres instance.

### Deploy your own

1. Push repo to GitHub
2. Create a new project on [railway.app](https://railway.app)
3. Add your GitHub repo as the app service
4. Add a **PostgreSQL** service — Railway injects `DATABASE_URL` automatically
5. Set variables in the app service:
   ```
   NODE_ENV=production
   OPENAI_API_KEY=your_key
   MODEL_NAME=gpt-4.1-mini
   LOG_LEVEL=info
   ```
6. Generate a public domain under **Settings → Networking**
7. Run schema and ingest using the public Postgres URL:
   ```powershell
   # Windows PowerShell
   $env:DATABASE_URL="postgresql://postgres:...@roundhouse.proxy.rlwy.net:PORT/railway"
   npx tsx src/db/runSchema.ts
   npx tsx src/ingest/ingestSnapshots.ts sample_a
   ```

### Known deployment tradeoffs

- Railway free tier sleeps after 30 min inactivity — first request may have ~5s cold start latency
- Free Postgres is capped at 1 GB storage, sufficient for all three sample snapshots
- SSL is enabled in production via `rejectUnauthorized: false` on the pg connection
- `DATABASE_URL` is injected by Railway and must not be set manually in Railway variables

---

## Observability

Every `/ask` request logs:

```json
{
  "question": "...",
  "answer": "...",
  "steps": 3,
  "latency_ms": 1240
}
```

Tool errors log sanitized inputs and error reason. API keys and raw transaction data are never logged.