from fastapi import FastAPI
from dotenv import load_dotenv
from routers import projects

load_dotenv()

app = FastAPI(title="Foreman")

app.include_router(projects.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Foreman API"}
