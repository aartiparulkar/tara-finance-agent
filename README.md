{
  "question": "What is my total spend?"
}
```

---

### Example Response

```json
{
  "success": true,
  "response": "Your total spend is ₹42,300."
}
```

---

## GET `/health`

Health monitoring endpoint.

### Example Response

```json
{
  "success": true,
  "uptime": 120,
  "timestamp": "2026-06-05T10:00:00.000Z"
}
```


---
# Deployment

Deployed on Railway: tara-finance-agent-production-db8d.up.railway.app

---

## Run locally

```bash
cp .env.example .env   # fill in your values

npm install

npm run build

npx tsx src/db/runSchema.ts

npx tsx src/ingest/ingestSnapshot.ts sample_a

npm start
```

---

## Environment variables

| Variable          | Description                       |
| ----------------- | --------------------------------- |
| DATABASE_URL      | Postgres connection string        |
| ANTHROPIC_API_KEY | Anthropic API key                 |
| NODE_ENV          | `"development"` or `"production"` |
| PORT              | HTTP port (default `3000`)        |

---

## Known deployment tradeoffs

* Railway free tier sleeps after 30 min inactivity — first request may have ~5s cold start
* Free Postgres is limited to 1GB storage, sufficient for 3 snapshots
* SSL is enabled in production via `rejectUnauthorized: false`

# Example Queries

## Transactions

* What is my total spend?
* Which merchants do I spend most on?
* Show my monthly spending trend.
* Which category do I spend most in?

---

## Investments

* What is my portfolio value?
* Show holdings performance.
* What is the return of Axis Bluechip Fund?

---

# Evaluation Strategy

The project uses deterministic evaluation instead of subjective conversational evaluation.

Focus areas:

* financial correctness
* normalization consistency
* regression prevention
* snapshot compatibility

---

# Production Features

* Structured logging
* Request tracing
* Centralized error handling
* Environment validation
* Graceful shutdown
* Health checks
* Typed interfaces
* Schema validation

---

# Important Engineering Principle

The system intentionally prioritizes:

```text
deterministic correctness over autonomous AI behavior
```

This is especially important for finance applications where hallucinated outputs are unacceptable.

---
