from pydantic import BaseModel


class MaterialResponse(BaseModel):
    id: str
    project_id: str
    file_name: str
    file_size: int
    mime_type: str
    chunk_count: int | None = None

    model_config = {"from_attributes": True}
