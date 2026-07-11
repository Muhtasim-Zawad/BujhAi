from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database import init_db
from app.routers import canvas, chat, materials, modules, projects, stats


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

app.include_router(projects.router)
app.include_router(modules.router)
app.include_router(materials.router)
app.include_router(chat.router)
app.include_router(stats.router)
app.include_router(canvas.router)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
