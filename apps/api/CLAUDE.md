# Backend (apps/api) – NestJS + Mongoose + TypeScript

Bối cảnh chung xem CLAUDE.md ở gốc repo. File này là quy tắc riêng cho backend.

## Kiến trúc
- Module theo domain: auth, users, workspaces, members, skills, clients, projects, lists, tasks,
  comments, attachments, labels, templates, activities, notifications.
- src/common/: guards, decorators (@CurrentMember, @RequirePermission), filters, interceptors, pagination.
- Auth: JWT access token ngắn hạn + refresh token, lưu httpOnly cookie; bcrypt cho mật khẩu.
- Phân quyền: PolicyService tập trung với can(actor, action, resource), action enum lấy từ packages/shared.
  Mọi query đi qua lớp lọc theo workspaceId + quyền (scoped repository); không gọi Model.find() thẳng trong service nghiệp vụ.
- Activity log: @nestjs/event-emitter. Thay đổi task phát event → ActivityService ghi log → NotificationService tạo thông báo.
- Task actions là endpoint riêng:
  POST /tasks/:id/accept, /decline, /submit, /review (nội bộ), /client-review, /move.
  /move kiểm tra quyền theo statusType cột đích (staff không vào client_review/scheduled/done → TASK_COLUMN_LOCKED).
- position: fractional indexing (thư viện fractional-indexing).
- Upload: API cấp presigned URL lên R2, client upload trực tiếp, rồi gọi API xác nhận (tạo attachment, version tự tăng).
- Cron (@nestjs/schedule): nhắc sắp đến hạn, quá hạn, task chưa tiếp nhận sau 24h.
- Validation: class-validator DTO. Swagger bật ở /docs để Frontend sinh type.
- Lỗi trả mã ERROR_CODE tiếng Anh (VD: TASK_COLUMN_LOCKED); mã lỗi khai báo trong packages/shared; Frontend tự dịch.
- Index MongoDB cho truy vấn chính: task theo projectId+listId+position, theo ownerId+statusType, theo dueDate.
- Seed script: 1 workspace, 1 admin, 2 leader, 4 nhân viên, 2 khách hàng, dự án mẫu, task mẫu.
- Có .env.example và docker-compose cho MongoDB local.

## Cách làm việc
- Mỗi bước: mục đích → file cần tạo/sửa → code → cách chạy thử (lệnh + curl/Swagger).
- Unit test bắt buộc cho PolicyService và luồng chuyển trạng thái task.
- Khi thêm/sửa endpoint: cập nhật docs/api-contract.md (endpoint, request, response, mã lỗi).
- Khi đụng enum/type dùng chung: sửa packages/shared, ghi docs/DECISIONS.md.
