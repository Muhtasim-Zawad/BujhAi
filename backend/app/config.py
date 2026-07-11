from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./bujhai.db"
    debug: bool = False

    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    materials_dir: str = "materials"
    chroma_db_dir: str = "chroma_db"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
