# Hướng dẫn cho AI agents

FastENG là Python web app, không phải SwiftUI/iOS repository. Luôn phản hồi bằng tiếng Việt và đọc `CLAUDE.md` cùng tài liệu liên quan trong `docs/` trước khi sửa.

## Quy tắc bất biến

- Không thay đổi database schema, RLS, Supabase RPC hoặc service-role boundary.
- Không đổi `SALT`, UUID v5 legacy mapping, `!`, `c/p`, `column/print`, hay vị trí catch-all `/{short_id}` nếu chưa đánh giá tương thích link đang chia sẻ.
- Không khôi phục các route đã rút: `/firebase`, `/keys`, `/geteid`, `/code`.
- Không log/commit secret, PII, `.env`, cache hoặc virtualenv.
- Không nhúng dữ liệu request/Supabase vào inline JavaScript. Dùng `data-*`, event listener hoặc serialization đúng context.

## Theo phạm vi

- Backend: cập nhật test/API docs, dùng allowlist query và trả lỗi public generic.
- Share UI: giữ audio, print/PDF, copy preset/custom, chọn từ, URL hide column và preference localStorage; kiểm tra keyboard, modal, mobile và print.
- Landing: chỉ dùng link ngoài đã xác thực; không thêm CTA/social placeholder.

## Hoàn tất

Chạy `ruff check .`, `pytest`, `python3 -m py_compile main.py`, sau đó nêu rõ phần nào chưa smoke test được trên Supabase staging.
