import os
import json
import uuid
import tempfile
from typing import Dict
import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pptx import Presentation
from pptx.util import Inches, Pt
from models import ProjectCreate, ProjectResponse, ProjectData, Task

router = APIRouter(prefix="/projects", tags=["projects"])

# In-memory database storing project_id -> ProjectData
PROJECTS_DB: Dict[str, ProjectData] = {}

GATEWAY_URL = "https://latentstack.dev/v1/chat/completions"
MODEL_NAME = "gemini-3.6-flash"

SYSTEM_PROMPT = """You are an expert AI project manager.
Decompose the user's project brief into 3 to 6 logical sequential or parallel tasks.
Return ONLY valid raw JSON with no Markdown formatting, code blocks, or preamble.
The JSON must strictly conform to this schema:
[
  {
    "id": 1,
    "title": "Short title",
    "description": "Detailed description of task",
    "depends_on": [],
    "status": "pending"
  }
]
Field rules:
- id: integer starting from 1
- title: string
- description: string
- depends_on: list of task integer ids that must be completed before this task
- status: string, always "pending"
"""

@router.post("", response_model=ProjectResponse)
def create_project(project: ProjectCreate):
    api_key = os.getenv("LATENTSTACK_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=502,
            detail="LATENTSTACK_API_KEY environment variable is not set."
        )

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Project Brief: {project.brief}"}
        ],
        "temperature": 0.2
    }

    try:
        response = httpx.post(GATEWAY_URL, headers=headers, json=payload, timeout=30.0)
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to communicate with LLM gateway: {str(exc)}"
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"LLM gateway returned error status {response.status_code}: {response.text}"
        )

    try:
        data = response.json()
        content = data["choices"][0]["message"]["content"].strip()
        
        # Clean potential markdown code fences if model outputted ```json ... ```
        if content.startswith("```"):
            lines = content.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            content = "\n".join(lines).strip()

        raw_tasks = json.loads(content)
        if not isinstance(raw_tasks, list):
            raise ValueError("Expected JSON response to be a list of tasks.")

        tasks = [Task(**task_data) for task_data in raw_tasks]
    except (json.JSONDecodeError, KeyError, ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse model JSON response: {str(exc)}. Raw response: {response.text}"
        )

    project_id = str(uuid.uuid4())
    project_data = ProjectData(project_id=project_id, brief=project.brief, tasks=tasks)
    PROJECTS_DB[project_id] = project_data

    return ProjectResponse(project_id=project_id, tasks=tasks)


@router.get("/{project_id}/summary-deck")
def generate_summary_deck(project_id: str):
    if project_id not in PROJECTS_DB:
        raise HTTPException(status_code=404, detail="Project not found")

    project_data = PROJECTS_DB[project_id]

    prs = Presentation()

    # Title slide layout (0)
    title_slide_layout = prs.slide_layouts[0]
    slide1 = prs.slides.add_slide(title_slide_layout)
    title1 = slide1.shapes.title
    subtitle1 = slide1.placeholders[1]

    title1.text = "Project Summary"
    subtitle1.text = f"Brief: {project_data.brief}"

    # Tasks slide layout - Title & Content (1)
    bullet_slide_layout = prs.slide_layouts[1]
    slide2 = prs.slides.add_slide(bullet_slide_layout)
    shapes2 = slide2.shapes
    title2 = shapes2.title
    title2.text = "Task Status Breakdown"

    tf2 = shapes2.placeholders[1].text_frame
    tf2.word_wrap = True

    pending_tasks = [t for t in project_data.tasks if t.status == "pending"]
    done_tasks = [t for t in project_data.tasks if t.status == "done"]

    p = tf2.paragraphs[0]
    p.text = f"Pending Tasks ({len(pending_tasks)}):"
    p.font.bold = True
    p.font.size = Pt(20)

    if pending_tasks:
        for t in pending_tasks:
            p_task = tf2.add_paragraph()
            p_task.text = f"• #{t.id}: {t.title} - {t.description}"
            p_task.level = 1
            p_task.font.size = Pt(16)
    else:
        p_none = tf2.add_paragraph()
        p_none.text = "• None"
        p_none.level = 1

    p_done_hdr = tf2.add_paragraph()
    p_done_hdr.text = f"\nDone Tasks ({len(done_tasks)}):"
    p_done_hdr.font.bold = True
    p_done_hdr.font.size = Pt(20)

    if done_tasks:
        for t in done_tasks:
            p_task = tf2.add_paragraph()
            p_task.text = f"• #{t.id}: {t.title} - {t.description}"
            p_task.level = 1
            p_task.font.size = Pt(16)
    else:
        p_none = tf2.add_paragraph()
        p_none.text = "• None"
        p_none.level = 1

    # Closing slide - Title & Content (1)
    slide3 = prs.slides.add_slide(bullet_slide_layout)
    title3 = slide3.shapes.title
    title3.text = "Project Statistics & Summary"

    tf3 = slide3.placeholders[1].text_frame
    tf3.word_wrap = True

    total_count = len(project_data.tasks)
    completed_count = len(done_tasks)

    p_stat1 = tf3.paragraphs[0]
    p_stat1.text = f"Total Tasks: {total_count}"
    p_stat1.font.size = Pt(22)

    p_stat2 = tf3.add_paragraph()
    p_stat2.text = f"Completed Tasks: {completed_count}"
    p_stat2.font.size = Pt(22)

    p_stat3 = tf3.add_paragraph()
    p_stat3.text = f"Completion Rate: {(completed_count / total_count * 100) if total_count > 0 else 0:.1f}%"
    p_stat3.font.size = Pt(22)

    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, f"summary_deck_{project_id}.pptx")
    prs.save(file_path)

    media_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    filename = f"project_{project_id}_summary.pptx"

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=filename
    )

