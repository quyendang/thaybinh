"""Local-only profile review; does not import main, credentials or Supabase.

Run: python3 scripts/preview_research_profile.py
Open: http://127.0.0.1:10001/#pi-profile
"""

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

BASE_DIR = Path(__file__).resolve().parents[1]
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")


@app.middleware("http")
async def prevent_indexing(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Robots-Tag"] = "noindex, nofollow, noarchive"
    response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/", response_class=HTMLResponse)
async def preview(request: Request):
    return templates.TemplateResponse(
        request,
        "landing.html",
        {"show_research_profile": True, "profile_preview": True},
    )


@app.get("/projects/learning-trajectory-architect", response_class=HTMLResponse)
async def project(request: Request):
    return templates.TemplateResponse(request, "learning-trajectory.html", {})


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse(BASE_DIR / "favicon.ico")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=10001)
