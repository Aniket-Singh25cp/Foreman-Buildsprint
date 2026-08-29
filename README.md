# Foreman

**Decompose any project brief into a live, trackable task board — automatically.**

Built for BuildSprint 2026 by LatentForce.ai.

## The problem

Turning an idea into a working plan takes real coordination — most tools just *track* work, they don't help structure it. Foreman takes a raw project brief and immediately breaks it into a dependency-aware task list, so you go from "I have an idea" to "I have a working plan" in seconds.

## What it does

1. Paste a project brief into Foreman.
2. LatentCode (via the LatentStack gateway, `gemini-3.6-flash`) decomposes it into 3–6 structured tasks with dependencies.
3. Tasks render on a live Kanban board — click to mark them Pending/Done.
4. Download a summary deck (`.pptx`) of the project at any time, generated using the SkillPatch `vs-financial-analysis-pptx-author` skill.

## Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python 3.14), Pydantic, Uvicorn, `python-pptx`, `httpx`
- **LLM Gateway**: LatentStack Gateway (`gemini-3.6-flash`)
- **Skills**: SkillPatch `vs-financial-analysis-pptx-author` skill

## System Architecture

```text
  ┌────────────────────────┐
  │  Next.js App Frontend  │ (Port 3000)
  └───────────┬────────────┘
              │
              │ REST API (POST /projects, PATCH /tasks, GET /summary-deck)
              ▼
  ┌────────────────────────┐
  │    FastAPI Backend     │ (Port 8000)
  └─────┬────────────┬─────┘
        │            │
        │ HTTP API   │ PPTX Generation
        ▼            ▼
 ┌──────────────┐  ┌──────────────────────────────────┐
 │ LatentStack  │  │ python-pptx                      │
 │ LLM Gateway  │  │ (vs-financial-analysis-pptx-     │
 │ (Gemini 3.6) │  │  author Skill)                   │
 └──────────────┘  └──────────────────────────────────┘
```

## How to Run Locally

### 1. Backend Setup

From the workspace root directory:

```bash
# Install Python dependencies
pip install -r requirements.txt

# Create .env file and set your LatentStack API key
cp .env.example .env
# Edit .env and ensure LATENTSTACK_API_KEY is configured

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

The API will run at `http://localhost:8000`. Interactive docs are available at `http://localhost:8000/docs`.

### 2. Frontend Setup

From the `frontend/` directory:

```bash
cd frontend

# Install Node dependencies
npm install

# Start the Next.js development server
npm run dev
```

Open `http://localhost:3000` in your browser.

## Built with LatentCode

Every line of application code in this repo was generated using LatentCode inside the BuildSprint 2026 hackathon window, per the official rulebook.

## Backend Robustness & Security Checks

- **CORS Restricted**: Allowed origins restricted to `http://localhost:3000`, `http://127.0.0.1:3000`, and optional `FRONTEND_ORIGIN` env variable.
- **Pydantic Validation**:
  - `ProjectCreate` brief constrained (`min_length=10`, `max_length=2000`). Rejects short/oversized payloads before LLM invocation.
  - `TaskUpdate` status constrained to `Literal["pending", "done"]`. Invalid values return `422 Unprocessable Entity`.
- **Task ID Scoping**: Task IDs (1, 2, 3...) are unique per project instance and scoped under `PROJECTS_DB[project_id]`.
- **Live Summary Deck Generation**: `GET /projects/{project_id}/summary-deck` dynamically reads live task states from `PROJECTS_DB` at request time.
- **Configurable Frontend API**: `NEXT_PUBLIC_API_URL` configures the backend base URL (defaults to `http://localhost:8000`).

