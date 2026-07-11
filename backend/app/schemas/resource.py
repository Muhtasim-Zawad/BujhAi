import datetime

from pydantic import BaseModel


class ResourceResponse(BaseModel):
    id: str
    project_id: str
    title: str
    content: str
    resource_type: str
    sort_order: int
    created_at: datetime.datetime

    model_config = {"from_attributes": True}
