# BujhAI — Project Description, User Flows, Stack & Architecture

## 1. Overview

**BujhAI** is an AI-powered online learning platform. Course/project owners upload study materials (PDF/TXT/DOCX), and the system automatically generates a structured curriculum — titled **modules** with checklist/evaluation **points** — plus a curated set of learning resources (2 YouTube videos, 2 online tutorials, and a study roadmap). Learners then study through a talking session with a **dual-persona AI tutor** that both evaluates their understanding and keeps asking questions, alongside an optional **zoomable whiteboard** (Excalidraw) they can draw on and include as part of their answers. An owner can invite others via a 7-character join code; each enrolled student gets their own persistent progress, chat history, and canvas.

The frontend lives in `frontend/` (React 19 + Vite), the backend in `backend/` (FastAPI). The app pairs an LLM tutor with a RAG pipeline over the owner's uploaded materials, and tracks learner progress all the way to a "course complete" state.

## 2. User Flows

### A. Authentication & Onboarding

1. User lands on `/` (marketing page). Signed-in users are diverted straight to `/dashboard`.
2. `/auth` uses **Supabase Auth** (email/password incl. email confirmation, `full_name` stored in metadata).
3. Every backend request carries `Authorization: Bearer <supabase-access-token>`; the backend validates it against Supabase's `/auth/v1/user` endpoint on each request and auto-provisions/updates the local `User` row.

### B. Content Owner Flow (creates a "course")

1. Create a project on the Dashboard (`POST /projects`) — auto-assigns a unique join code plus a default avatar image.
2. Open the course → **Materials tab** → upload materials (`POST /projects/{id}/materials/upload`, max 50MB, `pdf/txt/doc/docx`).
3. Backend: extracts text → chunk text → embeds into ChromaDB → **AI-generates the course structure**: deletes old modules, creates new **modules + points**, and appends 5 **resources**. The response returns generated modules/resources to populate the UI.
4. Owner can hand-edit (add/rename/delete) modules & points, and toggle point completion.
5. Go to **Study tab** → Begin a tutoring session: type or use voice input, optionally draw on the canvas.
6. Track analytics in the **Stats tab** (materials, chunk count, enrollments, module progress), and see enrolled students' per-module completion (`enrolled-stats`).

### C. Learner Flow (student, joined by code)

1. Dashboard → **Join** with a 7-char code (`POST /projects/join-by-code`).
2. Enters the course read-only (materials/modules viewable, cannot edit).
3. **Study tab**: chatting with the dual tutor; students get their own persisted chat history, canvas, and progress. Graded checkboxes update **only via the AI agent** during chat (they cannot toggle their own).
4. When every point is demonstrated, the backend fires a `course_complete` SSE event → trophy UI and the course counts as completed.

### D. The Talking Session (core loop)

For each learner message, the backend runs a LangGraph pipeline and streams back (SSE) three phases:

1. **Evaluator** → assessment text; issues `module_update` events (which points to check/uncheck).
2. **Tutor/Student persona** → asks the next checkpoint question (streamed tokens).
3. `finish` event terminates the stream; both responses are persisted as two DB `messages`.

## 3. Tech Stack & Rationale

| Layer                | Choice                                                                                                                                           | Why                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Frontend framework   | **React 19 + Vite 8**                                                                                                                            | Fast HMR dev, component model.                                                                                 |
| Frontend styling/UI  | **Tailwind CSS v4**, shadcn/ui-style components (@base-ui/react, lucide icons), `motion` animations, `sonner` toasts; neobrutalist design tokens | Rapid, consistent UI with existing rich component primitives.                                                  |
| Whiteboard           | **@excalidraw/excalidraw 0.18**                                                                                                                  | Battle-tested ready-made editor; compacting scene JSON keeps AI context lean.                                  |
| Auth                 | **@supabase/supabase-js 2** (hosted Supabase)                                                                                                    | Managed auth, JWT issuance, email verification; already provisioned in Supabase.                               |
| Backend              | **FastAPI + uvicorn** (async)                                                                                                                    | Native async/await required for the streaming (SSE) chat; auto OpenAPI; Pydantic everywhere.                   |
| ORM / migrations     | **SQLAlchemy 2.0 (async) + Alembic**                                                                                                             | Battle-tested async ORM; versioned schema (migrations 001–004).                                                |
| Database             | **Supabase-hosted PostgreSQL (asyncpg)**                                                                                                         | Serverless, hosted, RLS-capable; the live connection string is a Supabase pooler (`wdr…supabase.com`).         |
| Vector store         | **ChromaDB persistent client** (local `chroma_db/`)                                                                                              | Simple embedding store, one collection per course for isolation; colocated with the backend, no extra service. |
| LLM provider         | **Groq Cloud** (`llama-3.3-70b-versatile`) via Groq/LangChain                                                                                    | Fast inference, free tier; used for generation, evaluation, tutoring.                                          |
| Agent orchestration  | **LangGraph**                                                                                                                                    | Explicit multi-node, multi-step agent graph (router → retrieve → evaluate → student) with streaming.           |
| STT                  | **Groq Whisper** (`whisper-large-v3`, via groq SDK)                                                                                              | Same provider as the LLM (one key); cheap/fast; 25MB cap, webm/mp3/m4a/etc.                                    |
| Doc parsing          | **pypdf**                                                                                                                                        | Extract text from PDFs; TXT/DOC/DOCX supported.                                                                |
| HTTP / cross-cutting | **httpx** (Supabase JWT verify), Pydantic-settings for config                                                                                    | Minimal, focused dependencies.                                                                                 |

**Why this combination:** async end-to-end (SSE + async LLM), one external provider for text + speech (Groq), hosted Postgres + Auth (Supabase) that avoids ops, local ChromaDB for RAG isolation without added infrastructure, and a scalable React + Excalidraw foundation for the interactive tutor loop.

## 4. Storage (what lives where)

**Supabase Postgres** (via SQLAlchemy; all relational data):

- `users` — id, email (unique), name
- `projects` — id, owner user_id, title/description/badge/button_text/image_url, join_code (unique), timestamps, completed_at
- `modules` — per-project; `module_points` — per-module checklist/evaluation points (text, checked, sort_order)
- `materials` — uploaded file metadata & `file_path` & `chunk_count`; refers to Chroma chunks
- `resources` — AI-generated resources (video/tutorial/roadmap)
- `messages` — chat (role, content, metadata_json, per-user)
- `canvas_scenes` — Excalidraw JSON per user
- `project_enrollments` — many-to-many: user ↔ course
- `user_point_progress` — per-student per-point completion

**ChromaDB** (`backend/chroma_db/chroma.sqlite3` + per-collection dirs): embedded chunks of materials, keyed by `material_id`, one collection `project_<id>` per course (project-level RAG isolation). Orphaned collections are pruned at startup.

**Filesystem** (`backend/materials/`): uploaded file content is written **temporarily** → text extracted → file removed (raw file content is not retained; the durable form is the embedded chunks in ChromaDB). No other binary assets are stored.

**Environment** (`backend/.env`): Supabase DATABASE*URL, Supabase base URL + anon + service keys, Groq API key. `frontend/.env`: `VITE_API_URL=http://localhost:8999`, `VITE_SUPABASE*\*`.

## 5. Backend Architecture Details & Justification

### 5.1 Auth-first request flow

`app/deps.py`:

- `get_current_user` → validates the Supabase JWT via HTTP → matches email to `User`, auto-creates/updates the user.
- `verify_project_access` → owner or enrolled (read).
- `verify_project_owner` → owner-only (write: materials upload, module edit, delete, enrolled-stats).
- `get_enrollment_role` → `owner` | `student` | `None`.

**Routers** (all under `/projects/{project_id}/…`): `projects`, `modules`, `materials`, `resources`, `stats`, `chat`, `stt`, `canvas`, `enrollment`, `users`; mounted in `main.py` with CORS for the Vite dev servers, and migrations + Chroma cleanup on startup (lifespan).

**Layering:** thin routers → SQLAlchemy `models` + Pydantic `schemas` → service layer (`services/`) for heavy logic (RAG, generator, agent, excalidraw, stt). This keeps routes thin and logic testable in isolation.

### 5.2 RAG / materials ingestion (`services/rag.py`)

Upload → `_extract_text` → `_chunk_text` (paragraph-level, 1000-char chunks with 200-char overlap fallback) → store in ChromaDB as vectors with metadata `{material_id, file_name, chunk_index}`. Search is scoped to the project's collection. `cleanup_orphaned_collections()` runs at startup to prune per-project dirs versus live collection IDs.

### 5.3 AI generation (`services/generator.py`)

Fires after each material upload: reads up to 50 context chunks → prompts Groq (strict JSON, `temperature 0.3`) → regenerates **all** modules/points and **appends** 5 resources → rolls back on parse failure. `_parse_json` / `_extract_items` are defensive against markdown-wrapped / non-canonical JSON.

### 5.4 Dual-persona agent (`services/agent.py` + LangGraph)

Graph: `router → (RAG retrieve | skip) → evaluate → student → END`.

- **router:** keyword classifier deciding whether the message needs material retrieval.
- **evaluate:** builds context (material chunks + canvas text + module progress with exact point_ids), asks Groq (JSON mode) for `evaluation_text` + `module_updates`.
- **tutor:** generates the next question (streamed).

`stream_chat_agent` consumes `graph.astream_events` and emits SSE JSON events (`evaluator_start`, `text`, `module_update`, `student_start`, `finish`).

### 5.5 Chat + persistence (`routers/chat.py`)

The heart of the app is the SSE generator: it saves the user message, loads recent history/modules/index, streams via the agent, and on `module_update` writes owner `ModulePoint.checked` or learner `UserPointProgress`, computing course completion and emitting `course_complete`. It also persists the evaluator and tutor replies as two `assistant` messages. On LLM rate limits (429), it returns a friendly error and deletes the orphan user message.

### 5.6 Canvas + voice

- `canvas.py`: GET/PUT `canvas_scenes` scoped to owner (user_id NULL) vs student (user_id). `parse_scene` in `services/excalidraw.py` turns raw Excalidraw elements into a textual description of texts/labels/arrow-connections to feed the agent; `POST /analyze` returns that text.
- Voice input: `services/stt.py` transcribes via Groq Whisper.

### 5.7 Role-based progress model

The subtle design point: an owner's updates go to the global `ModulePoint.checked`, whereas each student's progress lives in `user_point_progress`, so multiple students share the curriculum but track independent completion. `stats` / `enrolled-stats` aggregate each accordingly; access control (`deps.py`) enforces who may write.

## 6. Data Flow / Endpoint Map

```
/projects                          (list-owned+enrolled | create | get | update | delete | regenerate-code)
/projects/join-by-code             (join a course)
/projects/{id}/enroll              (leave a course)
/projects/{id}/modules             (+ points, per-point progress)
/projects/{id}/materials           (list, upload → generate, delete)
/projects/{id}/resources           (list)
/projects/{id}/stats               (owner + student) + /enrolled-stats (owner)
/projects/{id}/chat/messages       (history)  |  /chat/stream (SSE)
/projects/{id}/stt/transcribe      (speech-to-text)
/projects/{id}/canvas              (GET | PUT | analyze)
/users/me ; /health
```

---

# Getting Started (Running the Project)

## Prerequisites

- **Python 3.11+** (backend)
- **Node.js 20+** and **npm** (frontend)
- A **Groq** account + API key → https://console.groq.com
- A **Supabase** project (hosted Postgres + Auth) → https://supabase.com

> The app uses Supabase for the database and authentication. Every request requires a valid Supabase JWT (email/password sign-up with email confirmation enabled).

## Project Layout

```
BujhAI/
├── backend/    # FastAPI app (REST + SSE), SQLAlchemy models, Alembic migrations, RAG & LLM services
│   ├── app/    # routers/, models/, schemas/, services/, main.py
│   └── alembic/
├── frontend/   # React 19 + Vite app (Tailwind v4, Excalidraw, Supabase auth)
└── README.md
```

## 1. Backend Setup

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
# source .venv/bin/activate

pip install -r requirements.txt
```

### Backend environment file (`backend/.env`)

```env
# Database (Supabase PostgreSQL)
# Copy from Supabase > Project Settings > Database > Connection string (pooler / transaction mode).
DATABASE_URL=postgresql+asyncpg://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
DEBUG=false

# Supabase Auth
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Groq Cloud (get your API key at https://console.groq.com)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Local file storage for uploaded materials
MATERIALS_DIR=materials
```

> **Optional SQLite for quick local dev:** the default `backend/.env.example` points at SQLite, but the `aiosqlite` driver is not in `requirements.txt` (the live stack uses Supabase Postgres). If you want SQLite, add `aiosqlite` (`pip install aiosqlite`) and set `DATABASE_URL=sqlite+aiosqlite:///./bujhai.db`. Note that Supabase Auth is still required for login.

### Run the backend

Migrations (001–004) run automatically on startup, or run them manually:

```bash
alembic upgrade head
```

Then start the server (the frontend expects port 8999):

```bash
uvicorn app.main:app --reload --port 8999
```

Backend is now available at `http://localhost:8999` (API docs at `http://localhost:8999/docs`).

## 2. Frontend Setup

```bash
cd frontend
npm install
```

### Frontend environment file (`frontend/.env`)

```env
# Backend API base URL
VITE_API_URL=http://localhost:8999

# Supabase (same project as the backend)
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run the frontend

```bash
npm run dev
```

Frontend is now available at `http://localhost:5173` (the backend CORS whitelist includes `5173` and `5174`).

## 3. First Run Walkthrough

1. Open `http://localhost:5173` and **Sign Up** (email/password; confirm your email if required).
2. Create a **New Project** — note the 7-character **join code** on the project card.
3. Open the project → **Materials** tab → **Upload** a PDF/TXT/DOCX. The AI generates modules, checklist points, and learning resources.
4. Go to the **Study** tab → **Start Learning Session** and chat with the AI tutor. Optionally draw on the canvas or use the mic (voice input).
5. Share the **join code** with others so they can join the course as students.

## 4. Useful Commands

| Action                    | Command (from the relevant folder)                 |
| ------------------------- | --------------------------------------------------- |
| Backend dev server        | `uvicorn app.main:app --reload --port 8999`         |
| Run DB migrations         | `alembic upgrade head`                              |
| Frontend dev server       | `npm run dev`                                       |
| Frontend production build | `npm run build`                                     |
| Frontend lint             | `npm run lint`                                      |

## 5. Troubleshooting

- **`GROQ_API_KEY not configured`** — set `GROQ_API_KEY` in `backend/.env` and restart the backend.
- **Login fails / 401 on every request** — check `SUPABASE_URL` / `SUPABASE_ANON_KEY` in both `backend/.env` and `frontend/.env`; confirm email confirmation is enabled for your Supabase project.
- **DB connection errors** — verify `DATABASE_URL` and make sure your Supabase project allows external connections (IPv4 pooler recommended).
- **`500 Material upload failed`** — the upload pipeline (extract → embed → generate) rolled back; check `GROQ_API_KEY` and that ChromaDB has a writable `backend/chroma_db/` directory.
- **CORS errors on the frontend** — make sure the frontend runs on `http://localhost:5173` or `http://localhost:5174` (the whitelisted origins in `backend/app/main.py`).
