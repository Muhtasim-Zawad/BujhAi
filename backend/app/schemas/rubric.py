from pydantic import BaseModel, Field


class RubricCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)


class RubricResponse(BaseModel):
    id: str
    project_id: str
    title: str
    sort_order: int
    points: list["RubricPointResponse"] = []

    model_config = {"from_attributes": True}


class RubricPointCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)
    sort_order: int | None = None


class RubricPointUpdate(BaseModel):
    text: str | None = Field(default=None, min_length=1, max_length=500)
    checked: bool | None = None


class RubricPointResponse(BaseModel):
    id: str
    rubric_id: str
    text: str
    checked: bool
    sort_order: int

    model_config = {"from_attributes": True}
