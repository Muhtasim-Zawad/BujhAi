from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import canvas, chat, materials, modules, projects, resources, rubrics, stats, stt


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="BujhAI Backend",
    description="Modular FastAPI backend for BujhAI",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(modules.router)
app.include_router(materials.router)
app.include_router(rubrics.router)
app.include_router(stt.router)
app.include_router(chat.router)
app.include_router(resources.router)
app.include_router(stats.router)
app.include_router(canvas.router)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
