# Tiến độ

## Đã xong
- Xác định phạm vi MVP 1a / 1b và các giai đoạn mở rộng theo hướng agency marketing.
- Chốt công nghệ monorepo pnpm, NestJS + MongoDB, Next.js, shared package để centralize enum/type.
- Hoàn thiện khung repo + hướng dẫn phụ trách theo từng phần: [CLAUDE.md](../CLAUDE.md), [apps/api/CLAUDE.md](../apps/api/CLAUDE.md), [apps/web/CLAUDE.md](../apps/web/CLAUDE.md), [docs/design/CLAUDE.md](../docs/design/CLAUDE.md).
- Thiết kế dữ liệu, ma trận quyền, vòng đời task, và luồng nghiệp vụ chính trong [docs/flow.html](./flow.html) và kiến thức nền trong [docs/DECISIONS.md](./DECISIONS.md).
- Backend nền đã có: NestJS app, MongoDB connection, auth JWT, users/workspaces/members, policy guard, Swagger, seed admin, test PolicyService, và shared enum/roles/actions.
- Shared package đã có các type/enum dùng chung: role, action, task status, error code.

## Đang làm
- Chuẩn hóa module nghiệp vụ tiếp theo theo MVP 1a: khách hàng, dự án, list/task, acceptance, approval, review history, activity log.
- Định hình policy/permission theo mô hình `can(actor, action, resource)` và ràng buộc workflow task theo role.
- Chuẩn bị base cho frontend khu nội bộ: layout, kanban, task detail, workload và "Việc của tôi".

## Tiếp theo
1. Backend: thêm schema + service cho `clients`, `projects`, `lists`, `tasks`, `comments`, `attachments`, `labels`, `templates`; tích hợp activity log và thông báo.
2. Nghiệp vụ task: acceptance, internal review, client review, revision tracking, `statusChangedAt`, `reviewHistory[]`, `clientVisible`, `archived`.
3. Frontend: khởi tạo app web, layout nội bộ, board Kanban kéo thả, chi tiết task, checklist, upload file, và màn hình workload.
4. MVP 1b: lịch, danh sách, @mention, file đính kèm, thông báo, template.
5. Sau đó: portal khách, workflow duyệt nhiều cấp, báo cáo và module mở rộng như chấm công / hợp đồng / automation.
