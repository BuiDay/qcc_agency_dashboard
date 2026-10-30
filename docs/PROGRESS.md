# Tiến độ

## Đã xong
- Xác định phạm vi MVP 1a / 1b và các giai đoạn mở rộng theo hướng agency marketing.
- Chốt công nghệ monorepo pnpm, NestJS + MongoDB, Next.js, shared package để centralize enum/type.
- Hoàn thiện khung repo + hướng dẫn phụ trách theo từng phần: [CLAUDE.md](../CLAUDE.md), [apps/api/CLAUDE.md](../apps/api/CLAUDE.md), [apps/web/CLAUDE.md](../apps/web/CLAUDE.md), [docs/design/CLAUDE.md](../docs/design/CLAUDE.md).
- Thiết kế dữ liệu, ma trận quyền, vòng đời task, và luồng nghiệp vụ chính trong [docs/flow.html](./flow.html) và kiến thức nền trong [docs/DECISIONS.md](./DECISIONS.md).
- Backend nền đã có: NestJS app, MongoDB connection, auth JWT, users/workspaces/members, policy guard, Swagger, seed admin, test PolicyService, và shared enum/roles/actions.
- Shared package đã có các type/enum dùng chung: role, action, task status, error code.
- Backend task API đã có CRUD/lưu trữ, lọc task theo project/assignee/status/date, workflow acceptance/review/client-review, move dùng fractional indexing và activity log cho mọi thay đổi thành công.
- Đã có unit test cho policy và các nhánh chuyển trạng thái task; API contract và quyết định phân quyền theo project được ghi nhận.
- Backend Projects API đã có tạo/list/detail/update/archive và thêm thành viên dự án; gán Leader/Member bằng userId thuộc workspace.
- Backend có `POST /users` chỉ dành cho Admin, tạo user và membership cùng workspace; luồng `/members` dùng chung logic tạo tài khoản.
- Auth API hỗ trợ access JWT qua cookie hoặc Bearer; login/refresh trả access token để client gửi `Authorization` khi không gửi cookie credentials.
- Sửa Mongoose schema để lệnh seed nạp được model; xác nhận bước seed hiện dừng ở TLS handshake tới MongoDB Atlas, chưa tạo admin.
- Task được kiểm tra project tồn tại, cùng workspace, chưa archive; người được giao/cộng tác viên phải nằm trong project. Quyền Leader được giới hạn theo project thay cho quyền quản lý task workspace-wide.

## Đang làm
- Xây dựng Clients/Lists API và quan hệ project-client nếu nghiệp vụ yêu cầu; hiện Project không phụ thuộc Client.
- Tích hợp activity log với event/notification khi bổ sung các module liên quan.
- Chuẩn bị base cho frontend khu nội bộ: layout, kanban, task detail, workload và "Việc của tôi".

## Tiếp theo
1. Backend: thêm clients/lists và quan hệ client-project khi cần; Projects API hiện có dùng project làm container task.
2. Backend: bổ sung comments, attachments, labels, templates, notifications; gắn activity log vào event flow.
3. Frontend: khởi tạo app web, layout nội bộ, board Kanban kéo thả, chi tiết task, checklist, upload file, và màn hình workload.
4. MVP 1b: lịch, danh sách, @mention, file đính kèm, thông báo, template.
5. Sau đó: portal khách, workflow duyệt nhiều cấp, báo cáo và module mở rộng như chấm công / hợp đồng / automation.
