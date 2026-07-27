import os
import re
import uuid
import base64
import logging
import random
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
from fastapi import FastAPI, Query, Request, Form, HTTPException, Header, Depends
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from supabase import create_client, Client

from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from cryptography.fernet import Fernet, InvalidToken

# ------------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="FastENG API")
templates = Jinja2Templates(directory="templates")
templates.env.filters["comma"] = lambda v: f"{float(v):,.0f}" if v is not None else v

BASE_DIR = Path(__file__).resolve().parent
APP_ADS_PATH = BASE_DIR / "app-ads.txt"
APP_FAVICON_PATH = BASE_DIR / "favicon.ico"

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
ADMIN_API_KEY = os.environ["ADMIN_API_KEY"]

# Stable salt để tạo UUID từ lessonid
SALT = "548efb19-9741-4e81-9ad1-dddbe062649d"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

UUID_RE = re.compile(
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
)


# ------------------------------------------------------------------
# AUTH
# ------------------------------------------------------------------
def verify_api_key(x_api_key: str | None = Header(default=None)):
    if x_api_key != ADMIN_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True


# ------------------------------------------------------------------
# MODELS
# ------------------------------------------------------------------
class UserCounts(BaseModel):
    groups: int
    lessons: int
    words: int


class UserWithCounts(BaseModel):
    id: str
    email: Optional[str] = None
    last_sign_in_at: Optional[str] = None
    counts: UserCounts


class UsersListResponse(BaseModel):
    page: int
    per_page: int
    total: int
    users: List[UserWithCounts]


class UserStatsResponse(BaseModel):
    userid: str
    email: str | None = None
    counts: Dict[str, int]


class ClearResult(BaseModel):
    status: str
    userid: str
    rpc_result: Dict[str, Any] | None = None
    auth_deleted: bool
    note: str | None = None


# ------------------------------------------------------------------
# UTILS
# ------------------------------------------------------------------
def _decode_b64_csv_to_ints(b64text: str | None) -> list[int]:
    if not b64text:
        return []
    try:
        padding = "=" * (-len(b64text) % 4)
        raw = base64.urlsafe_b64decode((b64text + padding).encode()).decode()
        return [int(x) for x in raw.split(",") if x.strip().isdigit()]
    except Exception as ex:
        logging.warning(f"[WARN] Invalid base64 '{b64text}': {ex}")
        return []


def get_fernet(password: str, salt: str) -> Fernet:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt.encode(),
        iterations=390_000,
        backend=default_backend(),
    )
    return Fernet(base64.urlsafe_b64encode(kdf.derive(password.encode())))


def _extract_words(rows: list) -> list[dict]:
    return [
        {
            "word": r.get("word"),
            "type": r.get("type"),
            "pronunciation": r.get("pronunciation"),
            "meaning": r.get("meaning"),
            "translate": r.get("translate"),
            "example": r.get("example"),
            "word_voice": r.get("word_voice"),
            "eg_voice": r.get("eg_voice"),
            "trans_voice": r.get("trans_voice"),
            "df_voice": r.get("df_voice"),
        }
        for r in rows
    ]


# ------------------------------------------------------------------
# LESSON HELPERS
# ------------------------------------------------------------------
async def _render_lesson_by_id(
    request: Request,
    lesson_id: str,
    hide_columns: list[int],
    hide_columns_print: list[int],
):
    try:
        lesson_resp = (
            supabase.table("lessons")
            .select("id, name")
            .eq("id", lesson_id)
            .single()
            .execute()
        )
        if not lesson_resp.data:
            raise ValueError(f"Lesson id={lesson_id} not found")

        lesson_name = lesson_resp.data.get("name", f"Lesson {lesson_id}")
        words_resp = (
            supabase.table("words")
            .select("*")
            .eq("lesson_id", lesson_resp.data["id"])
            .order("latest_update", desc=False)
            .execute()
        )
        words_list = _extract_words(words_resp.data or [])
    except Exception as e:
        logging.error(f"[ERROR] lesson_by_id: {e}")
        return templates.TemplateResponse(request, "error.html", {"error": str(e)})

    return templates.TemplateResponse(
        request,
        "share.html",
        {
            "words": words_list,
            "lesson_id": lesson_id,
            "lesson_name": lesson_name,
            "hide_columns": hide_columns,
            "hide_columns_print": hide_columns_print,
        },
    )


async def _render_lesson_by_short_id(
    request: Request, short_id: str, c: str, p: str
):
    try:
        lesson_resp = (
            supabase.table("lessons")
            .select("id, name")
            .eq("short_id", short_id.replace("!", ""))
            .single()
            .execute()
        )
        if not lesson_resp.data:
            raise ValueError(f"Lesson short_id={short_id} not found")

        lesson_name = lesson_resp.data.get("name", f"Lesson {short_id}")
        words_resp = (
            supabase.table("words")
            .select("*")
            .eq("lesson_id", lesson_resp.data["id"])
            .order("latest_update", desc=False)
            .execute()
        )
        words_list = _extract_words(words_resp.data or [])

        if "!" in short_id:
            random.shuffle(words_list)

        hide_columns = [int(x) for x in c.split(",") if x.isdigit()]
        hide_columns_print = [int(x) for x in p.split(",") if x.isdigit()]
    except Exception as e:
        logging.error(f"[ERROR] lesson_by_short_id: {e}")
        return templates.TemplateResponse(request, "error.html", {"error": str(e)})

    return templates.TemplateResponse(
        request,
        "share.html",
        {
            "words": words_list,
            "lesson_id": short_id,
            "lesson_name": lesson_name,
            "hide_columns": hide_columns,
            "hide_columns_print": hide_columns_print,
        },
    )


# ------------------------------------------------------------------
# LESSON / SHARE ROUTES
# ------------------------------------------------------------------
@app.get("/", response_class=HTMLResponse)
async def homepage(
    request: Request,
    lessonid: str | None = Query(None),
    column: str | None = Query(None),
    print: str | None = Query(None),
    userid: str | None = Query(None),
    groupid: str | None = Query(None),
    sort: str | None = Query(None),
):
    if not lessonid:
        return templates.TemplateResponse(request, "landing.html")
    lesson_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, lessonid + SALT))
    return await _render_lesson_by_id(
        request, lesson_id,
        _decode_b64_csv_to_ints(column),
        _decode_b64_csv_to_ints(print),
    )


@app.get("/firebase", response_class=HTMLResponse)
async def firebase(
    request: Request,
    lessonid: str | None = Query(None),
    column: str | None = Query(None),
    print: str | None = Query(None),
    userid: str | None = Query(None),
    groupid: str | None = Query(None),
    sort: str | None = Query(None),
):
    if not lessonid:
        return templates.TemplateResponse(
            request, "error.html", {"error": "Missing required query param: lessonid"}
        )
    lesson_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, lessonid + SALT))
    return await _render_lesson_by_id(
        request, lesson_id,
        _decode_b64_csv_to_ints(column),
        _decode_b64_csv_to_ints(print),
    )


@app.get("/share", response_class=HTMLResponse)
async def share_lesson(
    request: Request,
    id: str = Query(..., description="Lesson short_id"),
    c: str = Query(""),
    p: str = Query(""),
):
    return await _render_lesson_by_short_id(request, id, c, p)


# ------------------------------------------------------------------
# TTS KEYS
# ------------------------------------------------------------------
@app.get("/keys", response_class=HTMLResponse)
async def keys_page(request: Request):
    try:
        response = supabase.table("ttskeys").select("*").execute()
        keys = response.data or []
        for key in keys:
            raw = key.get("api_key") or ""
            if len(raw) > 4:
                key["api_key"] = raw[:-4] + "****"
    except Exception as e:
        logging.error(f"[ERROR] Fetching keys: {e}")
        keys = []
    return templates.TemplateResponse(request, "key.html", {"keys": keys})


@app.post("/keys")
async def add_key(
    request: Request,
    api_key: str = Form(...),
    base_url: str = Form(...),
    provider: str = Form(...),
):
    try:
        resp = supabase.table("ttskeys").insert(
            {"api_key": api_key, "base_url": base_url, "provider": provider,
             "created_at": "now()", "is_live": True, "balance": 0.0, "description": ""}
        ).execute()
        return templates.TemplateResponse(
            request,
            "key.html",
            {"success": "Key added successfully", "keys": resp.data},
        )
    except Exception as e:
        logging.error(f"[ERROR] Adding key: {e}")
        return templates.TemplateResponse(request, "key.html", {"error": str(e)})


@app.post("/delete_key/{id}")
async def delete_key(request: Request, id: str):
    try:
        supabase.table("ttskeys").delete().eq("id", id).execute()
        return templates.TemplateResponse(
            request, "key.html", {"success": "Key deleted successfully"}
        )
    except Exception as e:
        logging.error(f"[ERROR] Deleting key: {e}")
        return templates.TemplateResponse(request, "key.html", {"error": str(e)})


# ------------------------------------------------------------------
# ADMIN USER MANAGEMENT
# ------------------------------------------------------------------
@app.get("/users", response_model=UsersListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=1000),
    search: str | None = Query(None),
    _: bool = Depends(verify_api_key),
):
    try:
        resp = supabase_admin.rpc(
            "admin_list_users",
            {"p_page": page, "p_per_page": per_page, "p_search": search},
        ).execute()
        data = resp.data
        if not isinstance(data, dict):
            import json as _json
            data = _json.loads(data) if isinstance(data, str) else {}
        return UsersListResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"admin_list_users failed: {e}")


@app.get("/user", response_model=UserStatsResponse)
async def get_user_stats(
    userid: str = Query(...),
    _: bool = Depends(verify_api_key),
):
    try:
        resp = supabase_admin.rpc(
            "admin_get_user_stats", {"target_user_id": userid}
        ).execute()
        data = resp.data
        if not isinstance(data, dict):
            import json as _json
            data = _json.loads(data) if isinstance(data, str) else {}
        return UserStatsResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"admin_get_user_stats failed: {e}")


@app.delete("/removeData", response_model=ClearResult)
async def remove_user_data(
    userid: str = Query(...),
    _: bool = Depends(verify_api_key),
):
    if not UUID_RE.match(userid):
        raise HTTPException(status_code=422, detail="Invalid UUID format for userid")
    try:
        resp = supabase_admin.rpc(
            "admin_clear_user_data", {"target_user_id": userid}
        ).execute()
        rpc_data = getattr(resp, "data", None) or {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RPC admin_clear_user_data failed: {e}")
    return ClearResult(
        status="ok", userid=userid,
        rpc_result=rpc_data if isinstance(rpc_data, dict) else {"data": rpc_data},
        auth_deleted=False, note="RPC only.",
    )


@app.delete("/remove", response_model=ClearResult)
async def remove_user(
    userid: str = Query(...),
    _: bool = Depends(verify_api_key),
):
    if not UUID_RE.match(userid):
        raise HTTPException(status_code=422, detail="Invalid UUID format for userid")
    try:
        resp = supabase_admin.rpc(
            "admin_clear_user_data", {"target_user_id": userid}
        ).execute()
        rpc_data = getattr(resp, "data", None) or {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RPC admin_clear_user_data failed: {e}")
    try:
        supabase_admin.auth.admin.delete_user(userid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auth delete failed after RPC succeeded: {e}")
    return ClearResult(
        status="ok", userid=userid,
        rpc_result=rpc_data if isinstance(rpc_data, dict) else {"data": rpc_data},
        auth_deleted=True, note="RPC done first, then Auth deleted.",
    )


# ------------------------------------------------------------------
# STATIC PAGES
# ------------------------------------------------------------------
@app.get("/privacy", response_class=HTMLResponse)
@app.get("/privacypolicy", response_class=HTMLResponse)
async def privacy_page(request: Request):
    return templates.TemplateResponse(request, "fasteng-privacy-policy.html")


@app.get("/terms", response_class=HTMLResponse)
async def terms_page(request: Request):
    return templates.TemplateResponse(request, "fasteng-terms.html")

@app.get("/destinationb1", response_class=HTMLResponse)
async def terms_page(request: Request):
    return templates.TemplateResponse(request, "destinationb1.html")


@app.get("/app-ads.txt", include_in_schema=False)
def get_app_ads():
    if not APP_ADS_PATH.exists():
        raise HTTPException(status_code=404, detail="app-ads.txt not found")
    return FileResponse(
        APP_ADS_PATH, media_type="text/plain; charset=utf-8",
        headers={"Cache-Control": "public, max-age=86400"},
    )


@app.get("/favicon.ico", include_in_schema=False)
def get_favicon():
    if not APP_FAVICON_PATH.exists():
        raise HTTPException(status_code=404, detail="favicon.ico not found")
    return FileResponse(
        APP_FAVICON_PATH, media_type="image/x-icon",
        headers={"Cache-Control": "public, max-age=86400"},
    )


# ------------------------------------------------------------------
# GOOGLE EID SCRAPER
# ------------------------------------------------------------------
@app.get("/geteid")
def get_eid(version: str = "v9.2.0"):
    try:
        url = f"https://googleads.g.doubleclick.net/mads/static/sdk/native/sdk-core-v40.html?sdk=afma-sdk-i-{version}"
        resp = requests.get(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
            },
            timeout=10,
        )
        resp.raise_for_status()
        html = resp.text
        eid1 = re.search(r'var sdkLoaderEID = "([^"]+)"', html)
        eid2 = re.search(r',e\.includes\("([^"]+)"\)', html)
        return {
            "sdkLoaderEID": eid1.group(1) if eid1 else None,
            "sdkLoaderEID2": eid2.group(1) if eid2 else None,
            "version": version,
        }
    except Exception as e:
        logging.error(f"Error fetching EID: {e}")
        return {"sdkLoaderEID": "318502621", "sdkLoaderEID2": "318500618", "version": "v9.2.0"}


# ------------------------------------------------------------------
# FERNET ENCODE / DECODE
# ------------------------------------------------------------------
_CODE_DEFAULTS = {"mode": "encode", "input_data": "", "password": "", "salt": "", "result": "", "error": ""}


@app.get("/code", response_class=HTMLResponse)
async def code_get(request: Request):
    return templates.TemplateResponse(request, "code.html", {**_CODE_DEFAULTS})


@app.post("/code", response_class=HTMLResponse)
async def code_post(
    request: Request,
    mode: str = Form(...),
    input_data: str = Form(...),
    password: str = Form(...),
    salt: str = Form(...),
):
    error = result = ""
    if not input_data or not password or not salt:
        error = "Vui lòng nhập đầy đủ: Data, Password, Salt."
    else:
        try:
            fernet = get_fernet(password, salt)
            if mode == "encode":
                result = fernet.encrypt(input_data.encode()).decode()
            elif mode == "decode":
                try:
                    result = fernet.decrypt(input_data.encode()).decode()
                except InvalidToken:
                    error = "Giải mã thất bại: sai password/salt hoặc chuỗi không hợp lệ."
            else:
                error = "Mode không hợp lệ."
        except Exception as e:
            error = f"Lỗi: {e}"
    return templates.TemplateResponse(
        request,
        "code.html",
        {"mode": mode, "input_data": input_data,
         "password": password, "salt": salt, "result": result, "error": error},
    )


# ------------------------------------------------------------------
# CATCH-ALL — short_id (must be last route)
# ------------------------------------------------------------------
@app.get("/{short_id}", response_class=HTMLResponse)
async def share_lesson_by_short_id(
    request: Request,
    short_id: str,
    c: str = Query(""),
    p: str = Query(""),
):
    return await _render_lesson_by_short_id(request, short_id, c, p)


# ------------------------------------------------------------------
# ENTRY POINT
# ------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 10000)),
    )
