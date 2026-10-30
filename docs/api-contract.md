# API contract (MVP nền tảng)

Base URL: `/api`. Swagger UI: `/docs`. API xác thực bằng cookie `qcc_access`
(httpOnly), hoặc header `Authorization: Bearer <accessToken>`.
`qcc_refresh` chỉ được gửi đến `/api/auth`.

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
| POST | `/auth/login` | `{ email, password }` | `{ accessToken, user, member }`; đặt access/refresh cookie | `UNAUTHORIZED`, `VALIDATION_FAILED` |
| POST | `/auth/refresh` | refresh cookie | `{ success: true, accessToken }`; xoay token và cookie | `UNAUTHORIZED` |
| POST | `/auth/logout` | — | `{ success: true }`; xóa cookie | — |
| GET | `/auth/me` | access cookie | `{ _id, email, name, avatar, role, workspaceId }` | `UNAUTHORIZED` |

## Người dùng, workspace và thành viên

| Method | Endpoint | Quyền | Response | Lỗi chính |
|---|---|---|---|---|
| GET | `/users/me` | thành viên đã đăng nhập | thông tin hồ sơ hiện tại | `UNAUTHORIZED`, `NOT_FOUND` |
| POST | `/users` | admin | `{ email, name, password, role }` → `{ user, member }`; tạo user và gắn vào workspace hiện tại | `CONFLICT`, `FORBIDDEN`, `VALIDATION_FAILED` |
| GET | `/workspaces/current` | thành viên workspace | workspace hiện tại và `modules` | `FORBIDDEN`, `NOT_FOUND` |
| GET | `/members` | admin/staff | danh sách thành viên cùng workspace | `FORBIDDEN` |
| POST | `/members` | admin | `{ email, name, password, role }` → member mới (tạo user kèm theo, giữ tương thích) | `CONFLICT`, `VALIDATION_FAILED` |
| PATCH | `/members/:id` | admin | `{ role?, active? }` | `NOT_FOUND`, `VALIDATION_FAILED` |

Admin đầu tiên được tạo bằng lệnh `pnpm --filter @qcc/api seed`; lệnh yêu cầu
cấu hình seed trong `.env` và không ghi đè email đã tồn tại.

Với client không dùng cookie, lấy `accessToken` từ login, gửi header
`Authorization: Bearer <accessToken>` cho các API cần đăng nhập; sau khi refresh
thì thay bằng `accessToken` mới trong response. Access token hết hạn sau 15 phút.

## Projects

Project là thực thể độc lập trong workspace dùng để gom task; API hiện tại
không yêu cầu Client. `leaderIds` và `memberIds` là userId của Staff đang hoạt
động trong cùng workspace; Leader không đồng thời nằm trong memberIds.

Admin tạo project và gán ít nhất một Leader. Admin cập nhật thông tin/Leader
và lưu trữ project. Leader của project được thêm thành viên; staff có thể đọc
danh sách project nội bộ nhưng không quản lý project nếu không phải Leader.

| Method | Endpoint | Quyền | Request | Response | Lỗi chính |
|---|---|---|---|---|---|
| POST | `/projects` | admin | `{ name, leaderIds, serviceType?, memberIds? }` | project mới, `archived=false` | `FORBIDDEN`, `VALIDATION_FAILED` |
| GET | `/projects` | admin/staff | — | danh sách project chưa archive trong workspace | `FORBIDDEN` |
| GET | `/projects/:id` | admin/staff | — | chi tiết project cùng workspace | `NOT_FOUND`, `FORBIDDEN` |
| PATCH | `/projects/:id` | admin | `{ name?, serviceType?, leaderIds? }` | project đã cập nhật | `NOT_FOUND`, `VALIDATION_FAILED` |
| POST | `/projects/:id/members` | admin hoặc Leader của project | `{ memberIds: string[] }` | project với memberIds đã thêm (không trùng) | `NOT_FOUND`, `FORBIDDEN`, `VALIDATION_FAILED` |
| POST | `/projects/:id/archive` | admin | — | project `archived=true` | `NOT_FOUND`, `FORBIDDEN` |
| POST | `/projects/:id/restore` | admin | — | project `archived=false` | `NOT_FOUND`, `FORBIDDEN` |

Không thể đọc hoặc tạo task trong project đã archive. Archive project không
xóa cứng project/task; Admin có thể restore project để truy cập lại các task.

## Task

Mọi truy vấn task chỉ đọc trong workspace của actor; task đã lưu trữ không
xuất hiện trong danh sách hoặc endpoint chi tiết. `projectId` phải trỏ tới
project đang hoạt động trong cùng workspace. Người được giao/cộng tác viên
phải là Staff đang hoạt động và là Leader hoặc Member của project.

Admin có toàn quyền task. Leader chỉ quản lý/duyệt task của project mình;
nhân viên đọc task nội bộ, chỉ nhận/báo bận/nộp duyệt và kéo task được giao.
Nhân viên không được kéo sang `client_review`, `scheduled`, `done`. Project
Leader có thể kéo mọi task trong project. Quyền được kiểm tra ở service sau
khi nạp project, không dựa riêng vào decorator.

| Method | Endpoint | Quyền | Request | Response | Lỗi chính |
|---|---|---|---|---|---|
| POST | `/tasks` | admin/Leader của project | `{ title, projectId, ownerId, description?, clientId?, collaboratorIds?, dueDate? }` | task mới ở `brief`, acceptance `pending` | `FORBIDDEN`, `VALIDATION_FAILED`, `NOT_FOUND` |
| GET | `/tasks?projectId=...` | admin/staff | query tùy chọn `ownerId`, `statusType`, `dueFrom`, `dueTo` (ISO date) | danh sách task theo position | `FORBIDDEN`, `VALIDATION_FAILED`, `NOT_FOUND` |
| GET | `/tasks/:id` | admin/staff | — | chi tiết task | `NOT_FOUND`, `FORBIDDEN` |
| PATCH | `/tasks/:id` | admin/Leader của project | các trường task có thể sửa, không gồm `projectId`/workflow | task đã cập nhật | `NOT_FOUND`, `FORBIDDEN`, `VALIDATION_FAILED` |
| POST | `/tasks/:id/archive` | admin/Leader của project | — | task đã `archived=true` | `NOT_FOUND`, `FORBIDDEN` |
| POST | `/tasks/:id/accept` | người được giao | — | acceptance `accepted` | `NOT_FOUND`, `FORBIDDEN`, `INVALID_TASK_TRANSITION` |
| POST | `/tasks/:id/decline` | người được giao | `{ reason }` (bắt buộc) | acceptance `declined` kèm lý do | `NOT_FOUND`, `FORBIDDEN`, `INVALID_TASK_TRANSITION`, `VALIDATION_FAILED` |
| POST | `/tasks/:id/submit` | người được giao | `{ note? }` | task chuyển `internal_review` | `NOT_FOUND`, `FORBIDDEN`, `INVALID_TASK_TRANSITION` |
| POST | `/tasks/:id/review` | admin/Leader của project | `{ result: "approved" \| "revision_required", note? }` | đạt → `client_review`; trả về → `revision` | `NOT_FOUND`, `FORBIDDEN`, `INVALID_TASK_TRANSITION` |
| POST | `/tasks/:id/client-review` | admin/Leader của project (MVP ghi nhận thủ công) | `{ result: "approved" \| "revision_required", note? }` | đạt → `scheduled`; trả về → `revision` | `NOT_FOUND`, `FORBIDDEN`, `INVALID_TASK_TRANSITION` |
| POST | `/tasks/:id/move` | admin/Leader của project; nhân viên chỉ task của mình | `{ statusType, afterTaskId?, beforeTaskId? }` | task được chuyển và position fractional được tính trên server | `NOT_FOUND`, `FORBIDDEN`, `TASK_COLUMN_LOCKED`, `INVALID_TASK_TRANSITION` |

Các thay đổi task thành công đều tạo activity cùng workspace/project/task,
actor, loại hoạt động và dữ liệu thay đổi. `statusChangedAt` cập nhật khi
chuyển cột; các quyết định duyệt được lưu vào `reviewHistory`, và trả về
chỉnh sửa tăng `revisionCount`. Không cho sửa trạng thái qua `PATCH`; dùng
workflow action hoặc `/move` để tránh bỏ qua các bước duyệt.
