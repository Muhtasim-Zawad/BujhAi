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
│   │   ├── modules.py            # CRUD modules, points, progress
│   │   ├── materials.py          # Upload files, CRUD rubrics
│   │   ├── chat.py               # Chat endpoint (SSE streaming)
│   │   ├── stats.py              # Aggregated stats
│   │   └── canvas.py             # Save/Load excalidraw scenes
│   ├── models/                   # SQLAlchemy ORM models
│   │   ├── project.py
│   │   ├── module.py
│   │   ├── material.py
│   │   ├── rubric.py
│   │   ├── message.py
│   │   └── canvas_scene.py
│   ├── schemas/                  # Pydantic request/response models
│   └── services/
│       ├── rag.py                # ChromaDB ingestion, retrieval
│       ├── llm.py                # LangChain + Groq orchestration
│       ├── agent.py              # LangGraph workflow definition
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

| Layer | Choice | Why |
|---|---|---|
| **Framework** | FastAPI | Async, auto OpenAPI, SSE for streaming |
| **ORM** | SQLAlchemy 2.0 (async) | Mature, Alembic migrations |
| **DB** | SQLite (aiosqlite) | Zero setup, file-based, easy to migrate later |
| **Vector store** | ChromaDB | Persistent, simple API, runs alongside FastAPI |
| **LLM provider** | Groq Cloud | Fast inference, free tier, Llama/Mixtral models |
| **AI orchestration** | LangChain + LangGraph | LangGraph for multi-step agent workflows |
| **STT** | Groq Cloud Whisper API | Cheap, fast, same provider as LLMs |
| **File storage** | Local filesystem (`materials/`) | Simple — swap to S3/Supabase later |
| **Excalidraw->text** | Custom parser + LLM | Extract elements JSON > LLM summarizes |

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

### 5b. LangGraph Agent (`services/agent.py`)

A simple agent graph:

```
User message
  |- [node] router: does message need RAG? (classifier)
  |   |- yes -> [node] retrieve_context
  |   \- no  -> skip
  |- [node] build_prompt (system + context + history)
  |- [node] call_llm (Groq streaming)
  \- [node] save_message (to DB)
```

Later you can add tool nodes (e.g., "fetch module stats", "create rubric point").

### 5c. Excalidraw to Text (`services/excalidraw.py`)

Excalidraw's scene data is a JSON array of elements:

```json
[
  { "type": "text", "text": "Hello", "x": 100, "y": 200 },
  { "type": "rectangle", "width": 150, "height": 80, "label": { "text": "Box A" } },
  { "type": "arrow", "points": [[0,0], [100,50]] }
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

```python
@router.post("/projects/{pid}/chat/stream")
async def chat_stream(body: ChatRequest, db: AsyncSession = Depends(get_db)):
    async def event_generator():
        async for token in agent.astream(...):
            yield f"data: {json.dumps({'token': token})}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

**Frontend:** Use `@ai-sdk/react`'s `useChat` hook which already handles SSE.

---

## 6. Frontend-Backend Integration Points

| Frontend Component | Backend Endpoint | Notes |
|---|---|---|
| `Dashboard` (load) | `GET /projects` | List all projects |
| `Dashboard` (create) | `POST /projects` | |
| `Dashboard` (delete) | `DELETE /projects/{id}` | |
| `ChatInterface` (send) | `POST /projects/{id}/chat/stream` | SSE stream |
| `ChatInterface` (mic) | `POST /transcribe` | Audio->text |
| `ChatRightSidebar` | `GET/POST/PUT/DELETE /projects/{id}/modules` | Modules CRUD |
| `Materials` (upload) | `POST /projects/{id}/materials/upload` | Save to local `materials/` |
| `Materials` (rubrics) | `GET/POST/PUT/DELETE /projects/{id}/rubrics` | Rubrics CRUD |
| `Stats` | `GET /projects/{id}/stats` | Aggregated stats |
| `Canvas` (save) | `PUT /projects/{id}/canvas` | |
| `Canvas` (load) | `GET /projects/{id}/canvas` | |

---

## 7. Implementation Order

1. **FastAPI scaffold** — single-file start, SQLite DB, basic routers
2. **Project CRUD** — full Create/Read/Update/Delete with DB persistence
3. **Chat with mock -> switch to Groq** — streaming first, then add LangChain
4. **RAG pipeline** — material upload -> chunk -> embed -> retrieve
5. **STT** — mic button works end-to-end
6. **Excalidraw->text** — pass canvas as context in chat
7. **LangGraph** — agent workflows (optional, after basic chat is solid)
8. **Auth (future)** — Supabase Auth, swap SQLite for Postgres, RLS policies

**Quick win:** Step 3 alone (chat streaming with Groq) will make the app feel alive — you can add RAG and STT incrementally after.

---

## 8. Key Dependencies (`pyproject.toml`)

```toml
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

## Appendix: Frontend Data Models (for reference)

```javascript
// Project (from Dashboard.jsx)
{
  title: string,
  description: string,
  image: string,              // avatar URL
  badge: string,              // "Active" | "Draft" | "Archived" | "New"
  buttonText: string,         // "Open Project"
  modules: [ Module ]
}

// Module (from right sidebar)
{
  id: string,                 // "id-N" (counter-based)
  title: string,              // "Module N"
  points: [
    { id: string, text: string, checked: boolean }
  ]
}

// Message (from ChatInterface)
{
  id: number,                 // Date.now()
  role: "user" | "assistant",
  content: string,
  timestamp: Date,
  metadata: {}                // excalidraw scene, file refs, etc.
}

// Material (from Materials.jsx)
{
  id: string,
  name: string,
  size: number,               // bytes
  type: string                // MIME type
}

// Rubric (from Materials.jsx — same shape as Module)
{
  id: string,
  title: string,              // "Criteria N"
  points: [
    { id: string, text: string, checked: boolean }
  ]
}
```
