# API contract (MVP nền tảng)

Base URL: `/api`. Swagger UI: `/docs`. API xác thực bằng cookie `qcc_access`
(httpOnly); `qcc_refresh` chỉ được gửi đến `/api/auth`.

## Chạy local

1. Cài pnpm 10, sao chép `apps/api/.env.example` thành `apps/api/.env` rồi thay
   hai JWT secret bằng chuỗi ngẫu nhiên riêng (ít nhất 32 ký tự), đặt mật khẩu
   seed dài ít nhất 12 ký tự.
2. Chạy `docker compose up -d mongodb`, sau đó `pnpm install`.
3. Tạo workspace và admin đầu tiên bằng `pnpm --filter @qcc/api seed`.
4. Chạy API bằng `pnpm --filter @qcc/api dev`; mở Swagger tại `http://localhost:3001/docs`.
5. Đăng nhập qua `POST /api/auth/login` với thông tin seed.

Seed và API nạp cấu hình từ `apps/api/.env`. Không dùng secret/mật khẩu trong
`.env.example` ở môi trường thật.

## Auth

| Method | Endpoint | Request | Response | Lỗi chính |
|---|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `{ user, member }`; đặt access/refresh cookie | `UNAUTHORIZED`, `VALIDATION_FAILED` |
| POST | `/auth/refresh` | refresh cookie | `{ success: true }`; xoay token | `UNAUTHORIZED` |
| POST | `/auth/logout` | — | `{ success: true }`; xóa cookie | — |
| GET | `/auth/me` | access cookie | `{ _id, email, name, avatar, role, workspaceId }` | `UNAUTHORIZED` |

## Người dùng, workspace và thành viên

| Method | Endpoint | Quyền | Response | Lỗi chính |
|---|---|---|---|---|
| GET | `/users/me` | thành viên đã đăng nhập | thông tin hồ sơ hiện tại | `UNAUTHORIZED`, `NOT_FOUND` |
| GET | `/workspaces/current` | thành viên workspace | workspace hiện tại và `modules` | `FORBIDDEN`, `NOT_FOUND` |
| GET | `/members` | admin/staff | danh sách thành viên cùng workspace | `FORBIDDEN` |
| POST | `/members` | admin | `{ email, name, password, role }` | `CONFLICT`, `VALIDATION_FAILED` |
| PATCH | `/members/:id` | admin | `{ role?, active? }` | `NOT_FOUND`, `VALIDATION_FAILED` |

Admin đầu tiên được tạo bằng lệnh `pnpm --filter @qcc/api seed`; lệnh yêu cầu
cấu hình seed trong `.env` và không ghi đè email đã tồn tại.
