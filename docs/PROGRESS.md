# Tiến độ

## Đã xong
- Phạm vi MVP 1a / 1b và các giai đoạn mở rộng
- Công nghệ: monorepo pnpm, NestJS + MongoDB, Next.js
- Thiết kế dữ liệu, ma trận quyền, vòng đời task (xem CLAUDE.md, docs/flow.html)
- Khung repo + CLAUDE.md cho backend, frontend, UI/UX
- **Backend nền móng** (nhánh `feat/backend-foundation`):
  - packages/shared: role, statusType, action, mã lỗi, cột mặc định, cột khoá
  - Auth: đăng nhập, refresh token, cookie httpOnly + Bearer, guard toàn cục
  - Workspace (cài đặt, bật/tắt module), Member (tạo, đổi role/chuyên môn, khoá)
  - Khách hàng: CRUD + lưu trữ
  - Dự án: tạo (tự sinh 8 cột), gán leader, thành viên, đổi tên cột, lưu trữ
  - Task: tạo, sửa, giao việc, tiếp nhận/báo bận, nộp duyệt, duyệt nội bộ, ghi nhận khách duyệt,
    kéo thả (fractional indexing), checklist, lưu trữ, "Việc của tôi"
  - Phân quyền tập trung (permissions/policy.ts), activity log cho mọi thay đổi
  - Seed dữ liệu mẫu, Swagger /docs, docs/api-contract.md
  - Test: 30 unit test + 54 kịch bản end-to-end (đều đạt)

## Đang làm
- (chưa có)

## Tiếp theo
1. Backend MVP 1a còn lại: bình luận (comments, visibility internal/client), trang workload (đếm task theo người)
2. UI/UX: design-system.md + sitemap.md
3. Frontend: khởi tạo apps/web, đăng nhập, layout, "Việc của tôi", bảng Kanban
4. MVP 1b: thông báo (lắng nghe event activity.created), file đính kèm (R2), @mention, nhãn, template, cron nhắc hạn
