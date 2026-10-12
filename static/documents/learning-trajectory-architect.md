# Learning Trajectory Architect

**AI Multi-Agent System for Long-term Personalized Learning Paths**

> Một hệ thống multi-agent giúp người học xây dựng, theo dõi và liên tục tối ưu lộ trình học tập dài hạn dựa trên mục tiêu, điểm mạnh/yếu và phong cách học thực tế.

---

## 1. Tổng quan ý tưởng

Learning Trajectory Architect không phải là chatbot giải bài tập hay tutor ngắn hạn. Đây là **cố vấn học tập cá nhân 24/7** dưới dạng multi-agent system, tập trung vào:

- Xây dựng lộ trình học dài hạn (3–24 tháng)
- Phát hiện và sửa misconception (hiểu sai căn bản)
- Kết hợp kiến thức + dự án thực tế + kỹ năng mềm
- Rèn luyện metacognition (học cách học)
- Liên tục điều chỉnh dựa trên dữ liệu thực tế của người học

**Đối tượng mục tiêu chính:**
- Học sinh cấp 3 chuẩn bị đại học / thi chuyên
- Sinh viên muốn xây dựng portfolio thực chiến
- Người đi làm muốn chuyển nghề hoặc upskill
- Gia sư / trung tâm giáo dục nhỏ muốn cung cấp dịch vụ premium

---

## 2. Kiến trúc kỹ thuật

### 2.1. Multi-Agent Architecture

Hệ thống sử dụng mô hình hierarchical multi-agent với một **Orchestrator Agent** làm trung tâm điều phối.

```
┌─────────────────────────────────────────────────────────────┐
│                    Orchestrator Agent                       │
│         (Quản lý trạng thái, quyết định luồng làm việc)     │
└──────────────────────┬──────────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┬──────────────────┐
       │               │               │                  │
       ▼               ▼               ▼                  ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐   ┌─────────────┐
│  Profiler   │ │ Gap & Mis-  │ │ Trajectory  │   │  Project    │
│   Agent     │ │ conception  │ │  Designer   │   │  Coach      │
│             │ │  Detector   │ │   Agent     │   │   Agent     │
└─────────────┘ └─────────────┘ └─────────────┘   └─────────────┘
       │               │               │                  │
       └───────────────┴───────────────┴──────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Reflection & Meta-  │
                    │ cognition Agent     │
                    └─────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Market Scout Agent  │  (Optional - Phase 2)
                    │ (Job & Opportunity) │
                    └─────────────────────┘
```

### 2.2. Data Flow chính

1. **Onboarding**: Người dùng cung cấp mục tiêu + dữ liệu hiện có (điểm số, bài làm, LinkedIn, Notion export…).
2. **Profiling**: Profiler Agent tạo learner profile chi tiết + learning style.
3. **Diagnosis**: Gap & Misconception Detector chạy session chẩn đoán tương tác.
4. **Planning**: Trajectory Designer tạo lộ trình chi tiết (weekly milestones + projects).
5. **Execution Loop**: Project Coach theo dõi tiến độ → Reflection Agent đánh giá → điều chỉnh lộ trình.
6. **Memory**: Toàn bộ lịch sử được lưu vào long-term memory (vector DB) để cá nhân hóa ngày càng sâu.

### 2.3. Tech Stack đề xuất (Indie-friendly)

| Thành phần              | Công nghệ khuyến nghị                          | Lý do |
|-------------------------|------------------------------------------------|-------|
| Agent Framework         | LangGraph hoặc CrewAI                          | Dễ quản lý state & multi-agent |
| LLM                     | Claude 3.5/4 Sonnet hoặc GPT-4o                | Reasoning mạnh, tool calling tốt |
| Long-term Memory        | Chroma / Pinecone / pgvector                   | Lưu learner profile & history |
| Backend                 | FastAPI (Python) hoặc Next.js API routes       | Nhanh, dễ deploy |
| Frontend                | Next.js + Tailwind + shadcn/ui                 | UX đẹp, dễ iterate |
| Authentication          | Clerk hoặc Supabase Auth                       | Nhanh setup |
| Database                | Supabase (PostgreSQL)                          | Auth + DB + Storage |
| Workflow / Integration  | n8n hoặc Make.com                              | Kết nối Zalo, Google Classroom, Notion |
| Voice (optional)        | Whisper + TTS (ElevenLabs / OpenAI)            | Hỗ trợ học bằng giọng nói |
| Deployment              | Vercel + Railway / Render                      | Chi phí thấp lúc đầu |

**Ưu tiên giai đoạn đầu**: LangGraph + Claude + Supabase + Next.js.

---

## 3. Phạm vi MVP (Minimum Viable Product)

### Mục tiêu MVP
Xây dựng phiên bản có thể dùng thật với 50–100 early users trong vòng 6–8 tuần, tập trung vào **một persona rõ ràng**.

**Persona ưu tiên đề xuất**: Sinh viên IT / Design năm 2–4 muốn xây dựng portfolio thực chiến để apply việc hoặc freelance.

### Tính năng có trong MVP

| Tính năng | Mô tả | Ưu tiên |
|-----------|------|--------|
| Onboarding & Goal Setting | Form + chat để xác định mục tiêu nghề nghiệp + trình độ hiện tại | Must-have |
| Learner Profile Generation | Tạo profile chi tiết (skills, gaps, learning style) | Must-have |
| Interactive Diagnosis Session | 1 session chẩn đoán misconception cơ bản (15–25 phút) | Must-have |
| Personalized Learning Path | Lộ trình 8–12 tuần với milestones hàng tuần | Must-have |
| Project Suggestions | Gợi ý 3–5 mini-projects phù hợp trình độ + mục tiêu | Must-have |
| Weekly Check-in & Reflection | Form + AI feedback về tiến độ và cách học | Must-have |
| Progress Dashboard | Hiển thị % hoàn thành, skill radar, lịch sử reflection | Must-have |
| Basic Memory | Nhớ toàn bộ lịch sử học của user | Must-have |

### Tính năng **không** làm trong MVP
- Market Scout Agent (job trend)
- Multi-language sâu (chỉ hỗ trợ tiếng Việt + tiếng Anh tốt)
- Tích hợp Zalo / Google Classroom sâu
- Voice interface
- Teacher/Admin dashboard
- Mobile app native
- Collaborative learning (học nhóm)

### Tiêu chí thành công MVP
- Người dùng hoàn thành onboarding + diagnosis trong < 30 phút
- Ít nhất 40% users quay lại check-in tuần thứ 2
- Người dùng cảm thấy lộ trình "hiểu mình hơn" so với ChatGPT thông thường (đo bằng survey)

---

## 4. Go-to-Market Strategy

### 4.1. Giai đoạn 1: Validation (Tuần 1–4)
- Xây dựng landing page + waitlist (Carrd / Framer + Tally)
- Đăng bài chia sẻ pain point trên:
  - Facebook groups (Sinh viên IT, Design, Tự học lập trình…)
  - Threads, X, Group Zalo học tập
  - Reddit (r/learnprogramming, r/Vietnam)
- Mục tiêu: 150–300 người đăng ký waitlist

### 4.2. Giai đoạn 2: Closed Beta (Tuần 5–10)
- Mời 30–50 người từ waitlist vào dùng miễn phí
- Yêu cầu feedback hàng tuần (form ngắn + interview 5–7 người)
- Tập trung cải thiện diagnosis quality và cảm giác "được hiểu"

**Kênh chính**:
- Community-led (group sinh viên, Discord tự học)
- Content: Series "Tôi đã xây lộ trình học X như thế nào với AI" trên blog / Threads

### 4.3. Giai đoạn 3: Public Launch & Monetization
**Pricing đề xuất**:
- Free: Onboarding + 1 diagnosis + lộ trình cơ bản (giới hạn)
- Pro: 199.000 – 299.000 VNĐ/tháng (unlimited check-in, memory đầy đủ, project coaching)
- Team / Tutor: 1.5–3 triệu/tháng (dành cho gia sư hoặc trung tâm nhỏ)

**Kênh tăng trưởng**:
1. **Product-led**: Cho phép user share lộ trình của mình (public link)
2. **Community**: Hợp tác với các page/group học tập lớn
3. **Partnership**: Làm việc với trung tâm tiếng Anh / lập trình nhỏ để white-label
4. **Content SEO**: Viết sâu về "cách xây dựng lộ trình học cá nhân hóa"

### 4.4. Metric quan trọng cần theo dõi
- Activation rate (hoàn thành diagnosis)
- Week-2 retention
- NPS / qualitative feedback về "cảm giác được hiểu"
- Conversion Free → Pro

---

## 5. Lộ trình phát triển tiếp theo (sau MVP)

**Phase 2 (tháng 3–5)**
- Thêm Market Scout Agent
- Tích hợp Zalo OA & Google Classroom
- Teacher / Tutor dashboard
- Hỗ trợ nhiều persona hơn (học sinh cấp 3, người chuyển nghề)

**Phase 3**
- Multi-agent simulation (luyện phỏng vấn, thuyết trình)
- Collaborative learning paths
- Mobile experience tốt hơn
- API cho bên thứ 3

---

## 6. Rủi ro & Cách giảm thiểu

| Rủi ro | Mức độ | Cách giảm thiểu |
|--------|--------|-----------------|
| Chất lượng diagnosis chưa đủ sâu | Cao | Tập trung prompt engineering + human-in-the-loop review sớm |
| Người dùng không quay lại | Cao | Thiết kế weekly check-in cực ngắn + giá trị rõ ràng mỗi tuần |
| Chi phí LLM cao | Trung bình | Cache thông minh + dùng model nhỏ hơn cho task đơn giản |
| Khó differentiate với ChatGPT | Trung bình | Nhấn mạnh long-term memory + structured trajectory + metacognition |

---

## 7. Kết luận

Learning Trajectory Architect giải quyết một pain point thật và còn tương đối trống: **việc xây dựng và duy trì lộ trình học dài hạn một cách thông minh và cá nhân hóa**.

Với cách tiếp cận multi-agent + tập trung vào metacognition và project-based learning, sản phẩm có cơ hội tạo ra sự khác biệt rõ ràng so với các AI tutor thông thường.

---

**Ready to build?**  
Bắt đầu bằng việc define rõ persona đầu tiên và thiết kế flow onboarding + diagnosis session cho thật mượt.

Nếu cần mình hỗ trợ thêm (prompt mẫu cho từng agent, database schema, hoặc wireframe ý tưởng), cứ nói nhé!
