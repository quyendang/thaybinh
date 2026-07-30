import json
import re
import secrets

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from starlette.concurrency import run_in_threadpool

from app.models import ClearResult, UsersListResponse, UserStatsResponse

router = APIRouter()
UUID_RE = re.compile(
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
)


def verify_api_key(
    request: Request, x_api_key: str | None = Header(default=None)
) -> bool:
    configured_key = request.app.state.settings.admin_api_key
    if not x_api_key or not secrets.compare_digest(x_api_key, configured_key):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True


def _response_data(response) -> dict:
    data = response.data
    if isinstance(data, dict):
        return data
    return json.loads(data) if isinstance(data, str) else {}


@router.get("/users", response_model=UsersListResponse)
async def list_users(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=1000),
    search: str | None = Query(None),
    _: bool = Depends(verify_api_key),
):
    try:
        response = await run_in_threadpool(
            lambda: request.app.state.supabase_admin.rpc(
                "admin_list_users",
                {"p_page": page, "p_per_page": per_page, "p_search": search},
            ).execute()
        )
        return UsersListResponse(**_response_data(response))
    except Exception:
        request.app.state.logger.exception("admin_list_users failed")
        raise HTTPException(
            status_code=500,
            detail="Không thể tải danh sách người dùng.",
        ) from None


@router.get("/user", response_model=UserStatsResponse)
async def get_user_stats(
    request: Request,
    userid: str = Query(...),
    _: bool = Depends(verify_api_key),
):
    try:
        response = await run_in_threadpool(
            lambda: request.app.state.supabase_admin.rpc(
                "admin_get_user_stats", {"target_user_id": userid}
            ).execute()
        )
        return UserStatsResponse(**_response_data(response))
    except Exception:
        request.app.state.logger.exception("admin_get_user_stats failed")
        raise HTTPException(
            status_code=500,
            detail="Không thể tải thống kê người dùng.",
        ) from None


@router.delete("/removeData", response_model=ClearResult)
async def remove_user_data(
    request: Request,
    userid: str = Query(...),
    _: bool = Depends(verify_api_key),
):
    if not UUID_RE.match(userid):
        raise HTTPException(status_code=422, detail="Invalid UUID format for userid")
    try:
        response = await run_in_threadpool(
            lambda: request.app.state.supabase_admin.rpc(
                "admin_clear_user_data", {"target_user_id": userid}
            ).execute()
        )
    except Exception:
        request.app.state.logger.exception("admin_clear_user_data failed")
        raise HTTPException(
            status_code=500,
            detail="Không thể xóa dữ liệu người dùng.",
        ) from None
    data = getattr(response, "data", None) or {}
    return ClearResult(
        status="ok",
        userid=userid,
        rpc_result=data if isinstance(data, dict) else {"data": data},
        auth_deleted=False,
        note="RPC only.",
    )


@router.delete("/remove", response_model=ClearResult)
async def remove_user(
    request: Request,
    userid: str = Query(...),
    _: bool = Depends(verify_api_key),
):
    if not UUID_RE.match(userid):
        raise HTTPException(status_code=422, detail="Invalid UUID format for userid")
    try:
        response = await run_in_threadpool(
            lambda: request.app.state.supabase_admin.rpc(
                "admin_clear_user_data", {"target_user_id": userid}
            ).execute()
        )
    except Exception:
        request.app.state.logger.exception("admin_clear_user_data failed")
        raise HTTPException(
            status_code=500,
            detail="Không thể xóa dữ liệu người dùng.",
        ) from None
    try:
        await run_in_threadpool(
            lambda: request.app.state.supabase_admin.auth.admin.delete_user(userid)
        )
    except Exception:
        request.app.state.logger.exception(
            "Supabase Auth deletion failed after data clear"
        )
        raise HTTPException(
            status_code=500,
            detail=(
                "Dữ liệu đã được xóa nhưng không thể xóa tài khoản. "
                "Hãy kiểm tra nhật ký quản trị."
            ),
        ) from None
    data = getattr(response, "data", None) or {}
    return ClearResult(
        status="ok",
        userid=userid,
        rpc_result=data if isinstance(data, dict) else {"data": data},
        auth_deleted=True,
        note="RPC done first, then Auth deleted.",
    )
