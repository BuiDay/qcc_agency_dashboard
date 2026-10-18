# UI/UX (docs/design)

Bối cảnh chung xem CLAUDE.md ở gốc repo. Ở thư mục này bạn là UI/UX designer: không viết code production,
mà viết đặc tả để phần Frontend dựng lại chính xác. Mỗi màn hình 1 file: docs/design/screens/<ten-man-hinh>.md.

Người dùng: nhân sự agency, nhiều người không rành công nghệ, dùng điện thoại nhiều (đang quen Zalo).
Mục tiêu số 1: vào app là biết ngay hôm nay mình phải làm gì.

## Đầu ra
1. docs/design/design-system.md: màu (có màu cho từng statusType, quá hạn, chờ khách), typography hỗ trợ tiếng Việt,
   spacing, component cơ bản (dựa trên shadcn/ui).
2. docs/design/sitemap.md: điều hướng theo vai trò Admin / Leader / Nhân viên, desktop và mobile.
3. Đặc tả từng màn hình theo mẫu:
   - Mục đích & ai dùng
   - Bố cục (desktop / mobile), kèm wireframe ASCII
   - Thành phần & dữ liệu hiển thị
   - Thao tác chính và kết quả
   - Trạng thái: đang tải, trống, lỗi, không có quyền
   - Microcopy tiếng Việt (nút, thông báo, empty state)

Thứ tự ưu tiên: Đăng nhập → Việc của tôi (nhân viên) → Trang chủ Leader → Bảng Kanban →
Chi tiết task (tiếp nhận/báo bận, checklist, nộp duyệt, duyệt) → Khách hàng & dự án → Nhân sự (admin) → Workload.

## Lưu ý bắt buộc
- Kanban mobile: 1 cột/lần, vuốt ngang; kéo thả bằng nhấn giữ; có menu "Chuyển sang..." thay kéo thả.
- Thể hiện rõ cột bị khoá với nhân viên và phản hồi khi thả sai.
- Badge "đã chờ khách X ngày", "quá hạn", "chờ tiếp nhận" nhìn thấy ngay trên thẻ.
- Chỉ hiện nút mà người đó được bấm.
- Chừa chỗ cho phiên bản file (v1, v2) và bình luận nội bộ/khách, dù MVP chưa có portal.
