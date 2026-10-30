# Màn hình Việc của tôi

## Mục đích & người dùng

Màn hình mặc định sau đăng nhập cho Admin, Leader và Nhân viên. Trả lời ngay ba câu hỏi: việc nào cần làm trước, task nào sắp/quá hạn, và có task nào đang chờ tôi tiếp nhận hoặc xử lý không.

Nội dung chính là task được giao cho người đang đăng nhập. Admin/Leader vẫn dùng màn hình này để theo dõi task của chính mình; việc quản lý toàn nhóm nằm ở Workload và trang dự án.

## Bố cục

### Desktop

- Dùng app shell theo sitemap: sidebar trái, thanh tiêu đề trên, nội dung chính một cột rộng tối đa khoảng 1120px.
- Tiêu đề “Việc của tôi”, ngày hiện tại và mô tả ngắn; không biến đầu trang thành dashboard số liệu.
- Dưới tiêu đề là các bộ lọc nhanh; sau đó nhóm task ưu tiên theo hạn.
- Task mở trong drawer để xem chi tiết mà không mất vị trí trong danh sách.

```text
┌───────────────┬──────────────────────────────────────────────┐
│ QCC AGENCY    │ Việc của tôi                    🔔   Hồ sơ  │
│               │ Thứ Hai, 30 tháng 10                       │
│ ▸ Việc của tôi│ [Tất cả] [Cần làm] [Chờ tiếp nhận] [Hoàn tất]│
│   Dự án       │                                              │
│   Thông báo   │ QUÁ HẠN · 1                                  │
│   Thêm        │ ┌──────────────────────────────────────────┐ │
│               │ │ Bài social tuần 3    [Quá hạn] [Sản xuất]│ │
│               │ │ Dự án A · Hạn hôm qua · Leader: Linh     │ │
│               │ └──────────────────────────────────────────┘ │
│               │ HÔM NAY · 2                                  │
│               │ ┌──────────────────────────────────────────┐ │
│               │ │ Video review sản phẩm [Chờ tiếp nhận]    │ │
│               │ │ Dự án B · Hạn hôm nay                    │ │
│               │ │ [Tiếp nhận] [Báo bận]                    │ │
│               │ └──────────────────────────────────────────┘ │
└───────────────┴──────────────────────────────────────────────┘
```

### Mobile

- Thanh điều hướng đáy theo sitemap; nội dung cuộn một cột.
- Header gọn: “Việc của tôi”, avatar/menu và nút thông báo.
- Bộ lọc nhanh cuộn ngang; lựa chọn đang bật dùng nền tím, chữ trắng.
- Task hiển thị dạng card toàn chiều rộng; nhóm quá hạn được đặt đầu danh sách.
- Nút hành động chính trong card đủ lớn, không yêu cầu mở menu dấu ba chấm.
- Từ card mở task detail toàn màn hình; sau khi đóng quay lại đúng vị trí cuộn.

```text
┌─────────────────────────────┐
│ Việc của tôi           🔔   │
│ Hôm nay, 30/10              │
│ [Tất cả][Cần làm][Chờ nhận] │
│                             │
│ QUÁ HẠN · 1                 │
│ ┌─────────────────────────┐ │
│ │ Bài social tuần 3       │ │
│ │ [Quá hạn] [Sản xuất]    │ │
│ │ Dự án A · Hạn hôm qua   │ │
│ │ Mở chi tiết →           │ │
│ └─────────────────────────┘ │
│                             │
│ HÔM NAY · 1                 │
│ ┌─────────────────────────┐ │
│ │ Video review sản phẩm   │ │
│ │ [Chờ tiếp nhận]         │ │
│ │ Dự án B · Hạn hôm nay   │ │
│ │ [Tiếp nhận] [Báo bận]   │ │
│ └─────────────────────────┘ │
│                             │
│ Việc của tôi  Dự án  🔔  Thêm│
└─────────────────────────────┘
```

## Thành phần & dữ liệu hiển thị

### Header và bộ lọc

- Tiêu đề và ngày hiện tại theo locale `vi-VN`.
- Bộ lọc: “Tất cả”, “Cần làm”, “Chờ tiếp nhận”, “Đã hoàn thành”.
- Có thể mở rộng bằng bộ lọc dự án; trên mobile đặt trong bottom sheet “Lọc task”.
- Hiển thị số lượng trong từng bộ lọc khi có dữ liệu; không hiện số 0 gây nhiễu.
- Bộ lọc chỉ thay đổi danh sách, không làm mất trạng thái workflow của task.

### Nhóm task

Sắp xếp thành các nhóm theo mức độ ưu tiên:

1. **Quá hạn** — dueDate trước ngày hiện tại, task chưa hoàn thành.
2. **Hôm nay** — dueDate trong ngày hiện tại.
3. **Sắp tới** — dueDate tương lai, gần nhất trước.
4. **Chưa có hạn** — task chưa hoàn thành, không có dueDate.
5. **Đã hoàn thành** — chỉ hiện khi bộ lọc “Đã hoàn thành” hoặc người dùng yêu cầu.

Task không có dueDate không được tự gán vào “Hôm nay”. Task thuộc nhiều tiêu chí chỉ xuất hiện một lần ở nhóm ưu tiên cao nhất.

### Task card

- Tiêu đề task tối đa hai dòng; bấm card mở chi tiết.
- Tên dự án; trạng thái task theo `statusType`; ngày hạn hoặc “Chưa đặt hạn”.
- Badge luôn nhìn thấy khi áp dụng: “Quá hạn”, “Chờ khách X ngày”, “Chờ tiếp nhận”.
- Avatar/tên người giao hoặc Leader để nhân viên biết cần liên hệ ai.
- Acceptance `pending`: hiện “Chờ tiếp nhận” và hai nút “Tiếp nhận”, “Báo bận”.
- Acceptance `accepted`: không lặp lại nút tiếp nhận; mở chi tiết để làm checklist/nộp duyệt.
- Task bị từ chối tiếp nhận: hiện nhãn “Đã báo bận” và lý do ngắn nếu có.
- Với Admin/Leader, task được giao cho mình vẫn hiển thị như các task khác; nút quản lý task chỉ xuất hiện nếu có quyền thực tế ở dự án.

### Hành động và quyền

- **Nhân viên:** chỉ thấy “Tiếp nhận”/“Báo bận” khi task của mình đang pending; mở chi tiết để tick checklist, tải file, nộp duyệt và bình luận theo quyền.
- **Leader:** trên task thuộc dự án mình phụ trách, có thể mở chi tiết để quản lý/duyệt; không đặt nút tạo task chung trên trang này.
- **Admin:** có thể mở task và thao tác theo quyền Admin; quản lý nhiều người xem tại Workload.
- Không có nút kéo task trong danh sách này; chuyển trạng thái phức tạp qua Kanban hoặc menu trong task detail theo đúng quyền.
- “Báo bận” mở dialog/drawer yêu cầu lý do, textarea có nhãn; xác nhận mới gửi.

## Thao tác chính và kết quả

1. Vào màn hình → mặc định chọn “Cần làm”, hiển thị tất cả task chưa hoàn thành được giao cho actor theo thứ tự ưu tiên.
2. Chọn “Tiếp nhận” → cập nhật trạng thái nhận việc, phản hồi “Đã tiếp nhận task”; task vẫn ở nhóm hạn tương ứng.
3. Chọn “Báo bận” → nhập lý do → xác nhận; phản hồi “Đã báo bận. Leader sẽ sắp xếp lại công việc.” và hiển thị nhãn trên card.
4. Mở task → hiển thị chi tiết ở drawer desktop/toàn màn hình mobile; khi quay lại giữ nguyên filter và vị trí danh sách.
5. Chọn bộ lọc → cập nhật danh sách và số lượng; giữ bộ lọc trong phiên điều hướng hiện tại.
6. Chọn tên dự án → mở board dự án nếu người dùng có quyền xem.

## Trạng thái

- **Đang tải:** giữ header/bộ lọc; dùng skeleton card có chiều cao gần với nội dung thật, không nhấp nháy toàn trang.
- **Không có việc cần làm:** “Bạn đã xử lý hết việc cần làm. Tuyệt vời!” kèm lối tắt “Xem dự án”.
- **Chưa có task nào được giao:** “Chưa có task nào được giao cho bạn.” Không gợi ý nhân viên tự tạo task; Leader/Admin có thể được gợi ý xem dự án hoặc workload.
- **Bộ lọc trống:** “Không có task trong mục này.” Có nút “Xóa bộ lọc” khi đang áp dụng filter bổ sung.
- **Lỗi tải dữ liệu:** giữ layout, hiện thông báo và nút “Thử tải lại”; không hiển thị trạng thái rỗng giả.
- **Không có quyền thao tác:** ẩn nút không được phép; nếu quyền vừa bị thu hồi khi gửi thao tác, báo “Bạn không còn quyền thực hiện thao tác này. Vui lòng tải lại.”
- **Task bị xóa/lưu trữ khi đang mở:** đóng detail và báo “Task này không còn khả dụng.”

## Microcopy

- Mô tả: “Đây là những việc bạn cần xử lý.”
- Bộ lọc: “Tất cả”, “Cần làm”, “Chờ tiếp nhận”, “Đã hoàn thành”
- Hạn: “Hạn hôm nay”, “Quá hạn 2 ngày”, “Chưa đặt hạn”
- Badge chờ khách: “Chờ khách 3 ngày”
- Nút: “Tiếp nhận”, “Báo bận”, “Mở chi tiết”
- Hỏi lý do báo bận: “Bạn bận việc gì? Leader sẽ dựa vào đây để sắp xếp lại.”
- Xác nhận báo bận: “Gửi báo bận”
- Thành công: “Đã tiếp nhận task.” / “Đã báo bận. Leader sẽ sắp xếp lại công việc.”
- Lỗi thao tác: “Chưa cập nhật được. Vui lòng thử lại.”
