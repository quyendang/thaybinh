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
