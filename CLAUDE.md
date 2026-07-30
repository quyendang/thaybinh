# FastENG – Context nhanh

FastENG là web monolith FastAPI + Jinja2 + Supabase, phục vụ landing page, lesson vocabulary share, Destination B1 và API quản trị user. `main.py` vẫn là entry point cho Procfile; ứng dụng được tổ chức theo `app/config.py`, `app/services/` và `app/routers/`.

## Chạy local

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn main:app --reload --port 10000
```

Biến bắt buộc: `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_API_KEY`. Không log, render hoặc commit secret.

## Hợp đồng quan trọng

- Giữ URL lesson: `/?lessonid=`, `/share?id=`, `/{short_id}`, `!`, `c/p`, `column/print`.
- `/{short_id}` phải luôn là route cuối. `firebase`, `keys`, `geteid`, `code` là các path đã rút và phải trả 404.
- Không đổi schema/RLS/RPC Supabase trong repository này.
- Lesson UI chỉ lấy allowlist field từ `words`; dữ liệu động không được đi vào inline JavaScript.

## Kiểm chứng

```bash
ruff check .
pytest
python3 -m py_compile main.py
```

Sau khi đổi Share, kiểm tra audio, copy presets/custom format, chọn–khôi phục từ, localStorage, mobile và print preview. Chi tiết: `docs/`.
