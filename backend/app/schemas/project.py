import datetime

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    image_url: str | None = None
    badge: str = Field(default="New", max_length=50)
    button_text: str = Field(default="Open Project", max_length=100)


class ProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    badge: str | None = Field(default=None, max_length=50)
    button_text: str | None = Field(default=None, max_length=100)


class ProjectResponse(BaseModel):
    id: str
    title: str
    description: str
    badge: str
    image_url: str | None
    button_text: str | None
    created_at: datetime.datetime
    updated_at: datetime.datetime | None

    model_config = {"from_attributes": True}
