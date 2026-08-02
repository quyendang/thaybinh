import hashlib
import logging
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from supabase import create_client

from app.config import Settings
from app.routers import admin, public
from app.services.lessons import LessonService

logging.basicConfig(level=logging.INFO)
BASE_DIR = Path(__file__).resolve().parent


def share_asset_version() -> str:
    digest = hashlib.sha256()
    asset_paths = (
        "static/css/tokens.css",
        "static/css/share.css",
        "static/js/share.js",
    )
    for relative_path in asset_paths:
        digest.update((BASE_DIR / relative_path).read_bytes())
    return digest.hexdigest()[:12]


def create_app() -> FastAPI:
    settings = Settings.from_environment()
    app = FastAPI(title="FastENG")
    app.state.base_dir = BASE_DIR
    app.state.share_asset_version = share_asset_version()
    app.state.settings = settings
    app.state.logger = logging.getLogger("fasteng")
    app.state.supabase = create_client(settings.supabase_url, settings.supabase_key)
    app.state.supabase_admin = create_client(
        settings.supabase_url, settings.supabase_service_key
    )
    app.state.lesson_service = LessonService(app.state.supabase)

    templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))
    templates.env.filters["comma"] = (
        lambda value: f"{float(value):,.0f}" if value is not None else value
    )
    app.state.templates = templates
    app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
    app.include_router(admin.router)
    app.include_router(public.router)
    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 10000)),
    )
