# Hồ sơ Đặng Ngọc Quyên — bản nháp 21/10/2026

## Xem trước

Chạy `python3 scripts/preview_research_profile.py`, mở
`http://127.0.0.1:10001/#pi-profile`. Server chỉ bind loopback, không đọc `.env`,
không khởi tạo Supabase, không có route quản trị. Header `X-Robots-Tag`,
`Cache-Control: no-store` và meta robots ngăn lưu cache/lập chỉ mục;
đây không thay thế xác thực nếu ai đó tự đưa preview lên Internet.

Trang chủ production không truyền `profile_preview`, nên không render hồ sơ,
navigation mới hoặc stylesheet mới. Query string không bật được bản nháp.
Không deploy server xem trước bằng Procfile.

## Nguồn nội dung

| Nội dung | Nguồn | Giới hạn |
| --- | --- | --- |
| Đặng Ngọc Quyên | Người dùng xác nhận trong chat | Giữ nguyên tên ở cả VI/EN; không tự thêm học vị |
| Ảnh chân dung | Người dùng gửi tệp và chỉ định dùng làm ảnh chân dung trong chat | Resize 520×712 WebP, bỏ metadata; không chỉnh sửa khuôn mặt |
| Người sáng lập Thay Binh EdTech | `templates/landing.html`, mục About và Organization JSON-LD đang có | Tự công bố; chưa xác minh chức danh hiện tại độc lập |
| Email `contact@thaybinh.vn` | Website hiện tại | Email doanh nghiệp; không coi là email trường/viện hoặc email cá nhân đã xác nhận |
| Learning Trajectory Architect đang xây MVP | `docs/frontend.md`, trang dự án và tài liệu dự án hiện có | Kế hoạch, chưa phải kết quả nghiên cứu; vai trò cá nhân chưa xác nhận |
| FastENG đã phát hành, tên nhà phát triển Quyen Dang | https://apps.apple.com/us/app/fasteng-learning-english/id6749817128 | Đã đọc listing ngày 21/10/2026; tên niêm yết không đủ xác minh vai trò PI |
| FastScores đã phát hành, tên nhà phát triển Quyen Dang | https://apps.apple.com/us/app/fastscores-student-manager/id6760573525 | Đã đọc listing ngày 21/10/2026; không suy diễn vai trò cá nhân từ tên niêm yết |
| Điều kiện Claude Team for Scientists | https://claude.com/programs/team-plan-for-scientists | PI hoặc tương đương tại accredited university/nonprofit research institute; không xác nhận hồ sơ này đủ điều kiện |

Không tìm người có tên gần giống để tự gán ORCID, Scholar, GitHub, chân dung,
trường/viện, lab, công bố hoặc cộng tác viên. Không thêm các mục chưa có nguồn.
Ảnh chân dung được người dùng bổ sung sau lần xem trước đầu tiên; không dùng ảnh AI.

## Cần duyệt trước khi công khai

- Chức danh hiện tại và vai trò cá nhân trong từng dự án.
- Website thuộc cá nhân hay doanh nghiệp. Hiện chỉ mô tả đúng branding Thay Binh
  EdTech đang có, không gọi đây là website trường/viện.
- Email mong muốn công khai; đơn vị/khoa/lab và liên kết chính thức nếu có.
- ORCID/Scholar/GitHub chỉ thêm sau khi xác minh đúng chủ hồ sơ.
- Duyệt cả hai bản VI/EN, sau đó mới bật include trong trang public và bỏ ghi chú
  nội bộ. Anchor kỹ thuật `pi-profile` không xác nhận chức danh PI.

## Thiết kế và SEO

Mở rộng Landing theo `DESIGN.md`: cobalt/ink/cloud/lilac, Be Vietnam Pro và
Source Sans 3, layout hai cột chuyển một cột ở 760px, danh sách dự án có đường
chia. Dùng menu, language preference và focus/reduced-motion sẵn có, không thêm
JavaScript mới hoặc ảnh tải ngoài. Ảnh chân dung WebP 520×712 khai báo kích thước,
lazy-load và có alt VI/EN. `DESIGN.md` giữ nguyên vì không đổi hệ thống.

Nội dung VI/EN được server-render, các mục có heading và anchor ổn định. Giữ
canonical trang chủ hiện có vì `#pi-profile` là fragment của trang chủ, không phải
một URL tài liệu độc lập. Không tạo Person/academic schema chưa được duyệt.
SEO public và structured data sẽ được duyệt cùng nội dung khi xuất bản;
bản nháp luôn noindex.

## Kiểm chứng bản nháp

- `ruff check .`, `pytest` (15 passed), `python3 -m py_compile main.py`: đạt.
- Trình duyệt: VI/EN, alt ảnh, ảnh tải đầy đủ, chuyển ngôn ngữ giữ hồ sơ trong
  khung nhìn; menu mobile, Escape trả focus, Tab và link nội bộ hoạt động.
- Không tràn ngang ở 1440, 1280, 390 và 320px; có CSS print và reduced motion.
- Chưa smoke test Supabase staging, screen reader thực tế hoặc hộp thoại print/PDF.
  Bản xem trước không truy vấn Supabase; production/Share không bị thay đổi nội dung.
