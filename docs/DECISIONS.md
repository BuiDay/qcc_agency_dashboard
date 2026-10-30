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
