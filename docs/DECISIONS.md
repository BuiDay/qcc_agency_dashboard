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
| 2026-10-19 | Mọi id người trong dự án/task là memberId (không phải userId) | Quyền theo từng workspace; khách hàng sau này cũng là member |
| 2026-10-19 | Nhân viên cũng không được kéo task ĐANG nằm trong cột khoá ra ngoài | Tránh huỷ kết quả duyệt của leader/khách |
| 2026-10-19 | Nhân viên kéo vào "Duyệt nội bộ" = nộp duyệt (phải đã tiếp nhận) | Kéo thả và nút bấm cho cùng kết quả |
| 2026-10-19 | Tiếp nhận task ở Brief → tự chuyển sang "Lên ý tưởng"; ở cột khác thì giữ nguyên | Leader có thể tạo task thẳng vào Sản xuất. Đổi được trong task-workflow.ts |
| 2026-10-19 | Báo bận cần lý do ≥ 5 ký tự; trả về sửa bắt buộc có góp ý | Leader/nhân viên luôn biết lý do |
| 2026-10-19 | Tự viết fractional indexing (common/position.ts) thay vì thư viện fractional-indexing | Thư viện chỉ có bản ESM, lỗi với Jest/CommonJS và Node 20 |
| 2026-10-19 | MVP: admin tạo tài khoản kèm mật khẩu ban đầu; mời qua email làm sau | Chưa cần dịch vụ gửi mail |
| 2026-10-19 | Đọc role từ DB ở mỗi request (không tin role trong token) | Khoá tài khoản / đổi quyền có hiệu lực ngay |
