# Tara Finance Agent

AI-powered financial analytics backend built using TypeScript, PostgreSQL, Express, and Mastra.

---

# Overview

Tara Finance Agent is an AI finance analytics system that combines:

* deterministic financial analytics,
* validated structured tools,
* PostgreSQL-backed ingestion pipelines,
* and AI orchestration using Mastra.

The system is intentionally designed around a strict architectural principle:

> AI handles orchestration and language generation.
>
> Deterministic systems handle calculations, analytics, and financial correctness.

This prevents hallucinated financial outputs and ensures reliable analytics behavior.

---

# Core Features

## Financial Analytics

* Total spend calculation
* Spend by category
* Merchant ranking
* Monthly spend trends
* Portfolio valuation
* Fund return analysis
* Holdings performance tracking
* Recurring merchant detection

---

## AI Agent Capabilities

* Natural language financial querying
* Tool-based deterministic analytics
* Structured orchestration using Mastra
* Grounded responses from validated tool outputs

---

## Production Engineering Features

* PostgreSQL persistence
* Structured tool contracts
* Zod validation
* Deterministic analytics layer
* Regression evaluation framework
* Structured logging
* Centralized error handling
* Environment validation
* Health monitoring
* Graceful shutdown

---

# Architecture

```text
Client
  ↓
Express API
  ↓
Mastra Agent (Tara)
  ↓
Validated Tool Layer
  ↓
Deterministic Services
  ↓
SQL Analytics
  ↓
PostgreSQL
```

---

# Tech Stack

## Backend

* Node.js
* TypeScript
* Express

## Database

* PostgreSQL
* pg

## AI

* Mastra
* OpenAI

## Validation

* Zod

## Tooling

* ts-node-dev
* ESLint
* Prettier

---

# Project Structure

```text
src/
│
├── agent/
│   ├── orchestration.ts
│   ├── systemPrompt.ts
│   └── taraAgent.ts
│
├── config/
│   ├── constants.ts
│   └── env.ts
│
├── db/
│   ├── connection.ts
│   ├── runSchema.ts
│   ├── schema.sql
│   └── queries/
│
├── evals/
│
├── ingest/
│
├── middleware/
│
├── routes/
│
├── services/
│
├── tools/
│
├── types/
│
└── utils/
```

---

# Setup Instructions

## 1. Clone Repository

```bash
git clone https://github.com/aartiparulkar/tara-finance-agent.git
cd tara-finance-agent
```

---

## 2. Install Dependencies

```bash
npm install
```

---

# Environment Variables

Create `.env`

```env
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/tara_finance
OPENAI_API_KEY=your_openai_api_key
MODEL_NAME=gpt-4.1-mini
NODE_ENV=development
```

---

# Database Setup

## Create Database

```sql
CREATE DATABASE tara_finance;
```

---

## Run Schema

```bash
npm run schema
```

This creates:
* transactions
* funds
* holdings

tables along with indexes.

---

# Running Ingestion

Place snapshots inside:

```text
data/
  sample_a/
  sample_b/
  sample_c/
```

---

## Run Ingestion

### Sample A

```bash
npm run ingest sample_a
```

### Sample B

```bash
npm run ingest sample_b
```

### Sample C

```bash
npm run ingest sample_c
```

---

# Running Analytics

```bash
npm run analytics
```

This validates:
* spend analytics
* merchant analytics
* monthly trends

---

# Running Tool Tests

```bash
npm run tools
```

This validates:

* tool orchestration
* structured outputs
* validation handling

---

# Running Evals

```bash
npm run evals
```

Evaluation framework includes:

* normalization evals
* analytics evals
* holdings evals
* regression tests

---

# Starting Development Server

```bash
npm run dev
```

---

# Production Build

```bash
npm run build
```

---

# Start Production Server

```bash
npm start
```

---

# API Endpoints

## POST `/ask`

Natural language financial analytics.

### Example Request

```json
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

# Key Design Decisions

## Deterministic Analytics

Financial calculations are NEVER performed by the LLM.

All analytics are handled through:

* SQL
* deterministic services
* validated tool outputs

This improves:

* correctness
* reliability
* reproducibility

---

## Constrained Tool Architecture

The AI agent can only access analytics through validated tools.

This prevents:

* arbitrary SQL generation
* hallucinated analytics
* unsafe orchestration

---

## Layered Architecture

The system separates:

* orchestration,
* analytics,
* persistence,
* validation,
* and API handling.

This improves:

* maintainability
* testing
* observability
* scalability

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

# Future Improvements

Potential future enhancements:

* Dockerization
* CI/CD pipelines
* OpenTelemetry tracing
* Caching layer
* Conversational memory
* Advanced recurring payment detection
* Embedding-based retrieval
* Multi-user authentication
* Streaming responses

---

# Important Engineering Principle

The system intentionally prioritizes:

```text
deterministic correctness over autonomous AI behavior
```

This is especially important for finance applications where hallucinated outputs are unacceptable.

---

# Assignment Notes

This implementation emphasizes:

* production-grade backend design
* deterministic analytics
* structured AI orchestration
* maintainable architecture
* operational reliability

rather than prompt-heavy autonomous agent behavior.

---