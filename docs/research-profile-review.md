# Hồ sơ Đặng Ngọc Quyên — bật trên trang chủ 23/10/2026

Người dùng yêu cầu bật hồ sơ trên trang chủ và push lên GitHub ngày 23/10/2026.
Cùng ngày, người dùng cung cấp học vị, học vấn, vai trò phụ trách nhóm và đóng
góp trong Learning Trajectory Architect để bổ sung VI/EN. Giữ giới hạn nguồn
bên dưới; các ghi chú duyệt nội bộ chỉ xuất hiện ở server preview.

## Xem trước

Chạy `python3 scripts/preview_research_profile.py`, mở
`http://127.0.0.1:10001/#pi-profile`. Server chỉ bind loopback, không đọc `.env`,
không khởi tạo Supabase, không có route quản trị. Header `X-Robots-Tag`,
`Cache-Control: no-store` và meta robots ngăn lưu cache/lập chỉ mục;
đây không thay thế xác thực nếu ai đó tự đưa preview lên Internet.

Trang chủ production truyền `show_research_profile=True` để render hồ sơ,
navigation và stylesheet. Cờ này độc lập với `profile_preview`; trang public
không có ghi chú bản nháp hoặc `noindex`. Query string không bật được chế độ
duyệt nội bộ. Không deploy server xem trước bằng Procfile.

## Nguồn nội dung

| Nội dung | Nguồn | Giới hạn |
| --- | --- | --- |
| Đặng Ngọc Quyên | Người dùng xác nhận trong chat | Giữ nguyên tên ở cả VI/EN |
| Thạc sĩ Công nghệ thông tin | Người dùng xác nhận trong chat ngày 23/10/2026 | Chưa cung cấp năm hoặc cơ sở cấp bằng thạc sĩ; không suy diễn từ thông tin tốt nghiệp 2017 |
| Tốt nghiệp UIT, Khoa Kỹ thuật Máy tính năm 2017 | Người dùng xác nhận trong chat; https://fce.uit.edu.vn/ đã đọc ngày 23/10/2026 | Website khoa xác nhận tên/đơn vị đào tạo, không xác minh bằng cấp cá nhân; không coi cựu sinh viên là liên kết nghiên cứu hiện tại |
| Phụ trách nhóm nghiên cứu Thay Binh EdTech từ tháng 2/2026 | Người dùng xác nhận trong chat ngày 23/10/2026 | Vai trò tại Thay Binh EdTech; không tự gán vai trò PI tại trường/viện |
| Thực hiện chính và đóng góp toàn bộ công đoạn Learning Trajectory Architect | Người dùng xác nhận trong chat ngày 23/10/2026 | Trang đề án cùng website là nguồn tự công bố, không phải nguồn xác minh độc lập; không mở rộng xác nhận sang FastENG/FastScores |
| Ảnh chân dung | Người dùng gửi tệp và chỉ định dùng làm ảnh chân dung trong chat | Resize 520×712 WebP, bỏ metadata; không chỉnh sửa khuôn mặt |
| Người sáng lập Thay Binh EdTech | `templates/landing.html`, mục About và Organization JSON-LD đang có | Tự công bố; chưa xác minh chức danh hiện tại độc lập |
| Email `contact@thaybinh.vn` | Website hiện tại | Email doanh nghiệp; không coi là email trường/viện hoặc email cá nhân đã xác nhận |
| Learning Trajectory Architect đang nghiên cứu, xây MVP | Người dùng xác nhận; `docs/frontend.md`, trang dự án và tài liệu dự án hiện có | Đề án/kiến trúc/phạm vi MVP/tiêu chí đánh giá là tài liệu và kế hoạch, chưa phải kết quả thực nghiệm |
| FastENG đã phát hành, tên nhà phát triển Quyen Dang | https://apps.apple.com/us/app/fasteng-learning-english/id6749817128 | Đã đọc listing ngày 21/10/2026; tên niêm yết không đủ xác minh vai trò PI |
| FastScores đã phát hành, tên nhà phát triển Quyen Dang | https://apps.apple.com/us/app/fastscores-student-manager/id6760573525 | Đã đọc listing ngày 21/10/2026; không suy diễn vai trò cá nhân từ tên niêm yết |
| Điều kiện Claude Team for Scientists | https://claude.com/programs/team-plan-for-scientists | PI hoặc tương đương tại accredited university/nonprofit research institute; không xác nhận hồ sơ này đủ điều kiện |

Không tìm người có tên gần giống để tự gán ORCID, Scholar, GitHub, chân dung,
trường/viện, lab, công bố hoặc cộng tác viên. Không thêm các mục chưa có nguồn.
Ảnh chân dung được người dùng bổ sung sau lần xem trước đầu tiên; không dùng ảnh AI.

## Giới hạn nội dung và bổ sung sau này

- Năm và cơ sở cấp bằng thạc sĩ nếu muốn bổ sung; không gán năm tốt nghiệp 2017
  cho học vị này. Vai trò thực hiện chính mới được xác nhận cho Learning Trajectory
  Architect; chưa tự bổ sung vai trò cá nhân trong FastENG/FastScores.
- Website thuộc cá nhân hay doanh nghiệp. Hiện chỉ mô tả đúng branding Thay Binh
  EdTech đang có, không gọi đây là website trường/viện.
- Email mong muốn công khai; đơn vị/khoa/lab và liên kết chính thức nếu có.
- ORCID/Scholar/GitHub chỉ thêm sau khi xác minh đúng chủ hồ sơ.
- Không tự tạo bài báo, DOI, số liệu hiệu quả, thử nghiệm hoặc cộng tác viên.
  Mục tài liệu/tiến độ công khai dẫn đến nội dung có thật trong repo và nêu rõ
  hồ sơ chưa công bố kết quả thực nghiệm của Learning Trajectory Architect.
- Yêu cầu xuất bản áp dụng cho nội dung VI/EN hiện có. Không suy diễn yêu cầu này
  thành xác nhận vai trò PI hoặc liên kết trường/viện. Anchor kỹ thuật
  `pi-profile` không xác nhận chức danh PI.

## Thiết kế và SEO

Mở rộng Landing theo `DESIGN.md`: cobalt/ink/cloud/lilac, Be Vietnam Pro và
Source Sans 3, layout hai cột chuyển một cột ở 760px, danh sách dự án có đường
chia. Dùng menu, language preference và focus/reduced-motion sẵn có, không thêm
JavaScript mới hoặc ảnh tải ngoài. Ảnh chân dung WebP 520×712 khai báo kích thước,
lazy-load và có alt VI/EN. `DESIGN.md` giữ nguyên vì không đổi hệ thống.

Nội dung VI/EN được server-render, các mục có heading và anchor ổn định. Giữ
canonical trang chủ hiện có vì `#pi-profile` là fragment của trang chủ, không phải
một URL tài liệu độc lập. Không tạo Person/academic schema chưa được duyệt.
Giữ Organization JSON-LD và canonical hiện có; không thêm Person/academic schema.
Chỉ server xem trước có `noindex`; trang chủ public không có chỉ thị này.

## Kiểm chứng bản nháp

- `ruff check .`, `pytest` (15 passed), `python3 -m py_compile main.py`: đạt.
- Trình duyệt: VI/EN, alt ảnh, ảnh tải đầy đủ, chuyển ngôn ngữ giữ hồ sơ trong
  khung nhìn; menu mobile, Escape trả focus, Tab và link nội bộ hoạt động.
- Không tràn ngang ở 1440, 1280, 390 và 320px; có CSS print và reduced motion.
- Chưa smoke test Supabase staging, screen reader thực tế hoặc hộp thoại print/PDF.
  Bản xem trước không truy vấn Supabase; đợt bản nháp chưa đổi production/Share.

## Kiểm chứng bật public (23/10/2026)

- `ruff check .`, `pytest` (16 passed), `python3 -m py_compile main.py` và
  `git diff --check`: đạt. Test xác nhận hồ sơ public không truy vấn lesson service,
  không có ghi chú nội bộ/`noindex`, query string không bật preview, và lesson/trang
  đề án không include hồ sơ. Preview vẫn giữ ghi chú nội bộ và chặn lập chỉ mục.
- Trình duyệt local dùng dữ liệu lesson giả: VI/EN, alt và tải ảnh chân dung,
  menu mobile, Enter vào hồ sơ, Escape trả focus; không tràn ngang ở 320, 390,
  768, 1024 và 1280px.
- Chưa smoke test Supabase staging, screen reader thực tế hoặc hộp thoại in/PDF.
  Không thay đổi database, RLS/RPC, admin API hoặc hành vi Share.

## Kiểm chứng bổ sung học vấn và vai trò (23/10/2026)

- `ruff check .`, `pytest` (16 passed), `python3 -m py_compile main.py` và
  `git diff --check`: đạt. Test bao phủ học vị, năm tốt nghiệp, thời điểm phụ trách
  nhóm, nguồn tự công bố và vai trò thực hiện chính trên trang đề án.
- Trình duyệt local dùng dữ liệu lesson giả: VI/EN, hồ sơ và trang đề án,
  liên kết `#research-lead` cùng liên kết về hồ sơ hoạt động; không tràn ngang
  ở các kích thước kiểm tra 320, 390, 768 và 1280px.
- Chưa smoke test Supabase staging, screen reader thực tế hoặc hộp thoại in/PDF.
