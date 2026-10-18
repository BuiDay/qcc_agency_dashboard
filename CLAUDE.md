# DỰ ÁN: App quản lý task cho agency marketing

Trả lời bằng tiếng Việt, ngắn gọn, thực tế. Chủ động góp ý khi thấy hướng đi có vấn đề.
Khi thiếu thông tin, hỏi tối đa 3 câu quan trọng nhất trước khi làm.
Luôn nêu tác động của quyết định hiện tại đến các giai đoạn mở rộng sau.
Khi có nhiều lựa chọn kỹ thuật: nêu 2-3 phương án kèm ưu/nhược, đề xuất một.

## Cấu trúc repo
```
apps/api/         Backend NestJS + MongoDB      → quy tắc riêng: apps/api/CLAUDE.md
apps/web/         Frontend Next.js              → quy tắc riêng: apps/web/CLAUDE.md
packages/shared/  Enum + type dùng chung (nguồn sự thật cho role, statusType, action, error code)
docs/design/      Đặc tả UI/UX                  → quy tắc riêng: docs/design/CLAUDE.md
docs/flow.html    Sơ đồ flow đã chốt
docs/DECISIONS.md Nhật ký quyết định (ghi thêm mỗi khi chốt điều gì mới)
docs/PROGRESS.md  Tiến độ: đã xong / đang làm / tiếp theo
```
Khi tôi hỏi "đang ở đâu": đọc docs/PROGRESS.md và tóm tắt. Cuối mỗi phiên làm việc, cập nhật PROGRESS.md.

## Sản phẩm
App kiểu Trello (Kanban kéo thả) thiết kế riêng cho quy trình agency marketing.
Hai khu vực, dùng chung 1 backend + 1 database:
- /app: khu nội bộ (LÀM NGAY) cho Admin, Leader dự án, Nhân viên.
- /portal: cổng khách hàng duyệt bài (LÀM SAU, nhưng dữ liệu phải có sẵn).

## Công nghệ (đã chốt)
- Monorepo pnpm workspaces: apps/api (NestJS), apps/web (Next.js App Router), packages/shared.
- Backend: NestJS + MongoDB (Mongoose), TypeScript. Frontend: Next.js + TypeScript + Tailwind + shadcn/ui.
- File lưu Cloudflare R2 (S3-compatible). Dev làm một mình → ưu tiên đơn giản, chạy được.

## Vai trò
- Cấp workspace: admin | staff | client (client dùng cho giai đoạn sau).
- Cấp dự án: leader | member. Leader gắn theo TỪNG dự án (1 người có thể là leader dự án A, member dự án B).
- Chuyên môn (không phải role): design, video_edit, content, execution... Admin thêm được.

## Luồng phân công
1. Admin tạo khách hàng → tạo dự án (chọn template) → gán Leader cho dự án.
2. Leader phụ trách dự án + khách hàng của dự án đó, thêm nhân viên vào dự án.
3. Leader (hoặc Admin) tạo task, giao việc. Nhân viên KHÔNG tạo task.

## Vòng đời task
Brief → Lên ý tưởng → Sản xuất → Duyệt nội bộ → Khách duyệt → Chỉnh sửa → Lên lịch đăng → Hoàn thành
statusType cố định: brief, ideation, production, internal_review, client_review, revision, scheduled, done
(tên cột đổi được, logic luôn dựa vào statusType).
- Giao task → acceptance = pending. Nhân viên "Tiếp nhận" hoặc "Báo bận + lý do" → Leader được báo, giao lại.
- Nhân viên nộp duyệt kèm file (version v1, v2...) → Leader duyệt nội bộ: đạt → client_review; trả về → revision (revisionCount +1).
- Khách duyệt: MVP do Leader ghi nhận thủ công; sau này khách tự bấm trên portal (cùng API, cùng dữ liệu).
- Ghi reviewHistory: { by, result, note, source: internal|client, at } và statusChangedAt để đo "đã chờ khách X ngày".

## Ma trận quyền
- Admin: toàn quyền, quản lý nhân sự/cài đặt/module, tạo khách hàng & dự án, gán leader, xoá vĩnh viễn.
- Leader (dự án mình): thêm thành viên, sửa cột, tạo/sửa/giao task, duyệt nội bộ, ghi nhận khách duyệt, kéo thả mọi task, lưu trữ task.
- Nhân viên: XEM mọi dự án nội bộ (chỉ xem); với task của mình: tiếp nhận/báo bận, tick checklist, upload file, nộp duyệt, kéo thả; bình luận mọi nơi.
  KHÔNG được thả task vào cột client_review, scheduled, done (backend chặn, frontend trả thẻ về chỗ cũ).
- Client (sau): chỉ thấy task clientVisible=true của khách mình và bình luận visibility=client.

## Dữ liệu (MongoDB)
```
workspaces{name, modules{clientPortal,timeTracking,...}} · users{email,name,avatar,passwordHash}
members{workspaceId,userId,role,skills[],clientIds[]} · skills{workspaceId,name}
clients{workspaceId,name,logo,contactInfo,archived}
projects{workspaceId,clientId,name,serviceType,leaderIds[],memberIds[],archived}
lists{workspaceId,projectId,name,statusType,position}
tasks{workspaceId,clientId,projectId,listId,position,title,description,statusType,ownerId,collaboratorIds[],
  labelIds[],startDate,dueDate,completedAt,checklist[{text,done,assigneeId,dueDate}],
  acceptance{status:pending|accepted|declined,at,reason},approvalStatus,reviewHistory[],
  clientVisible,revisionCount,statusChangedAt,archived}
comments{workspaceId,clientId,taskId,authorId,body,mentions[],visibility:internal|client}
attachments{workspaceId,clientId,taskId,url,name,size,version,uploadedBy}
labels{workspaceId,name,color,kind} · templates{workspaceId,name,serviceType,lists[],labels[],defaultChecklists[]}
activities{workspaceId,clientId,projectId,taskId,actorId,type,data,createdAt}
notifications{workspaceId,userId,type,taskId,activityId,readAt}
```

## Nguyên tắc bắt buộc
- Mọi document có workspaceId (+ clientId nếu liên quan khách) để lọc quyền.
- Phân quyền tập trung một chỗ (can(actor, action, resource)), không rải if/else trong controller.
- Mọi thay đổi task ghi activity log → từ đó sinh thông báo, lịch sử, báo cáo.
- position dùng fractional indexing (kéo thả chỉ cập nhật 1 document).
- Không xoá cứng với staff/leader, chỉ archived.
- Module mở rộng (portal, chấm công, hợp đồng, automation, AI) bật/tắt qua workspace.modules.
- UI tiếng Việt, nhân viên không rành công nghệ dùng được ngay, tốt trên cả máy tính và điện thoại.
- Enum/type dùng chung chỉ định nghĩa trong packages/shared, không khai báo lại ở api hay web.
- Code: hoàn chỉnh, chạy được, chú thích ngắn bằng tiếng Việt.

## Phạm vi
- MVP 1a: auth, workspace, nhân sự, khách hàng, dự án, Kanban kéo thả, chi tiết task, checklist,
  tiếp nhận/báo bận, nộp duyệt/duyệt, bình luận, activity log, "Việc của tôi", trang workload.
- MVP 1b: Lịch, Danh sách, file đính kèm, @mention, thông báo, template.
- Sau: portal khách, duyệt nhiều cấp, chấm công, báo cáo, hợp đồng/gói dịch vụ, task lặp, automation, tích hợp, AI.

## Phối hợp giữa các phần
- UI/UX viết đặc tả vào docs/design/ → Frontend đọc trực tiếp.
- Backend giữ Swagger + docs/api-contract.md → Frontend sinh type từ đó.
- Thay đổi enum/schema/API: sửa packages/shared trước, ghi vào docs/DECISIONS.md, rồi mới sửa api/web.
