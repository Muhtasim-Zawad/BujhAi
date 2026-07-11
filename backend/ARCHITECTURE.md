# BujhAI Backend Architecture

## Overview

Full-stack learning platform with AI chat, whiteboard canvas, RAG on uploaded materials, and progress tracking.

- **Frontend:** React 19 + Vite + Tailwind CSS v4 (neobrutalist design)
- **Backend:** FastAPI (async)
- **Database:** SQLite (via aiosqlite) — swap to Postgres/Supabase later
- **Vector Store:** ChromaDB
- **AI Provider:** Groq Cloud (LLM + Whisper STT)
- **AI Orchestration:** LangChain + LangGraph
- **File Storage:** Local filesystem (`materials/` directory)

---

## 1. Project Structure

```
backend/
├── app/
│   ├── main.py                   # FastAPI app, lifespan, CORS
│   ├── config.py                 # Settings (pydantic-settings)
│   ├── database.py               # DB engine & session (async SQLAlchemy)
│   ├── routers/
│   │   ├── projects.py           # CRUD projects
│   │   ├── modules.py            # CRUD modules + points (checklist items)
│   │   ├── rubrics.py            # CRUD rubrics + rubric points
│   │   ├── materials.py          # Upload files, trigger AI generation
│   │   ├── chat.py               # Dual-persona chat endpoint (SSE)
│   │   ├── stats.py              # Aggregated stats
│   │   ├── stt.py                # Speech-to-text (Whisper)
│   │   └── canvas.py             # Save/Load excalidraw scenes
│   ├── models/                   # SQLAlchemy ORM models
│   │   ├── project.py
│   │   ├── module.py
│   │   ├── material.py
│   │   ├── rubric.py
│   │   ├── message.py
│   │   └── canvas_scene.py
│   ├── schemas/                  # Pydantic request/response models
│   │   ├── __init__.py
│   │   ├── project.py
│   │   ├── module.py
│   │   ├── chat.py
│   │   ├── material.py
│   │   ├── rubric.py
│   │   ├── canvas.py
│   │   └── stt.py
│   └── services/
│       ├── rag.py                # ChromaDB ingestion, retrieval
│       ├── llm.py                # Direct Groq client (legacy)
│       ├── agent.py              # LangGraph dual-persona agent
│       ├── generator.py          # AI generation of modules & rubrics
│       ├── stt.py                # Whisper / Groq STT
│       └── excalidraw.py         # Excalidraw JSON => text extraction
├── alembic/                      # DB migrations
├── .env.example
├── pyproject.toml                # Dependencies (uv / poetry)
└── Dockerfile
```

---

## 2. Database Choice

For a single-user project you have two good options:

### Option A: SQLite (Recommended for Now)

- Zero setup — just a file on disk
- No separate server process needed
- Ships with Python (`sqlite3`)
- Easy to migrate later if multi-user is needed
- FastAPI + SQLAlchemy works with it out of the box using `aiosqlite`

### Option B: Supabase Postgres (Future — when auth & multi-device sync are needed)

- Adds auth, file storage, and a hosted Postgres instance
- You'll need to register an account and provision a project
- Better for cloud deployment, multi-user, and collaboration features

**Current recommendation:** Start with SQLite (`aiosqlite`). The ORM models stay the same either way — only the connection string changes. When you're ready for auth/multi-user, switch the connection string to Supabase Postgres.

---

## 3. Table Schemas

```sql
-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE projects (
  id          TEXT PRIMARY KEY,               -- nanoid, set by app
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  badge       TEXT NOT NULL DEFAULT 'New',    -- Active | Draft | Archived | New
  image_url   TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- MODULES (belongs to a project)
-- ============================================================
CREATE TABLE modules (
  id          TEXT PRIMARY KEY,               -- nanoid
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_modules_project ON modules(project_id);

-- ============================================================
-- MODULE POINTS (checklist items inside a module)
-- ============================================================
CREATE TABLE module_points (
  id          TEXT PRIMARY KEY,               -- nanoid
  module_id   TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  checked     INT NOT NULL DEFAULT 0,         -- boolean: 0 or 1
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_points_module ON module_points(module_id);

-- ============================================================
-- MATERIALS (uploaded files)
-- ============================================================
CREATE TABLE materials (
  id            TEXT PRIMARY KEY,             -- nanoid
  project_id    TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name     TEXT NOT NULL,
  file_size     INT NOT NULL,
  mime_type     TEXT NOT NULL,
  file_path     TEXT NOT NULL,                -- local filesystem path
  embedding_id  TEXT,                         -- ChromaDB document ID
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_materials_project ON materials(project_id);

-- ============================================================
-- RUBRICS (grading criteria for a project)
-- ============================================================
CREATE TABLE rubrics (
  id          TEXT PRIMARY KEY,               -- nanoid
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE rubric_points (
  id          TEXT PRIMARY KEY,               -- nanoid
  rubric_id   TEXT NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  checked     INT NOT NULL DEFAULT 0,         -- boolean: 0 or 1
  sort_order  INT NOT NULL DEFAULT 0
);

-- ============================================================
-- MESSAGES (chat history)
-- ============================================================
CREATE TABLE messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content     TEXT NOT NULL,
  metadata    TEXT DEFAULT '{}',              -- JSON string
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_messages_project ON messages(project_id, created_at);

-- ============================================================
-- CANVAS SCENES (excalidraw saves)
-- ============================================================
CREATE TABLE canvas_scenes (
  id          TEXT PRIMARY KEY,               -- nanoid
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_data  TEXT NOT NULL,                  -- JSON string (excalidraw elements)
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_canvas_project ON canvas_scenes(project_id);
```

---

## 4. Tech Stack

| Layer                | Choice                          | Why                                             |
| -------------------- | ------------------------------- | ----------------------------------------------- |
| **Framework**        | FastAPI                         | Async, auto OpenAPI, SSE for streaming          |
| **ORM**              | SQLAlchemy 2.0 (async)          | Mature, Alembic migrations                      |
| **DB**               | SQLite (aiosqlite)              | Zero setup, file-based, easy to migrate later   |
| **Vector store**     | ChromaDB                        | Persistent, simple API, runs alongside FastAPI  |
| **LLM provider**     | Groq Cloud                      | Fast inference, free tier, Llama/Mixtral models |
| **AI orchestration** | LangChain + LangGraph           | LangGraph for multi-step agent workflows        |
| **STT**              | Groq Cloud Whisper API          | Cheap, fast, same provider as LLMs              |
| **File storage**     | Local filesystem (`materials/`) | Simple — swap to S3/Supabase later              |
| **Excalidraw->text** | Custom parser + LLM             | Extract elements JSON > LLM summarizes          |

> **Auth:** Skipped for now (single-user). When multi-user is needed, add Supabase Auth + swap SQLite for Postgres.

---

## 5. Key Implementation Details

### 5a. RAG Pipeline (`services/rag.py`)

```
Upload PDF -> Extract text (PyMuPDF/unstructured)
           -> Chunk (RecursiveCharacterTextSplitter)
           -> Embed (Groq embeddings or sentence-transformers)
           -> Store in ChromaDB (metadata: project_id, material_id)

Chat query -> Retrieve relevant chunks from ChromaDB (filter by project_id)
           -> Build prompt with context -> Groq LLM -> Stream response
```

**Key:** Filter ChromaDB by `project_id` so each project has isolated RAG.

### 5b. LangGraph Dual-Persona Agent (`services/agent.py`)

The agent orchestrates two AI personas per user message:

```
User message
  |- [node] router: does message need RAG?
  |   |- yes -> [node] retrieve_context (ChromaDB)
  |   \- no  -> skip
  |- [node] evaluate: evaluate user answer against rubrics
  |   -> generates evaluator assessment text
  |   -> generates rubric_updates (which points to check/uncheck)
  |- [node] student: generate next teaching response
  |   -> uses materials + module progress + rubric state
  |- Output: streamed SSE events (evaluator -> rubric_update -> student)
```

**State:**

```python
class AgentState(TypedDict):
    messages: list[BaseMessage]    # conversation history
    user_input: str                # current user message
    project_id: str
    needs_rag: bool                # RAG classifier output
    context_chunks: list[dict]     # ChromaDB retrieval results
    modules: list[dict]            # current module state (for context)
    rubrics: list[dict]            # current rubric state (for evaluation)
    evaluator_response: str        # evaluator assessment text
    rubric_updates: list[dict]     # [{rubric_id, point_id, checked}]
    student_response: str          # student question/response text
```

**Streaming event order (SSE):**

```
data: {"type": "evaluator_start"}
data: {"type": "text", "text": "Great answer! You correctly..."}     # streaming
data: {"type": "text", "text": " explained the concept of..."}
data: {"type": "rubric_update", "updates": [
  {"rubric_id": "r1", "point_id": "p1", "checked": true},
  {"rubric_id": "r1", "point_id": "p2", "checked": false}
]}
data: {"type": "student_start"}
data: {"type": "text", "text": "Now let's explore..."}               # streaming
data: {"type": "finish", "finishReason": "stop"}
```

### 5c. Excalidraw to Text (`services/excalidraw.py`)

Excalidraw's scene data is a JSON array of elements:

```json
[
	{ "type": "text", "text": "Hello", "x": 100, "y": 200 },
	{
		"type": "rectangle",
		"width": 150,
		"height": 80,
		"label": { "text": "Box A" }
	},
	{
		"type": "arrow",
		"points": [
			[0, 0],
			[100, 50]
		]
	}
]
```

**Pipeline:**

1. Extract all text elements -> concatenate
2. For shapes, extract any `label.text` or `groupIds`
3. For arrows/connectors, infer relationships
4. Pass the structured description to the LLM as context:
   > "The user drew a diagram with boxes labeled [X, Y, Z] connected by arrows indicating [A->B, B->C]."

This can be done in a LangChain chain: `ExcalidrawParser -> format_docs -> LLM`.

### 5d. STT for Microphone (`services/stt.py`)

**Frontend:** Use `MediaRecorder` API to capture audio -> send blob to backend.
**Backend:** Groq's Whisper endpoint -> returns transcript -> prepend to chat input.

Groq's `/openai/v1/audio/transcriptions` accepts multipart form with audio file:

```python
@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    transcript = groq_client.audio.transcriptions.create(
        model="whisper-large-v3",
        file=("audio.webm", audio_bytes, "audio/webm"),
    )
    return {"text": transcript.text}
```

### 5e. Chat Streaming (SSE)

Each user message produces a combined response with three phases:

| Phase | Event Type | Description |
|---|---|---|
| Evaluator | `evaluator_start` → `text` tokens → `rubric_update` | Assesses user answer against rubrics, returns which criteria are met |
| Student | `student_start` → `text` tokens | Generates next teaching question/response based on materials + module progress |

The single endpoint handles both personas — no explicit mode flag needed:

```python
@router.post("/projects/{pid}/chat/stream")
async def chat_stream(body: ChatRequest, db: AsyncSession = Depends(get_db)):
    async def event_generator():
        async for event in stream_chat_agent(project_id, history, body.message):
            yield f"data: {json.dumps(event)}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

**Frontend:** Listen for `evaluator_start`/`student_start` to toggle UI styles, `text` for content, `rubric_update` to update rubric checkboxes, `finish` to end the stream.

### 5f. AI Generation of Modules & Rubrics (`services/generator.py`)

Triggered automatically after every material upload. The pipeline:

```
Upload material
  -> Extract text
  -> Chunk + embed -> Store in ChromaDB  (RAG pipeline)
  -> LLM prompt: "Given this material, suggest modules and rubrics"
  -> Parse structured JSON response
  -> Delete old modules/rubrics for this project
  -> Create new Module + ModulePoint records
  -> Create new Rubric + RubricPoint records
  -> Return generated data alongside upload response
```

**LLM prompt structure:**

```
You are a curriculum designer. Based on the following learning material,
suggest modules (topics to cover) and evaluation rubrics (grading criteria).

Respond ONLY with valid JSON:
{
  "modules": [
    {"title": "Module name", "points": [
      {"text": "Checklist item description"}
    ]}
  ],
  "rubrics": [
    {"title": "Criteria name", "points": [
      {"text": "Standard description"}
    ]}
  ]
}
```

**Key rules:**
- Generation replaces all existing modules and rubrics for the project
- Users can manually edit/add/delete after generation via CRUD endpoints
- Empty materials (no extractable text) skip generation
- If multiple materials exist, all content is combined as context

---

## 6. Frontend-Backend Integration Points

| Frontend Component         | Backend Endpoint                                                  | Notes                                              |
| -------------------------- | ----------------------------------------------------------------- | -------------------------------------------------- |
| `Dashboard` (load)         | `GET /projects`                                                   | List all projects                                  |
| `Dashboard` (create)       | `POST /projects`                                                  |                                                    |
| `Dashboard` (delete)       | `DELETE /projects/{id}`                                           |                                                    |
| `ChatInterface` (send)     | `POST /projects/{id}/chat/stream`                                 | SSE: evaluator + student combined response         |
| `ChatInterface` (mic)      | `POST /projects/{id}/stt/transcribe`                              | Audio->text via Whisper                            |
| `ChatRightSidebar`         | `GET/POST/PUT/DELETE /projects/{id}/modules`                      | Modules CRUD                                       |
| `ChatRightSidebar` (pts)   | `POST/PUT/DELETE /projects/{id}/modules/{mid}/points`             | Module point CRUD (checklist items)                |
| `Materials` (upload)       | `POST /projects/{id}/materials/upload`                            | Save file + trigger AI generation of modules/rubrics |
| `Materials` (rubrics)      | `GET/POST/PUT/DELETE /projects/{id}/rubrics`                      | Rubrics CRUD                                       |
| `Materials` (rubric pts)   | `POST/PUT/DELETE /projects/{id}/rubrics/{rid}/points`             | Rubric point CRUD (standards)                      |
| `Stats`                    | `GET /projects/{id}/stats`                                        | Aggregated stats                                   |
| `Canvas` (save)            | `PUT /projects/{id}/canvas`                                       |                                                    |
| `Canvas` (load)            | `GET /projects/{id}/canvas`                                       |                                                    |
| `Canvas` (analyze)         | `POST /projects/{id}/canvas/analyze`                              | Parse excalidraw JSON -> text                      |

---

## 7. Implementation Order

### Completed
1. **FastAPI scaffold** — SQLite, 8 ORM models, router stubs, health check
2. **Project CRUD** — full Create/Read/Update/Delete with DB persistence
3. **Chat with Groq streaming** — SSE streaming, message persistence
4. **RAG pipeline** — material upload → chunk → embed (ChromaDB) → retrieve
5. **STT** — Groq Whisper endpoint, format validation
6. **Excalidraw->text** — parser service + canvas CRUD
7. **LangGraph agent** — dual-persona agent with RAG routing

### Remaining
8. **Modules CRUD** — full endpoints for modules + points (manual + AI-generated)
9. **Rubric points CRUD** — endpoints for rubric points (standards check/uncheck)
10. **AI generator service** — `services/generator.py`: auto-generate modules & rubrics from uploaded materials
11. **Dual-persona chat** — integrate evaluator + student nodes into agent, emit rubric_updates in SSE
12. **Stats endpoint** — aggregate project stats
13. **Auth (future)** — Supabase Auth, swap SQLite for Postgres, RLS policies

### Key Design Decisions
- **Auto-generation** triggers on every material upload, replacing old modules/rubrics
- **Manual editing** always possible after generation via CRUD endpoints
- **Combined chat response** per message: evaluator assesses → rubric updates → student teaches
- **Rubric progress** determines when a module is complete (all points checked → next module)

---

## 8. Key Dependencies (`requirements.txt`)

```requirements
dependencies = [
    "fastapi[standard]>=0.115.0",
    "sqlalchemy[asyncio]>=2.0",
    "aiosqlite>=0.20",                 # SQLite async driver
    "alembic>=1.13",
    "langchain>=0.3.0",
    "langchain-groq>=0.2.0",
    "langgraph>=0.2.0",
    "chromadb>=0.5.0",
    "groq>=0.12.0",                    # Direct API + Whisper STT
    "pypdf>=5.0",                      # PDF text extraction
    "python-multipart>=0.0.9",
    "pydantic-settings>=2.4",
    "httpx>=0.27",
]
```

---

## Appendix: Data Models

### Backend Pydantic Schemas

```python
# Project
class ProjectResponse:
    id: str
    title: str
    description: str
    badge: str          # "New" | "Active" | "Draft" | "Archived"
    image_url: str | None
    button_text: str | None
    created_at: datetime
    updated_at: datetime | None

# Module + Points
class ModuleResponse:
    id: str
    project_id: str
    title: str
    sort_order: int
    points: list[ModulePointResponse]

class ModulePointResponse:
    id: str
    module_id: str
    text: str
    checked: bool
    sort_order: int

# Rubric + Points
class RubricResponse:
    id: str
    project_id: str
    title: str
    sort_order: int
    points: list[RubricPointResponse]

class RubricPointResponse:
    id: str
    rubric_id: str
    text: str
    checked: bool
    sort_order: int

# Material
class MaterialResponse:
    id: str
    project_id: str
    file_name: str
    file_size: int
    mime_type: str
    chunk_count: int | None

# Message
class MessageResponse:
    id: int
    role: str            # "user" | "assistant" | "system"
    content: str
    metadata_json: str
    created_at: datetime
```

### SSE Chat Events

```javascript
// Combined response per user message, streamed in order:

// Phase 1 — Evaluator assessment
{ "type": "evaluator_start" }                                                  // evaluator begins
{ "type": "text", "text": "Great point!..." }                                 // streaming token
{ "type": "rubric_update", "updates": [                                       // which rubric criteria were met
  { "rubric_id": "...", "point_id": "...", "checked": true },
  { "rubric_id": "...", "point_id": "...", "checked": false }
]}

// Phase 2 — Student follow-up
{ "type": "student_start" }                                                    // student persona begins
{ "type": "text", "text": "Now let's..." }                                    // streaming token

// End
{ "type": "finish", "finishReason": "stop" }

// Error
{ "type": "error", "text": "Error message" }
```

### Frontend State Shapes

```javascript
// Project
{ title: string, description: string, image: string, badge: string,
  buttonText: string, modules: [ Module ] }

// Module
{ id: string, title: string, points: [{ id: string, text: string, checked: boolean }] }

// Rubric (same shape as Module)
{ id: string, title: string, points: [{ id: string, text: string, checked: boolean }] }

// Message
{ id: number, role: "user" | "assistant" | "eval", content: string,
  timestamp: Date, metadata: {} }

// Material
{ id: string, name: string, size: number, type: string }
```
