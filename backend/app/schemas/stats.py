from pydantic import BaseModel


class ProjectStats(BaseModel):
    total_materials: int = 0
    total_chunks: int = 0
    total_messages: int = 0
    total_modules: int = 0
    module_points_completed: int = 0
    module_points_total: int = 0
    total_rubrics: int = 0
    rubric_criteria_checked: int = 0
    rubric_criteria_total: int = 0
