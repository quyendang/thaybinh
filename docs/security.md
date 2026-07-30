# Bảo mật

- Service-role Supabase và `ADMIN_API_KEY` chỉ ở server environment; không log/render/commit.
- Các path retired `/firebase`, `/keys`, `/geteid`, `/code` luôn trả 404 và không được khôi phục mà thiếu security review.
- Data Supabase chỉ được render qua HTML escaping hoặc `data-*`; không đưa vào inline JavaScript string.
- Public errors phải generic; log chi tiết server-side. Admin API cần `X-API-Key`, constant-time compare và không trả lỗi RPC thô.
- `/remove` có thể partial sau khi clear app data; cần kiểm tra log/audit nếu Auth delete thất bại.
