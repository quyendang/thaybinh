# Hợp đồng Supabase

## Cấu hình và boundary quyền

| Biến | Mục đích | Quy tắc |
| --- | --- | --- |
| `SUPABASE_URL` | URL dự án Supabase | Có thể dùng server-side. |
| `SUPABASE_KEY` | Anon/public key | Client Supabase thường cho đọc/ghi theo RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key | Chỉ server-side; không log, render hoặc gửi qua network tới browser. |
| `ADMIN_API_KEY` | Bảo vệ `/users`, `/user`, `/removeData`, `/remove` | Gửi bằng `X-API-Key`; phải quay vòng khi lộ. |

`main.py` tạo hai client: `supabase` (anon key) và `supabase_admin` (service role). Không sử dụng service-role client cho public feature chỉ vì tiện.

## Dữ liệu được code truy cập

Repository không có migration/schema; đây là contract suy ra từ query hiện tại, phải xác nhận với Supabase Dashboard hoặc migration trước khi đổi.

| Resource | Cách dùng trong app |
| --- | --- |
| `lessons` | `id`, `name`, `short_id`, liên kết `group_id` để lấy `groups.name`. |
| `groups` | Tên nhóm của lesson qua FK `lessons_group_id_fkey`. |
| `words` | Lọc `lesson_id`, sort `latest_update`; UI nhận `word`, `type`, `pronunciation`, `meaning`, `translate`, `example`, `word_voice`, `eg_voice`, `trans_voice`, `df_voice`. |

## RPC và side effects quản trị

| Operation | Service call | Kết quả kỳ vọng |
| --- | --- | --- |
| Danh sách user | `admin_list_users(p_page, p_per_page, p_search)` | Object tương thích `UsersListResponse`. |
| Thống kê user | `admin_get_user_stats(target_user_id)` | Object tương thích `UserStatsResponse`. |
| Xóa dữ liệu app | `admin_clear_user_data(target_user_id)` | Object RPC, không xóa Auth user. |
| Xóa toàn bộ user | `admin_clear_user_data` trước, rồi `auth.admin.delete_user` | Có thể để trạng thái một phần nếu xóa Auth thất bại. |

Các route xóa validate UUID ở API layer. Khi thay đổi sequence hay RPC, cần quyết định rõ idempotency, audit log và recovery cho trạng thái partial failure.

## Quy tắc thay đổi

- Không thêm field, sửa RLS, đổi FK/RPC signature dựa trên suy đoán từ repo.
- Thử query/RPC trên project staging trước production; dùng credential riêng tư, không paste response có PII vào issue/log.
- Với dữ liệu Supabase đưa vào JavaScript, encode theo đúng JS context; HTML escaping đơn thuần không đủ cho inline script/attribute handler.
