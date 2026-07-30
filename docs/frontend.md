# Frontend guidelines

Share và Landing dùng design system chung ở `static/css/tokens.css`: Cloud `#F6F8FB`, Ink `#162033`, Cobalt `#2563EB`, Teal `#0F9D8A`, Slate `#667085`, Amber `#C47A10`; Manrope cho UI, IBM Plex Mono cho IPA/dữ liệu.

- Không dùng inline event/style cho tính năng mới; đặt hành vi trong `static/js/`.
- Share phải giữ audio, copy preset/custom, chọn–khôi phục từ, localStorage, cột ẩn URL và print/PDF.
- Mọi dialog cần `dialog`, accessible name, Escape/close focus; icon-only control cần `aria-label`; toast dùng `aria-live`.
- Kiểm tra desktop, mobile, keyboard, reduced motion, print preview và clipboard fallback.
- Landing chỉ hiển thị CTA có URL thật; giữ mobile menu và không thêm social placeholder.
