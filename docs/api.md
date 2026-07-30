# API contract

## Lesson URLs

| Route | Hành vi |
| --- | --- |
| `GET /?lessonid=&column=&print=` | Legacy share URL, chuyển lesson ID qua UUID v5. |
| `GET /share?id=&c=&p=` | Share lesson theo `short_id`. |
| `GET /{short_id}?c=&p=` | Link short lesson; `!` xáo trộn danh sách từ. |

`c/p` là CSV số; `column/print` là base64 URL-safe của CSV. Giữ nguyên semantics này để link đang chia sẻ tiếp tục hoạt động.

## Admin API

`GET /users`, `GET /user`, `DELETE /removeData`, `DELETE /remove` cần `X-API-Key`. Không đặt key trong URL/browser. `/remove` clear app data trước rồi xóa Auth user; caller phải xử lý lỗi partial theo response 500.

`/firebase`, `/keys`, `/geteid`, `/code` không còn API contract và trả 404.
