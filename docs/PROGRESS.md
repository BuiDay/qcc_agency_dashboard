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
- Backend Projects/Tasks API đã có CRUD project/task, thành viên dự án, workflow task, fractional position và activity log; thay đổi đã push trên branch `feat/task-api` (commit `58635b3`).
- Đã sửa Mongoose schema để lệnh seed nạp model; build thành công và 13 unit test đạt. Seed vẫn chưa tạo admin do lỗi TLS handshake tới MongoDB Atlas.
- Task được kiểm tra project tồn tại, cùng workspace, chưa archive; người được giao/cộng tác viên phải nằm trong project. Quyền Leader được giới hạn theo project thay cho quyền quản lý task workspace-wide.
- UI/UX đã có [design system](./design/design-system.md) và [sitemap](./design/sitemap.md) cho desktop/mobile; cặp màu chủ đạo đã chốt là xanh lá `#d2fd4b` + xanh dương `#4f48e3`.
- Đã đặc tả màn hình [Đăng nhập](./design/screens/dang-nhap.md) và [Việc của tôi](./design/screens/viec-cua-toi.md), gồm wireframe desktop/mobile, quyền, trạng thái và microcopy.
- Đã đặc tả trang [Nhân sự](./design/screens/nhan-su.md): mọi Admin đều thấy tab trong điều hướng; Leader/Nhân viên không thấy, quyền truy cập vẫn do backend kiểm tra.
- Đã triển khai frontend `/team`: danh sách nhân sự từ API, tìm kiếm/lọc, tạo user, đổi role, tạm ngưng/kích hoạt; tab chỉ hiện với Admin trên desktop/mobile. Backend dùng `GET/POST /members` và `PATCH /members/:id` hiện có; đã giới hạn đọc danh sách cho Admin, chặn Staff/Leader và ngăn Admin tự hạ quyền/tạm ngưng tài khoản của mình.
- Sidebar và điều hướng mobile dùng component `AppNavigation` trong layout chung nhóm `(app)`; chuyển tab bằng Next.js Link nên shell không bị tải/mount lại. CSS responsive trang Nhân sự hoạt động bình thường trên desktop/mobile.
- Frontend Next.js đã khởi tạo; `/login` gọi API auth thật; refresh cookie khôi phục phiên, access token chỉ giữ trong memory và nhóm route `(app)` được bảo vệ sau khi xác thực.
- Frontend dùng same-origin `/api` rewrite; backend nhận alias cookie cũ `refresh_token`, chuẩn hóa sang `qcc_refresh`, và xóa cookie cũ/không hợp lệ khi refresh bị từ chối. Đã xác định `COOKIE_DOMAIN` local chứa scheme/port gây lỗi Express khi xóa cookie; backend giờ chuẩn hóa hostname và bỏ Domain cho localhost/IP. Người dùng cần đăng nhập lại sau khi API cập nhật để cookie refresh được cấp theo secret hiện tại.
- Auth refresh và JWT strategy tra cứu member theo `_id` rồi xác thực riêng user/workspace/active. JWT strategy ưu tiên Bearer token mới khi request có cả Bearer và cookie access cũ; cookie vẫn là fallback. Khi request refresh không có cookie, backend không gửi lệnh xóa cookie để tránh race với login. Đã thêm unit test cho các luồng.
- Trang “Việc của tôi” đã dựng theo đặc tả bằng mock data: nhóm theo hạn, lọc trạng thái/dự án, chi tiết task, tiếp nhận và báo bận.

## Đang làm
- Frontend: hoàn thiện luồng màn hình Việc của tôi và tiếp tục dựng Trang chủ Leader/Bảng Kanban bằng mock data; auth login, khôi phục phiên và bảo vệ route đã kết nối.
- Các màn hình nghiệp vụ khác vẫn chưa kết nối API; ưu tiên hoàn thiện UI nội bộ trước.

## Tiếp theo
1. Đặc tả Trang chủ Leader và Bảng Kanban; dựng các màn hình bằng mock data.
2. Dựng các màn hình nội bộ theo đặc tả, chưa tích hợp API.
3. Sau khi UX/frontend đã sẵn sàng mới nối API và xử lý backend còn thiếu như Clients/Lists, comments, attachments, notifications, labels và templates.
4. Trước khi mở `/portal`: bổ sung API và permission riêng cho `client`, lọc theo `clientIds` và `clientVisible`, giới hạn comment `visibility=client`; không dùng trực tiếp API task nội bộ cho khách.
5. Sau MVP 1a: lịch, @mention, template; tiếp đó mới làm portal khách và các module mở rộng.
