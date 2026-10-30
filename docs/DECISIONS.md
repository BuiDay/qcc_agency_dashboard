# Nhật ký quyết định

| Ngày | Quyết định | Lý do |
|---|---|---|
| 2026-10-17 | Monorepo pnpm: apps/api (NestJS), apps/web (Next.js), packages/shared | Một người làm, giữ type/enum đồng bộ giữa 2 phía |
| 2026-10-17 | MongoDB + Mongoose | Dev đã quen; phân quyền tự làm ở tầng service |
| 2026-10-17 | Leader gắn theo từng dự án, Admin gán | Một người có thể là leader dự án này, nhân viên dự án khác |
| 2026-10-17 | Chuyên môn (design, edit, content, thực thi) là thuộc tính, không phải role | Thêm chuyên môn không phải sửa phân quyền |
| 2026-10-17 | Nhân viên được kéo thả task của mình, trừ cột client_review / scheduled / done | Không bỏ qua bước duyệt |
| 2026-10-17 | Nhân viên được báo bận + lý do | Leader biết để giao lại |
| 2026-10-17 | Khách duyệt ở MVP do Leader ghi nhận thủ công | Portal làm sau, dùng cùng dữ liệu |
| 2026-10-18 | Backend dùng pnpm workspace, `@qcc/shared` là nguồn enum/type chung; member liên kết user với workspace và role | Giữ một nguồn sự thật để web/api đồng bộ và cho phép cùng user tham gia nhiều workspace về sau |
| 2026-10-18 | Auth dùng access JWT 15 phút và refresh JWT 7 ngày trong httpOnly cookie; refresh token được cấp mới khi refresh nhưng chưa lưu/thu hồi phía server | Giảm lộ token trong trình duyệt, đơn giản cho MVP; thu hồi phiên đa thiết bị cần bổ sung session store ở giai đoạn auth tiếp theo |
| 2026-10-18 | API bước nền triển khai login, refresh, logout, hồ sơ hiện tại, workspace hiện tại, danh sách/tạo/cập nhật member; tạo admin đầu qua seed | Đủ bootstrap hệ thống trước khi thêm phân quyền và các domain nghiệp vụ |
| 2026-10-19 | Project là thực thể độc lập trong workspace, gom các task và lưu leader/member bằng userId; tạo project không phụ thuộc Clients API | Cho phép làm board/task theo dự án ngay; nếu sau này cần khách hàng thì thêm quan hệ project-client riêng, không làm client bắt buộc của task API |
| 2026-10-19 | Quyền task được giới hạn theo project: Admin quản lý toàn workspace; Leader của project quản lý task và thành viên; nhân viên đọc nội bộ, nhưng chỉ thao tác workflow/kéo thả trên task của mình theo giới hạn status | Thay thế quyết định tạm thời workspace-wide cho Staff; mô hình project membership hỗ trợ một user làm Leader ở project này và Member ở project khác |
| 2026-10-30 | `POST /users` tạo user và member cùng lúc trong workspace của Admin; `POST /members` tiếp tục hỗ trợ luồng cũ qua cùng logic | Tránh tạo tài khoản mồ côi chưa thuộc workspace; giữ tương thích API và chuẩn bị cho quản lý nhiều workspace về sau |
| 2026-10-30 | API nhận access JWT qua cookie hoặc Bearer; login/refresh trả access token 15 phút, refresh token vẫn chỉ ở httpOnly cookie | Hỗ trợ client không tự gửi cookie credentials; client trình duyệt nên ưu tiên cookie hoặc giữ Bearer token trong bộ nhớ, không lưu localStorage |
| 2026-10-30 | Xanh lá `#d2fd4b` và xanh dương-xanh tím `#4f48e3` là cặp màu chủ đạo UI; `#6634e2` làm xanh dương đậm, light theme trước | Bám bộ màu đã chốt, nhận diện nhất quán trên desktop/mobile; giữ alias palette cũ và bổ sung dark theme sau để không tăng phạm vi hiện tại |
| 2026-10-30 | Frontend gọi login qua `NEXT_PUBLIC_API_URL`, gửi credentials để nhận httpOnly cookies; access token chỉ giữ trong React memory, không lưu localStorage | Giảm nguy cơ lộ token dài hạn; khôi phục phiên qua refresh cookie sẽ làm cùng bước bảo vệ route sau reload |
| 2026-10-30 | Refresh cookie khôi phục frontend session qua `GET /auth/me`; route nội bộ được guard phía client | Giữ access token trong memory và chặn hiển thị route nội bộ trước khi xác thực; API vẫn là ranh giới bảo mật, session store để thu hồi đa thiết bị sẽ bổ sung sau |
| 2026-10-30 | Frontend gọi backend qua same-origin `/api` rewrite của Next.js thay vì gọi khác origin trực tiếp | Tránh browser bỏ refresh cookie do khác hostname/port/CORS credentials; API URL vẫn cấu hình bằng `NEXT_PUBLIC_API_URL`, token không lưu localStorage |
| 2026-10-30 | Backend chấp nhận tạm cookie refresh cũ `refresh_token` và chuẩn hóa sang `qcc_refresh` sau lần refresh kế tiếp | Tương thích phiên đã đăng nhập từ API cũ; logout xóa cả cookie alias, sau khi người dùng chuyển phiên có thể bỏ tương thích cũ |
| 2026-10-30 | Cookie trên localhost/IP dùng host-only; `COOKIE_DOMAIN` dạng hostname/URL chỉ áp dụng domain hợp lệ sau chuẩn hóa | Tránh Express từ chối Domain chứa scheme/port và tránh cookie domain không cần thiết khi frontend/backend dùng localhost |
| 2026-10-31 | Trang Nhân sự dùng API `/members` hiện có, chỉ Admin được đọc/quản lý danh sách; mọi Admin thấy tab, Leader/Nhân viên không có mục điều hướng này. Admin không thể tự hạ quyền hoặc tự tạm ngưng tài khoản | Tránh tạo endpoint trùng chức năng, khớp quyền API với UI và ngăn tự khóa khỏi workspace |
| 2026-10-31 | Sidebar được mount trong layout chung của nhóm route `(app)`; điều hướng nội bộ dùng Next.js Link để giữ shell khi chuyển tab | Tránh tải lại sidebar giữa các màn hình, giữ trạng thái shell ổn định và tạo nền mở rộng cho các trang nội bộ tiếp theo |
