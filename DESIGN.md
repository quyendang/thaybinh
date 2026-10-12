---
name: Thay Binh EdTech — Landing và trang dự án
description: Hệ thống hiện có của website giới thiệu Thay Binh EdTech, trích xuất ngày 12/10/2026.
colors:
  blue: "#2448dc"
  blue-deep: "#1937b7"
  ink: "#182651"
  muted: "#53617a"
  paper: "#ffffff"
  cloud: "#f5f7ff"
  lilac: "#e4dffc"
  mint: "#def1e5"
  line: "#d9dfed"
typography:
  display:
    fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif'
    fontSize: "clamp(42px, 4.3vw, 66px)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-.035em"
  headline:
    fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif'
    fontSize: "clamp(30px, 3.1vw, 44px)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-.035em"
  body:
    fontFamily: '"Source Sans 3", "Segoe UI", sans-serif'
    fontSize: "18px"
    lineHeight: 1.6
  label:
    fontFamily: '"Source Sans 3", "Segoe UI", sans-serif'
    fontSize: "16px"
    fontWeight: 600
rounded:
  control: "8px"
  panel: "12px"
  status: "6px"
spacing:
  control-y: "14px"
  control-x: "22px"
  panel: "30px"
  section-desktop: "108px"
  section-mobile: "64px"
components:
  button-blue:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "14px 22px"
  button-blue-hover:
    backgroundColor: "{colors.blue-deep}"
  button-white:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.blue}"
    rounded: "{rounded.control}"
    padding: "14px 22px"
  button-white-hover:
    backgroundColor: "{colors.lilac}"
  mindmap-node:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "20px"
  mindmap-node-selected:
    backgroundColor: "{colors.lilac}"
  mindmap-hub:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.panel}"
    padding: "24px 16px"
---

# Design System: Thay Binh EdTech

## Overview

Tài liệu mô tả hệ thống đã triển khai của Landing và trang đọc dự án, dựa trên `static/css/landing.css`, `static/js/landing.js`, `templates/landing.html` và `templates/learning-trajectory.html`. Đây là bản trích xuất từ mã và ảnh kiểm chứng, không phải seed hay tuyên bố rằng người dùng đã phê duyệt một concept mới. Chưa có tên Creative North Star do người dùng chọn.

Nền trắng, mảng xanh đậm và khoảng trống rộng tổ chức nội dung giới thiệu giáo dục. Tiêu đề có trọng lượng rõ ràng; nội dung dài dùng chữ dễ đọc; màu pastel làm rõ cấu trúc và trạng thái chọn. Mindmap HTML/CSS/SVG giải thích kiến trúc agent; ảnh AI có nguồn cụ thể hỗ trợ kể chuyện, không đóng vai trò ảnh sản phẩm. Hệ thống này có phạm vi riêng, không thay thế token hoặc tương tác của Share.

**Key Characteristics:**

- Xanh chủ đạo đi cùng nền trắng và chữ xanh mực.
- Be Vietnam Pro cho tiêu đề, Source Sans 3 cho nội dung.
- Bề mặt phẳng, góc mềm, đường chia mảnh.
- Tiếng Anh mặc định, lựa chọn VI/EN và điều hướng có hỗ trợ bàn phím.

## Colors

Các token ở frontmatter là giá trị chuẩn lấy từ phạm vi Landing.

### Primary

- **Xanh chủ đạo — blue:** nền hero, CTA chính, biểu tượng thương hiệu và Orchestrator trong mindmap.
- **Xanh sâu — blue-deep:** trạng thái hover CTA và nhãn thông tin của node agent.

### Secondary

- **Tím nhạt — lilac:** mục tiêu người học, node agent được chọn, định hướng lớp học và hover nút trắng.
- **Xanh bạc hà — mint:** định hướng sức khỏe học sinh trong phần mở rộng.

### Neutral

- **Xanh mực — ink:** tiêu đề và nội dung chính trên nền sáng.
- **Xanh xám — muted:** mô tả, chú thích và thông tin hỗ trợ.
- **Trắng giấy — paper:** nền trang và chữ trên mảng xanh.
- **Mây sáng — cloud:** nền khu định hướng, sơ đồ và phần liên hệ trong trang đọc.
- **Đường chia — line:** ranh giới header, section và danh sách nội dung.

## Typography

**Display Font:** Be Vietnam Pro với Segoe UI và sans-serif dự phòng.

**Body Font:** Source Sans 3 với Segoe UI và sans-serif dự phòng.

### Hierarchy

- **Display:** hero Learning Trajectory Architect dùng token display; mobile dùng (`clamp(38px, 10.8vw, 58px)`). H1 trang dự án có thang riêng (`clamp(34px, 5.3vw, 72px)`), line-height (1.16), tracking (-.035em), độ rộng tối đa (18ch).
- **Headline:** tiêu đề section dùng token headline. Section bài đọc có kích thước riêng (`clamp(26px, 3vw, 35px)`).
- **Body:** token body là nền tảng. Mô tả hero dùng chữ (18px), line-height (1.65), tối đa (50ch); lời dẫn chính có chữ (25px / 600), line-height (1.4). Bài đọc có vùng tối đa (75ch); lời dẫn trang dự án tối đa (65ch).
- **Label:** điều hướng và liên kết hành động dùng trọng lượng (600); chú thích minh họa nhỏ hơn (12px).

## Layout

Khung trang tối đa (1240px), chiều rộng bằng viewport trừ (96px) trên desktop. Dưới (1100px), lề còn (32px) mỗi bên; dưới (760px), còn (20px); dưới (359px), còn (16px). Section thông thường dùng khoảng cách dọc theo token section-desktop và section-mobile.

Hero hiện tại có hai cột bằng nhau, khoảng cách (60px), padding dọc (64px / 56px); mobile chuyển thành một cột, khoảng cách (38px), padding dọc (42px). Mindmap ngay sau hero có Orchestrator ở giữa, mục tiêu ở trên, các agent xung quanh và connector SVG. Canvas desktop cao (600px); dưới (760px), connector được ẩn, mục tiêu và hub trải hai cột, các agent sắp thành lưới hai cột. Danh sách Other projects gọn có hai cột, chuyển thành một cột trên mobile; các định hướng giáo dục khác nằm trong `details` đóng mặc định. Đây là phân cấp của homepage, không phải quy tắc bắt buộc cho mọi trang. Trang đọc có mục lục (260px), khoảng cách cột (80px), nội dung không vượt vùng đọc. Từ (761px) đến (1150px), mục lục giảm còn (210px), khoảng cách (40px). Dưới (760px), mục lục nằm trong luồng trang và các liên kết tự xuống dòng.

Header sticky có chiều cao tối thiểu (90px) trên desktop và (76px) trên mobile. Mục lục desktop sticky ở (120px), đồng thời section có scroll offset để tiêu đề không bị che. Print bỏ header, hành động và mục lục; bài đọc trở thành một cột với tiêu đề và mục danh sách hạn chế ngắt trang bất tiện. Mindmap khi in hiển thị tất cả panel giải thích agent, kể cả panel đang ẩn trên màn hình.

## Elevation & Depth

Các bề mặt hiện tại không dùng box-shadow. Độ sâu đến từ tương phản nền, màu pastel và đường chia. Trạng thái tương tác dùng đổi màu, gạch dưới và focus ring tím (3px), offset (5px); trong hero, ring chuyển sang trắng để rõ trên nền xanh. CTA chuyển màu trong (0.2s ease). Khi người dùng bật reduced motion, animation và transition bị tắt.

## Shapes

Nút, công cụ chuyển ngôn ngữ và menu có góc bo vừa theo token control; tấm minh họa, sơ đồ, Orchestrator và vùng trao đổi có góc bo lớn hơn theo token panel. Nhãn trạng thái có góc bo riêng theo token status. Node agent và hub là các khối góc mềm; Market Scout có border và connector nét đứt để phân biệt giai đoạn 2 ngoài MVP. Đường chia thường có độ dày (1px).

## Components

### Buttons

Nút là liên kết hành động rõ ràng: chiều cao tối thiểu (54px), chữ (17px / 600), khoảng cách giữa chữ và icon (20px). Nút trắng nằm trên nền hero xanh; nút xanh dùng trên nền sáng. Mobile giảm chữ còn (16px), padding ngang (18px). Hover dùng các biến thể frontmatter; focus dùng ring chung của Landing.

### Navigation

Header dùng nền trắng, đường chia dưới và liên kết chữ (16px / 600). Mobile bật nút menu với vùng nhấn (44px × 44px), menu xổ xuống dưới header. Escape đóng menu và đưa focus về nút mở; click ngoài, click liên kết, đổi ngôn ngữ hoặc chuyển breakpoint cũng đóng menu. Skip link dẫn đến nội dung chính.

### Language switch

Hai nút VI/EN nằm trong nền cloud; nút đang chọn có nền blue và chữ paper, dùng `aria-pressed`. Tiếng Anh mặc định trong HTML và JavaScript. Preference `thaybinh.home.language.v2` được chia sẻ giữa Landing và trang dự án, chỉ ghi khi người dùng chọn VI/EN; key cũ tự lưu VI không được đọc. JavaScript cập nhật ngôn ngữ tài liệu, accessible labels và alt ảnh có bản dịch. Không có JavaScript vẫn hiển thị tiếng Anh, liên kết điều hướng và mọi vai trò agent vẫn đọc được.

### Status

Nhãn trạng thái gọn, border mảnh, chữ (13px / 600), padding (4px 10px). Nhãn sản phẩm đã phát hành dùng xanh lá. Nội dung dự án phải nêu rõ đang xây MVP; các mốc, giá và tính năng từ README là đề xuất.

### Cards / Containers

Các container dùng nền paper, cloud hoặc lilac, không dùng shadow. Nội dung có thể là danh sách định nghĩa, luồng học hoặc mindmap; caption nói rõ đây là kiến trúc đề xuất, không phải giao diện ứng dụng. Trang đọc dùng danh sách có đường chia thay cho lưới card dày đặc.

### Agent mindmap

Mindmap đặt Orchestrator ở giữa, phối hợp Profiler, Gap & Misconception Detector, Trajectory Designer, Project Coach và Reflection & Metacognition. Market Scout nằm riêng với nét đứt và nhãn giai đoạn 2/ngoài MVP. Các node là button thật, có `aria-pressed` và `aria-controls`; Enter/Space chọn panel vai trò tương ứng, không mở modal. Khi JavaScript hoạt động, Profiler được chọn ban đầu. Hover đổi border sang blue và nền sáng; selected dùng lilac; focus dùng ring chung.

### AI imagery

Hai ảnh WebP local từ bộ Visualising AI có tác giả/nguồn và giấy phép ở `docs/image-credits.md`: Novoto Studio / Google DeepMind cho mạng AI, Jesper Lindborg / Google DeepMind cho đường đi hình học. Đây là artwork có sẵn từ nguồn stock, không phải ảnh AI mới tạo, ảnh sản phẩm hoặc xác nhận hợp tác. Hero ưu tiên tải ảnh, ảnh dưới hero và banner trang đọc lazy-load; HTML khai báo kích thước. Crop bằng `object-fit: cover`: ảnh hero cao (420px) trên desktop và tỷ lệ (4/3) trên mobile; ảnh phần giới thiệu tỷ lệ (16/10); banner trang dự án cao (320px), mobile tỷ lệ (16/9). Giữ attribution và alt có ý nghĩa.

## Do's and Don'ts

### Do:

- **Do** lấy màu, chữ và bề mặt của Landing từ hệ thống đã trích xuất này khi mở rộng website giới thiệu.
- **Do** giữ tiếng Anh mặc định, lựa chọn VI/EN rõ ràng, focus nhìn thấy, skip link, menu bàn phím và reduced motion.
- **Do** đặt hành vi trong file JavaScript riêng; dùng HTML/CSS cho sơ đồ có ý nghĩa nội dung.
- **Do** ghi rõ trạng thái MVP và phân biệt đề xuất với tính năng đã phát hành.
- **Do** giữ attribution, provenance và cách tải ảnh phù hợp vị trí hiển thị.

### Don't:

- **Don't** áp hệ thống Landing này lên Share hoặc thay đổi các hợp đồng lesson URL.
- **Don't** thêm CTA/social placeholder hay link ngoài chưa xác thực.
- **Don't** đưa dữ liệu request/Supabase vào inline JavaScript.
- **Don't** dùng artwork AI hay mindmap như bằng chứng về giao diện sản phẩm đã phát hành hoặc quan hệ đối tác.
