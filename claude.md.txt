# AI Fitness Coach — Claude Code Instructions

## Project Goal
Build a simple AI-powered fitness tracking web app that allows users to:
- log body weight
- track basic fitness data
- view trends over time
- later add AI insights (NOT now)

---

## Tech Stack
- Frontend: Next.js (App Router)
- Backend: FastAPI (Python)
- Styling: TailwindCSS
- Data storage: start in-memory only (no database initially)

---

## Core Rules (VERY IMPORTANT)

### 1. Keep it simple
Do NOT introduce:
- microservices
- event systems
- agents
- unnecessary abstractions
- complex architecture patterns

### 2. Build incrementally
Only implement ONE feature at a time.
Each feature must:
- run successfully before moving on
- not break existing functionality

### 3. Backend rules
- Use FastAPI only
- Keep endpoints minimal and readable
- Avoid unnecessary layers (no service explosion)

### 4. Frontend rules
- Use simple components
- No overengineering state management
- Prefer built-in React hooks (useState, useEffect)

### 5. Data rules
- Start with in-memory storage only
- No database until explicitly requested

### 6. AI features
- Do NOT implement AI coach logic yet
- AI comes only after core tracking works

---

## Definition of Done
A feature is ONLY complete if:
- frontend works
- backend works
- request/response verified
- no broken imports or runtime errors