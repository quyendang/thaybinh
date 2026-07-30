from typing import Any

from pydantic import BaseModel


class UserCounts(BaseModel):
    groups: int
    lessons: int
    words: int


class UserWithCounts(BaseModel):
    id: str
    email: str | None = None
    last_sign_in_at: str | None = None
    counts: UserCounts


class UsersListResponse(BaseModel):
    page: int
    per_page: int
    total: int
    users: list[UserWithCounts]


class UserStatsResponse(BaseModel):
    userid: str
    email: str | None = None
    counts: dict[str, int]


class ClearResult(BaseModel):
    status: str
    userid: str
    rpc_result: dict[str, Any] | None = None
    auth_deleted: bool
    note: str | None = None
