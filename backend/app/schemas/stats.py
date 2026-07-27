from pydantic import BaseModel


class ProjectStats(BaseModel):
    total_materials: int = 0
    total_chunks: int = 0
    total_enrolled: int = 0
    enrolled_completed: int = 0
    total_modules: int = 0
    module_points_completed: int = 0
    module_points_total: int = 0
    join_code: str = ""


class ModuleProgressStats(BaseModel):
    module_id: str
    module_title: str
    total_points: int
    completed_points: int


class EnrolledUserStats(BaseModel):
    user_id: str
    user_name: str
    email: str
    total_points: int
    points_completed: int
    modules: list[ModuleProgressStats]


class EnrolledStatsResponse(BaseModel):
    enrolled: list[EnrolledUserStats]
