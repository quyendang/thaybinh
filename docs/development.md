# Phát triển và kiểm chứng

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn main:app --reload --port 10000
```

Chạy trước khi bàn giao:

```bash
ruff check .
pytest
python3 -m py_compile main.py
```

Smoke test staging: landing, một URL legacy lesson, `/share`, short ID, short ID `!`, `c/p`, audio, copy, selection/localStorage, print preview và admin API không có/sai/có key. Không gọi delete user để smoke test production.

`requirements.txt` ghi dependency trực tiếp; `requirements.lock` là lockfile đã kiểm chứng trên Python 3.12 và được CI dùng qua `requirements-dev.txt`.
