from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class ProjectCreate(BaseModel):
    brief: str = Field(..., min_length=10, max_length=2000, description="Project brief description")

class TaskUpdate(BaseModel):
    status: Literal["pending", "done"]

class Task(BaseModel):
    id: int
    title: str
    description: str = ""
    depends_on: List[int] = []
    status: Literal["pending", "done"] = "pending"

class ProjectData(BaseModel):
    project_id: str
    brief: str
    tasks: List[Task]

class ProjectResponse(BaseModel):
    project_id: str
    tasks: List[Task]


