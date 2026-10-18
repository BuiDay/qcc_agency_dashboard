# Frontend (apps/web) – Next.js App Router + TypeScript

Bối cảnh chung xem CLAUDE.md ở gốc repo. File này là quy tắc riêng cho frontend.

## Stack
- Tailwind + shadcn/ui; TanStack Query cho dữ liệu server; react-hook-form + zod cho form;
  dnd-kit cho kéo thả (hỗ trợ cảm ứng); date-fns locale vi.
- Gọi API NestJS qua 1 api client chung; type sinh từ Swagger bằng openapi-typescript;
  enum/type dùng chung import từ packages/shared.
- Auth bằng httpOnly cookie từ backend; middleware Next chặn route theo đăng nhập và vai trò.

## Cấu trúc
- app/(auth)/login, app/(app)/... cho khu nội bộ; chừa sẵn app/(portal)/... cho khách (chưa làm).
- src/features/<domain>/ (tasks, board, projects, clients, members...) chứa components, hooks, api.
- src/lib/permissions.ts: can() phía client chỉ để ẩn/hiện nút (backend mới là nơi chặn thật).
- src/lib/errors.ts: map ERROR_CODE từ backend → câu tiếng Việt dễ hiểu.

## UX bắt buộc
- Bám đặc tả trong docs/design/. Nếu màn hình chưa có đặc tả: đề xuất bố cục hợp lý và ghi chú để duyệt lại.
- Kéo thả optimistic update; backend từ chối (VD: TASK_COLUMN_LOCKED) → thẻ quay về chỗ cũ + toast tiếng Việt.
- Mobile: Kanban 1 cột/lần, vuốt ngang; chi tiết task mở toàn màn hình; có menu "Chuyển sang..." thay kéo thả.
- Nút hành động hiện theo vai trò và trạng thái task (Tiếp nhận / Báo bận / Nộp duyệt / Duyệt / Trả về).
- Mọi màn hình có trạng thái loading (skeleton), trống, lỗi.
- Tạm dùng refetch định kỳ 15–30s cho Kanban thay realtime.

## Cách làm việc
- Mỗi bước: mục đích → file cần tạo/sửa → code → cách chạy thử.
- API cần mà chưa có: ghi vào docs/api-contract.md mục "CẦN BACKEND" (endpoint + request/response mong muốn);
  trong lúc chờ dùng mock (MSW) cùng shape.
