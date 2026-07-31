# Frontend guidelines

Share và Landing dùng design system chung ở `static/css/tokens.css`: Cloud `#F6F8FB`, Ink `#162033`, Cobalt `#2563EB`, Teal `#0F9D8A`, Slate `#667085`, Amber `#C47A10`; Manrope cho UI, IBM Plex Mono cho IPA/dữ liệu.

- Không dùng inline event/style cho tính năng mới; đặt hành vi trong `static/js/`.
- Share phải giữ audio, copy preset/custom, chọn–khôi phục từ, localStorage, cột ẩn URL và print/PDF.
- Nút PDF của Share tạo file trong trình duyệt từ danh sách đang hiển thị. Luôn giữ `c`/`p`; Shift + click mở lựa chọn che thêm nội dung cột cho riêng file đang tải.
- Công cụ quản lý Share chỉ được gọi bằng phím tắt: `P` ×3 (chọn từ), `P` ×4 (khôi phục), `Ctrl+W` (copy kèm tiếng Việt), `Ctrl+Q` (copy Word + Meaning), `Ctrl+E` (format), `Ctrl+H` (trợ giúp). Chuỗi `P` có cửa sổ 1 giây và không hoạt động khi đang nhập văn bản/mở dialog.
- Mọi dialog cần `dialog`, accessible name, Escape/close focus; icon-only control cần `aria-label`; toast dùng `aria-live`.
- Kiểm tra desktop, mobile, keyboard, reduced motion, print preview và clipboard fallback.
- Landing chỉ hiển thị CTA có URL thật; giữ mobile menu và không thêm social placeholder.
