from pydantic import BaseModel
from typing import List

class ProjectCreate(BaseModel):
    brief: str

class Task(BaseModel):
    id: int
    title: str
    status: str = "pending"

class ProjectResponse(BaseModel):
    tasks: List[Task]
