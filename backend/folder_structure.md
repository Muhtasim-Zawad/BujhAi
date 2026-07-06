```
backend/
├── app/
│   ├── main.py                 # FastAPI app instance, startup/shutdown events, router mounting
│   ├── config.py                # Settings (env vars, API keys, DB URL) via pydantic-settings
│   │
│   ├── api/
│   │   ├── deps.py              # Shared dependencies (get_db, get_current_user, etc.)
│   │   └── v1/
│   │       ├── auth.py          # Login/signup routes
│   │       ├── documents.py     # Upload, ingestion status routes
│   │       ├── sessions.py      # WebSocket session routes (chat loop)
│   │       ├── canvas.py        # Canvas snapshot parsing routes
│   │       ├── study_groups.py  # Group CRUD routes
│   │       ├── srs.py           # Spaced repetition due/review routes
│   │       └── export.py        # Study sheet export routes
│   │
│   ├── models/                  # SQLAlchemy ORM models (one file per table/domain)
│   │   ├── user.py
│   │   ├── document.py
│   │   ├── rubric.py
│   │   ├── session.py
│   │   ├── srs.py
│   │   └── study_group.py
│   │
│   ├── schemas/                 # Pydantic request/response models (mirrors models/)
│   │   ├── user.py
│   │   ├── document.py
│   │   ├── session.py
│   │   └── ...
│   │
│   ├── services/                 # Core business logic — the "brains" of each feature
│   │   ├── evaluator_agent.py    # Evaluator agent prompt + RAG call logic
│   │   ├── student_agent.py      # Student agent prompt + persona logic
│   │   ├── rag_pipeline.py        # Chunking, embedding, retrieval
│   │   ├── rubric_engine.py       # Rubric generation + update logic
│   │   ├── knowledge_graph.py     # KG generation from source docs
│   │   ├── srs_scheduler.py       # SM-2 style interval calculation
│   │   ├── canvas_parser.py       # Vision LLM call for canvas images
│   │   └── export_builder.py      # Study sheet compilation (MD → PDF)
│   │
│   ├── llm/                      # Thin wrappers around external AI providers
│   │   ├── client.py              # LLM API client (Claude/GPT call wrapper)
│   │   ├── embeddings.py           # Embedding model calls
│   │   └── stt.py                  # Whisper/Groq STT wrapper
│   │
│   ├── db/
│   │   ├── session.py              # DB engine/session factory
│   │   └── base.py                  # Base declarative class, import hook for models
│   │
│   ├── workers/                     # Background jobs (arq/Celery tasks)
│   │   ├── ingestion_worker.py       # Document → chunks → embeddings → rubric/KG
│   │   └── export_worker.py           # Async study sheet generation
│   │
│   └── core/
│       ├── security.py                # JWT, password hashing
│       └── websocket_manager.py       # Connection registry for session sockets
│
├── alembic/                    # DB migrations
├── tests/                       # Mirrors app/ structure (unit + integration tests)
├── .env                          # Local secrets (never committed)
├── requirements.txt / pyproject.toml
└── docker-compose.yml            # Postgres, Redis, backend services
```

**Quick reference — what goes where:**

| Folder      | Purpose                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `api/v1/`   | Route definitions only — thin, just calls into `services/`                |
| `models/`   | Database table definitions (SQLAlchemy)                                   |
| `schemas/`  | Request/response validation shapes (Pydantic)                             |
| `services/` | All actual feature logic (agents, rubric, KG, SRS, exports)               |
| `llm/`      | Isolated external API calls — swap providers without touching `services/` |
| `db/`       | Connection/session setup only                                             |
| `workers/`  | Long-running async jobs kicked off from routes                            |
| `core/`     | Cross-cutting infra: auth, websocket connection state                     |

This keeps routes thin, business logic testable in isolation (`services/`), and LLM provider swaps contained to one folder (`llm/`) — useful if you switch between Claude/GPT or Whisper providers mid-hackathon without touching your agent logic.
