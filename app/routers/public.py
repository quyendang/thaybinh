import base64
import logging
import random
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import FileResponse, HTMLResponse
from starlette.concurrency import run_in_threadpool

from app.services.lessons import LessonNotFoundError

router = APIRouter()
logger = logging.getLogger(__name__)
SALT = "548efb19-9741-4e81-9ad1-dddbe062649d"
RETIRED_SHORT_IDS = frozenset({"firebase", "keys", "geteid", "code"})


def decode_base64_columns(value: str | None) -> list[int]:
    if not value:
        return []
    try:
        padding = "=" * (-len(value) % 4)
        decoded = base64.urlsafe_b64decode((value + padding).encode()).decode()
        return [int(item) for item in decoded.split(",") if item.strip().isdigit()]
    except Exception:
        logger.warning("Invalid base64 column configuration")
        return []


def decode_columns(value: str) -> list[int]:
    return [int(item) for item in value.split(",") if item.isdigit()]


def render_template(request: Request, name: str, context: dict, status_code: int = 200):
    return request.app.state.templates.TemplateResponse(
        request,
        name,
        context,
        status_code=status_code,
    )


def lesson_context(
    payload, hide_columns: list[int], hide_columns_print: list[int]
) -> dict:
    return {
        "words": payload.words,
        "lesson_id": payload.lesson_id,
        "lesson_name": payload.lesson_name,
        "group_name": payload.group_name,
        "hide_columns": hide_columns,
        "hide_columns_print": hide_columns_print,
    }


async def render_lesson(
    request: Request,
    lookup,
    hide_columns: list[int],
    hide_columns_print: list[int],
    shuffle_words: bool = False,
):
    try:
        payload = await run_in_threadpool(lookup)
        words = list(payload.words)
        if shuffle_words:
            random.shuffle(words)
            payload = type(payload)(
                lesson_id=payload.lesson_id,
                lesson_name=payload.lesson_name,
                group_name=payload.group_name,
                words=words,
            )
    except LessonNotFoundError:
        return render_template(
            request,
            "error.html",
            {"error": "Không tìm thấy bài học bạn muốn mở."},
            status_code=404,
        )
    except Exception:
        request.app.state.logger.exception("Public lesson render failed")
        return render_template(
            request,
            "error.html",
            {"error": "Không thể tải bài học lúc này. Vui lòng thử lại sau."},
            status_code=503,
        )
    return render_template(
        request,
        "share.html",
        lesson_context(payload, hide_columns, hide_columns_print),
    )


@router.get("/", response_class=HTMLResponse)
async def homepage(
    request: Request,
    lessonid: str | None = Query(None),
    column: str | None = Query(None),
    print: str | None = Query(None),
    userid: str | None = Query(None),
    groupid: str | None = Query(None),
    sort: str | None = Query(None),
):
    del userid, groupid, sort
    if not lessonid:
        return render_template(request, "landing.html", {})
    lesson_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, lessonid + SALT))
    return await render_lesson(
        request,
        lambda: request.app.state.lesson_service.by_id(lesson_id),
        decode_base64_columns(column),
        decode_base64_columns(print),
    )


@router.get("/share", response_class=HTMLResponse)
async def share_lesson(
    request: Request,
    id: str = Query(..., description="Lesson short_id"),
    c: str = Query(""),
    p: str = Query(""),
):
    clean_id = id.replace("!", "")
    return await render_lesson(
        request,
        lambda: request.app.state.lesson_service.by_short_id(clean_id),
        decode_columns(c),
        decode_columns(p),
        shuffle_words="!" in id,
    )


@router.get("/privacy", response_class=HTMLResponse)
@router.get("/privacypolicy", response_class=HTMLResponse)
async def privacy_page(request: Request):
    return render_template(request, "fasteng-privacy-policy.html", {})


@router.get("/terms", response_class=HTMLResponse)
async def terms_page(request: Request):
    return render_template(request, "fasteng-terms.html", {})


@router.get("/destinationb1", response_class=HTMLResponse)
async def destination_b1_page(request: Request):
    return render_template(request, "destinationb1.html", {})


@router.get("/app-ads.txt", include_in_schema=False)
def get_app_ads(request: Request):
    path = Path(request.app.state.base_dir) / "app-ads.txt"
    if not path.exists():
        raise HTTPException(status_code=404, detail="app-ads.txt not found")
    return FileResponse(
        path,
        media_type="text/plain; charset=utf-8",
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.get("/favicon.ico", include_in_schema=False)
def get_favicon(request: Request):
    path = Path(request.app.state.base_dir) / "favicon.ico"
    if not path.exists():
        raise HTTPException(status_code=404, detail="favicon.ico not found")
    return FileResponse(
        path,
        media_type="image/x-icon",
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.post("/code", include_in_schema=False)
async def retired_code_post():
    raise HTTPException(status_code=404, detail="Not Found")


@router.get("/{short_id}", response_class=HTMLResponse)
async def share_lesson_by_short_id(
    request: Request,
    short_id: str,
    c: str = Query(""),
    p: str = Query(""),
):
    if short_id in RETIRED_SHORT_IDS:
        raise HTTPException(status_code=404, detail="Not Found")
    clean_id = short_id.replace("!", "")
    return await render_lesson(
        request,
        lambda: request.app.state.lesson_service.by_short_id(clean_id),
        decode_columns(c),
        decode_columns(p),
        shuffle_words="!" in short_id,
    )
