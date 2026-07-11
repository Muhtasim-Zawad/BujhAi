import datetime

from pydantic import BaseModel


class CanvasSaveRequest(BaseModel):
    scene_data: str


class CanvasSceneResponse(BaseModel):
    id: str
    project_id: str
    scene_data: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


class CanvasAnalyzeResponse(BaseModel):
    parsed_text: str
