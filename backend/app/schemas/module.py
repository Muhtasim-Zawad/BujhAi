import datetime

from pydantic import BaseModel, Field


class ModulePointCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)
    sort_order: int | None = None


class ModulePointUpdate(BaseModel):
    text: str | None = Field(default=None, min_length=1, max_length=500)
    checked: bool | None = None


class ModulePointResponse(BaseModel):
    id: str
    module_id: str
    text: str
    checked: bool
    sort_order: int

    model_config = {"from_attributes": True}


class ModuleCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)


class ModuleUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)


class ModuleResponse(BaseModel):
    id: str
    project_id: str
    title: str
    sort_order: int
    points: list[ModulePointResponse] = []

    model_config = {"from_attributes": True}
