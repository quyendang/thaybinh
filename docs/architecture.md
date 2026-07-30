# Kiến trúc FastENG

```text
Browser → FastAPI/Jinja (`main.py`)
                  ├─ public router → lesson service → Supabase anon client
                  ├─ admin router → Supabase service-role/RPC/Auth
                  ├─ static CSS/JS
                  └─ public templates
```

| Khu vực | Vai trò |
| --- | --- |
| `main.py` | Khởi tạo app, clients, template engine, static mount và routers. |
| `app/services/lessons.py` | Query allowlist `lessons`, `groups`, `words`; tạo payload hiển thị. |
| `app/routers/public.py` | Landing, share, static/legal pages, catch-all short ID. |
| `app/routers/admin.py` | API quản trị user có `X-API-Key`. |
| `templates/` | HTML server-rendered. |
| `static/` | Tokens, CSS/JS cho Share và Landing. |

## Routes công khai

- `GET /`: landing hoặc lesson legacy với `lessonid`, `column`, `print`.
- `GET /share?id=&c=&p=` và `GET /{short_id}?c=&p=`: lesson share.
- `GET /privacy`, `/privacypolicy`, `/terms`, `/destinationb1`, `/app-ads.txt`, `/favicon.ico`.
- `GET /users`, `/user`, `DELETE /removeData`, `/remove`: admin API, cần `X-API-Key`.

`firebase`, `keys`, `geteid`, `code` là path retired, luôn 404. Catch-all phải đứng cuối; `!` trên short ID xáo trộn từ. `c/p` là CSV cột ẩn, còn legacy `column/print` là CSV base64 URL-safe.
