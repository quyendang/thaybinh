# Frontend guidelines

Share dùng design system ở `static/css/tokens.css`: Cloud `#F6F8FB`, Ink `#162033`, Cobalt `#2563EB`, Teal `#0F9D8A`, Slate `#667085`, Amber `#C47A10`; Manrope cho UI, IBM Plex Mono cho IPA/dữ liệu.

Landing và trang dự án kế thừa hệ thống riêng trong `static/css/landing.css`: cobalt `#2448DC`, ink `#182651`, cloud `#F5F7FF`; Be Vietnam Pro cho tiêu đề và Source Sans 3 cho nội dung.

- Không dùng inline event/style cho tính năng mới; đặt hành vi trong `static/js/`.
- Share phải giữ audio, copy preset/custom, chọn–khôi phục từ, localStorage, cột ẩn URL và print/PDF.
- In bằng trình duyệt (Command + P / Ctrl + P), kể cả Save as PDF, hiển thị tiêu đề `Group Name · Lesson Name`; bài không có Group chỉ hiển thị tên Lesson.
- Nút PDF của Share tạo file trong trình duyệt từ danh sách đang hiển thị. Luôn giữ `c`/`p`; Shift + click mở lựa chọn che thêm nội dung cột cho riêng file đang tải. Thư viện `html2pdf.js` 0.10.1 được pin ở `static/vendor/` để không làm trì hoãn script Share nếu CDN ngoài lỗi.
- Công cụ quản lý Share chỉ được gọi bằng phím tắt: `P` ×3 (chọn từ), `P` ×4 (khôi phục), `Ctrl+W` (copy kèm tiếng Việt), `Ctrl+Q` (copy Word + Meaning), `Ctrl+E` (format), `Ctrl+H` (trợ giúp), `Ctrl+Y` (Tên Lesson, Link) và `Ctrl+U` (Tên Group, Tên Lesson, Link). Chuỗi `P` có cửa sổ 1 giây và không hoạt động khi đang nhập văn bản/mở dialog.
- Mọi dialog cần `dialog`, accessible name, Escape/close focus; icon-only control cần `aria-label`; toast dùng `aria-live`.
- Kiểm tra desktop, mobile, keyboard, reduced motion, print preview và clipboard fallback.
- Landing chỉ hiển thị CTA có URL thật; giữ mobile menu và không thêm social placeholder.

## Dự án trọng tâm: Learning Trajectory Architect

Landing đưa Learning Trajectory Architect lên hero và phần giới thiệu đầu tiên; FastENG / FastScores vẫn có link sản phẩm và pháp lý. Trang `/projects/learning-trajectory-architect` trình bày đề án song ngữ VI/EN, mục lục, kiến trúc agent, luồng học, MVP, công nghệ đề xuất, lộ trình và rủi ro. Dùng chung preference ngôn ngữ và menu của Landing. README gốc tải tại `/static/documents/learning-trajectory-architect.md`.

Trạng thái được chủ dự án xác nhận: **đang xây dựng MVP**. Các tính năng, thời gian, chỉ tiêu và giá trong README là kế hoạch/đề xuất; không quảng bá như tính năng đã phát hành hoặc kết quả đã đạt. Sơ đồ HTML/CSS là minh họa ý tưởng, không phải ảnh sản phẩm.

Thông tin doanh nghiệp hiển thị và Organization JSON-LD: 32 Hai Ba Trung, Di Linh, Lam Dong, Viet Nam; điện thoại 0387578730; mã số đăng ký/MST 8408941671. Trang chuyên đề không truy vấn Supabase và route được khai báo trước catch-all lesson.

### Trang chủ tập trung dự án (12/10/2026)

- Tiếng Anh là mặc định trong HTML và JavaScript, kể cả khi tắt JavaScript hoặc localStorage không hoạt động. Lựa chọn VI/EN được ghi vào `thaybinh.home.language.v2` chỉ khi người dùng chọn; key cũ từng tự lưu VI mặc định không được dùng.
- Hero hiển thị tên Learning Trajectory Architect, trạng thái MVP và ảnh AI. Mindmap ngay sau hero: mục tiêu → Orchestrator → 5 agent chuyên trách; Market Scout được phân biệt nét đứt và ghi rõ ngoài MVP/giai đoạn 2. Chọn node bằng chuột, Enter hoặc Space để đọc vai trò; không mở modal. Không JavaScript vẫn đọc được tất cả vai trò.
- Mindmap dùng nội dung HTML và connector SVG; mobile chuyển thành cấu trúc hai cột. Print hiển thị mọi vai trò agent, kể cả panel đang ẩn trên màn hình.
- FastENG/FastScores nằm trong mục Other projects thu gọn, giữ link App Store/pháp lý. Các định hướng khác đặt trong `details` đóng mặc định.
- Hai ảnh WebP lưu local, khai báo kích thước, ảnh hero ưu tiên tải, ảnh phía dưới lazy-load. Nguồn/giấy phép và provenance ở `docs/image-credits.md` và sidecar ảnh. Ảnh chỉ minh họa AI, không phải giao diện sản phẩm hay chứng nhận hợp tác Google DeepMind.

### Hồ sơ người sáng lập (23/10/2026)

- Trang chủ hiển thị hồ sơ Đặng Ngọc Quyên song ngữ tại `/#pi-profile`, có mục
  Profile trong menu và ảnh chân dung local. Học vị và học vấn được bổ sung theo
  thông tin người dùng cung cấp; không tự thêm vai trò PI hoặc liên kết nghiên
  cứu hiện tại với trường/viện.
- `show_research_profile` điều khiển CSS, navigation và include hồ sơ, độc lập
  với `profile_preview`. Chỉ server local truyền `profile_preview=True` để
  hiện ghi chú duyệt nội bộ và `noindex`; query string không thay đổi chế độ này.
- Trang chủ public giữ canonical hiện tại và không nhận `noindex` của preview.
  Lesson, Share và trang đề án không include hồ sơ hoặc stylesheet hồ sơ.
- Theo xác nhận ngày 23/10/2026: thạc sĩ Công nghệ thông tin; tốt nghiệp UIT,
  Khoa Kỹ thuật Máy tính năm 2017; phụ trách nhóm nghiên cứu Thay Binh EdTech
  từ tháng 2/2026; thực hiện chính Learning Trajectory Architect và đóng góp
  xuyên suốt các công đoạn. Không gán năm 2017 cho bằng thạc sĩ khi chưa có xác nhận.
- Trang đề án có mục `#research-lead`, mục lục và link về `/#pi-profile`.
  Trang đề án cùng website là nguồn tự công bố; link khoa UIT giới thiệu đơn vị
  đào tạo, không xác minh bằng cấp cá nhân hoặc quan hệ nghiên cứu hiện tại.
- Mục tài liệu/tiến độ dẫn đến đề án, kiến trúc, phạm vi MVP và tiêu chí đánh giá
  dự kiến. Không tự tạo bài báo, ORCID/Scholar, DOI hoặc kết quả thực nghiệm.
