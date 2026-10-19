# API contract

Nguồn chính xác nhất là Swagger: `http://localhost:4000/docs` (JSON: `/docs/json`, dùng cho openapi-typescript).
File này tóm tắt để đọc nhanh. Khi thêm/sửa endpoint, cập nhật cả file này.

## Quy ước chung
- Xác thực: cookie httpOnly `access_token` (web) hoặc header `Authorization: Bearer <token>` (Swagger, Postman).
- Mọi id (`ownerId`, `leaderIds`, `memberIds`, `assigneeId`...) là **memberId**, không phải userId.
- Lỗi luôn có dạng `{ "code": "ERROR_CODE", "message": "..." }`. Mã lỗi: `packages/shared/src/errors.ts`.
  Lỗi dữ liệu đầu vào: `{ code: "VALIDATION_FAILED", details: [{ field, errors[] }] }`.
- Không có xoá cứng: dùng `/archive` và `/unarchive`.

## Auth
| Method | Path | Ai | Ghi chú |
|---|---|---|---|
| POST | `/auth/login` | Mọi người | `{ email, password }` → set cookie, trả `{ accessToken, me }` |
| POST | `/auth/refresh` | Có cookie refresh | Cấp access token mới |
| POST | `/auth/logout` | Mọi người | Xoá cookie |
| GET | `/auth/me` | Đã đăng nhập | Member + user (email, name, avatar) |

## Workspace & nhân sự
| Method | Path | Ai |
|---|---|---|
| GET | `/workspace` | Đã đăng nhập |
| PATCH | `/workspace` | Admin |
| PATCH | `/workspace/modules` | Admin (`{ clientPortal, timeTracking, ... }`) |
| GET | `/members?skill=&role=` | Đã đăng nhập |
| POST | `/members` | Admin (`{ email, name, password, role, skills }`) |
| PATCH | `/members/:id` | Admin (`{ role, skills }`) |
| POST | `/members/:id/disable` · `/enable` | Admin |

## Khách hàng
| Method | Path | Ai |
|---|---|---|
| GET | `/clients?includeArchived=true` | Đã đăng nhập |
| GET | `/clients/:id` | Đã đăng nhập |
| POST | `/clients` | Admin |
| PATCH | `/clients/:id` | Admin |
| POST | `/clients/:id/archive` · `/unarchive` | Admin |

## Dự án
| Method | Path | Ai | Ghi chú |
|---|---|---|---|
| GET | `/projects?clientId=&mine=true` | Đã đăng nhập | `mine=true`: dự án tôi là leader/thành viên |
| GET | `/projects/:id` | Đã đăng nhập | Kèm `lists[]` đã sắp xếp |
| POST | `/projects` | Admin | Tự tạo 8 cột mặc định |
| PATCH | `/projects/:id` | Admin, Leader | |
| PUT | `/projects/:id/leaders` | Admin | `{ leaderIds }` |
| PUT | `/projects/:id/members` | Admin, Leader | `{ memberIds }` |
| PATCH | `/projects/:id/lists/:listId` | Admin, Leader | Đổi tên cột `{ name }` |
| POST | `/projects/:id/archive` · `/unarchive` | Admin | |
| GET | `/projects/:id/activities` | Đã đăng nhập | |

## Task
| Method | Path | Ai | Ghi chú |
|---|---|---|---|
| GET | `/projects/:id/tasks?listId=&ownerId=&statusType=&dueBefore=` | Đã đăng nhập | Sắp theo cột + vị trí |
| POST | `/projects/:id/tasks` | Admin, Leader | Mặc định vào cột Brief |
| GET | `/tasks/my` | Đã đăng nhập | Việc của tôi: phụ trách/phối hợp/checklist, chưa xong |
| GET | `/tasks/:id` | Đã đăng nhập | |
| PATCH | `/tasks/:id` | Admin, Leader | title, description, labelIds, startDate, dueDate, clientVisible |
| POST | `/tasks/:id/assign` | Admin, Leader | `{ ownerId, collaboratorIds }`. Đổi owner → chờ tiếp nhận lại |
| POST | `/tasks/:id/accept` | Người phụ trách | Brief → Lên ý tưởng |
| POST | `/tasks/:id/decline` | Người phụ trách | `{ reason }` ≥ 5 ký tự |
| POST | `/tasks/:id/submit` | Người phụ trách, Leader | → Duyệt nội bộ |
| POST | `/tasks/:id/review` | Admin, Leader | `{ result: approved\|changes_requested, note }` |
| POST | `/tasks/:id/client-review` | Admin, Leader | Ghi nhận kết quả khách duyệt |
| POST | `/tasks/:id/move` | Xem ghi chú | `{ listId, prevTaskId? , nextTaskId? }` |
| POST | `/tasks/:id/archive` · `/unarchive` | Admin, Leader | |
| GET | `/tasks/:id/activities` | Đã đăng nhập | |
| POST | `/tasks/:id/checklist` | Admin, Leader | `{ text, assigneeId?, dueDate? }` |
| PATCH | `/tasks/:id/checklist/:itemId` | Xem ghi chú | Chỉ `{ done }`: owner/phối hợp/người được giao mục. Sửa khác: Leader |
| DELETE | `/tasks/:id/checklist/:itemId` | Admin, Leader | |

### Kéo thả (`/move`)
- Gửi cột đích và **thẻ nằm ngay phía trên** (`prevTaskId`) hoặc **ngay phía dưới** (`nextTaskId`). Không gửi cả hai = cuối cột.
- Nhân viên: chỉ task mình phụ trách/phối hợp; không thả vào và không kéo ra khỏi `client_review`, `scheduled`, `done` → `TASK_COLUMN_LOCKED`.
- Nhân viên thả vào `internal_review` = nộp duyệt (phải đã tiếp nhận).

### Quy trình trạng thái
```
brief --accept--> ideation --> production --submit--> internal_review
internal_review --review approved--> client_review --client-review approved--> scheduled --> done
internal_review / client_review --changes_requested (bắt buộc note)--> revision (revisionCount+1) --submit--> internal_review
```

## Mã lỗi hay gặp
| Code | Khi nào |
|---|---|
| `UNAUTHORIZED` | Chưa đăng nhập / token hết hạn → gọi `/auth/refresh` |
| `INVALID_CREDENTIALS` | Sai email hoặc mật khẩu |
| `MEMBER_DISABLED` | Tài khoản bị khoá |
| `FORBIDDEN` | Không có quyền |
| `TASK_COLUMN_LOCKED` | Nhân viên kéo vào/ra cột khoá |
| `TASK_NOT_ASSIGNED` | Không phải người được giao |
| `TASK_NOT_PENDING_ACCEPTANCE` | Task đã tiếp nhận/báo bận rồi |
| `TASK_NOT_ACCEPTED` | Chưa tiếp nhận mà nộp duyệt |
| `TASK_INVALID_STATE` | Hành động không hợp với cột hiện tại |
| `DECLINE_REASON_REQUIRED` | Báo bận thiếu lý do |
| `REVIEW_NOTE_REQUIRED` | Trả về sửa thiếu góp ý |
| `MEMBER_NOT_IN_PROJECT` | Giao việc cho người ngoài dự án |
| `TASK_ARCHIVED` / `PROJECT_ARCHIVED` | Đã lưu trữ, không sửa được |

## CẦN BACKEND
(Frontend ghi các API cần thêm vào đây)
