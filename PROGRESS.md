# Project Progress

**Last updated:** 2026-11-20
**Last agent:** Claude Code (Opus 5.5)
**Status:** ⏸ Tạm dừng — mọi việc đã gộp và đang chạy trên thaybinh.vn

## Current task

Thêm công cụ cho trang chia sẻ lesson (`/{short_id}`) giống trang share của FastENG web (learn.thaybinh.vn). Không còn việc dở.

**Lưu ý:** thaybinh.vn deploy từ nhánh `codex/fasteng-professional-share-redesign`, không phải `main`. PR phải nhắm vào nhánh đó.

## Todo list

- [x] Hàng nút cạnh "Bắt đầu học": Xáo trộn · Chọn từ (badge số từ ẩn) · PDF (PR #1)
- [x] Nhóm **Che** dạng segmented: Từ / Loại / Phiên âm / Bản dịch / Định nghĩa / Ví dụ; vừa một hàng ở 360px (PR #1, #2)
- [x] Chạm ô bị che để mở riêng ô đó; lưu ở `fasteng:share:cover` (dùng chung mọi lesson)
- [x] Số thứ tự đánh lại 1..n sau xáo trộn / chọn từ (PR #3)
- [x] Cmd+P: cột đang che in ra trống cho học sinh điền (PR #3)
- [ ] Smoke test trên trang live bằng điện thoại thật và với lesson có voice thật (verify with user)

## Files changed this session

- `templates/share.html` — `.hero-tools`, `.cover-chips`, thuộc tính `data-col` trên ô bảng và danh sách mobile
- `static/js/share.js` — `applyCover`, `toggleCover`, `liftCell`, `shuffleRows`, `renumber`
- `static/css/share.css` — style hàng nút, segmented Che, tape che, print blank, ẩn Phonetic rail trên mobile
- `docs/frontend.md` — mô tả thanh công cụ

## Decisions & notes

- 2026-11-20 Phonetic rail bị ẩn trên mobile (≤760px) để phần đầu trang gọn.
- 2026-11-20 Xáo trộn không lưu; thứ tự mới áp cho bảng, danh sách mobile và lượt học.
- 2026-11-20 Ô đã chạm mở vẫn in trống nếu cột đang che.
- 2026-11-20 Chạy local cần Python 3.12 (`python3.12 -m venv .venv`); Python 3.14 không build được `pydantic_core` đã pin.

## Blockers

- Không có. `gitleaks` chưa cài trên máy local.

## Next up

1. Hỏi người dùng đã thử trang live trên điện thoại chưa (che, xáo trộn, in).
2. Trước khi sửa Share: đọc `CLAUDE.md`, `AGENTS.md`, `docs/frontend.md`; chạy `ruff check .`, `pytest`, `python3 -m py_compile main.py`.

## Changelog

| Date | Agent | Summary |
|---|---|---|
| 2026-11-20 | Claude Code (Opus 5.5) | PR #1–#3: thanh công cụ share (xáo trộn, chọn từ, che cột), đánh số lại, in cột che để trống |
