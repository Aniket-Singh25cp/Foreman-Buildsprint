from pydantic import BaseModel
from typing import List, Optional

class ProjectCreate(BaseModel):
    brief: str

class TaskUpdate(BaseModel):
    status: str

class Task(BaseModel):
    id: int
    title: str
    description: str = ""
    depends_on: List[int] = []
    status: str = "pending"

class ProjectData(BaseModel):
    project_id: str
    brief: str
    tasks: List[Task]

class ProjectResponse(BaseModel):
    project_id: str
    tasks: List[Task]

