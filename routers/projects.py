from fastapi import APIRouter
from models import ProjectCreate, ProjectResponse, Task

router = APIRouter(prefix="/projects", tags=["projects"])

@router.post("", response_model=ProjectResponse)
def create_project(project: ProjectCreate):
    stub_tasks = [
        Task(id=1, title="Define system architecture and scope", status="pending"),
        Task(id=2, title="Set up database schemas and migrations", status="pending"),
        Task(id=3, title="Implement core API endpoints", status="pending"),
        Task(id=4, title="Build front-end UI components", status="pending"),
    ]
    return ProjectResponse(tasks=stub_tasks)
