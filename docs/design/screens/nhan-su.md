# Màn hình Nhân sự

## Mục đích & người dùng

Giúp Admin quản lý tài khoản và membership trong workspace: xem danh sách, tạo tài khoản, đổi vai trò workspace và tạm ngưng/kích hoạt tài khoản. Màn hình dùng cho mọi tài khoản có workspace role `admin`; không phụ thuộc Admin có tham gia dự án hay không.

Leader dự án và Nhân viên không được thấy tab “Nhân sự”. Nếu mở URL trực tiếp, ứng dụng hiển thị trạng thái không có quyền và backend vẫn là nơi kiểm tra quyền cuối cùng.

## Bố cục

### Desktop

- Dùng app shell nội bộ; mục “Nhân sự” nằm trong nhóm quản trị ở sidebar.
- Header gồm tiêu đề “Nhân sự”, mô tả “Quản lý tài khoản trong workspace” và nút chính “Thêm nhân sự”.
- Bên dưới là ô tìm kiếm theo tên/email, bộ lọc vai trò và trạng thái, sau đó là bảng thành viên.
- Tạo mới và chỉnh sửa mở dialog; thao tác xác nhận tạm ngưng/kích hoạt yêu cầu xác nhận rõ tài khoản mục tiêu.

```text
┌───────────────────┬─────────────────────────────────────────────────────┐
│ QCC AGENCY        │ Nhân sự                           [Thêm nhân sự]   │
│                   │ Quản lý tài khoản trong workspace                  │
│ Việc của tôi      │                                                     │
│ Dự án             │ [Tìm theo tên hoặc email...] [Vai trò ▾] [Trạng thái ▾]│
│                   │                                                     │
│ QUẢN TRỊ          │ Tên                 Email          Vai trò  Trạng thái│
│   Nhân sự         │ ─────────────────────────────────────────────────── │
│   Khách hàng      │ An Nguyễn           an@qcc.vn      Admin    Đang hoạt động│
│   Workload        │ Bình Trần            binh@qcc.vn    Nhân viên Đang hoạt động│
│   Cài đặt         │ Chi Lê               chi@qcc.vn     Nhân viên Tạm ngưng│
│                   │                                      [•••]          │
└───────────────────┴─────────────────────────────────────────────────────┘
```

### Mobile

- Mục “Nhân sự” nằm trong “Thêm” của thanh điều hướng đáy, chỉ với Admin.
- Danh sách chuyển thành card một cột; tên và trạng thái nổi bật, email và vai trò ở dòng phụ.
- Tìm kiếm nằm ngay dưới header; bộ lọc mở bottom sheet.
- Nút “Thêm nhân sự” là CTA dễ chạm; form mở toàn màn hình hoặc drawer.

```text
┌─────────────────────────────┐
│ ‹ Quản trị        [+ Thêm]  │
│ Nhân sự                     │
│ Quản lý tài khoản workspace │
│ [Tìm tên hoặc email...]     │
│ [Vai trò] [Trạng thái]      │
│                             │
│ An Nguyễn           [•••]   │
│ an@qcc.vn · Admin           │
│ Đang hoạt động              │
│ ─────────────────────────── │
│ Bình Trần           [•••]   │
│ binh@qcc.vn · Nhân viên     │
│ Đang hoạt động              │
│                             │
│ Việc của tôi  Dự án  🔔 Thêm│
└─────────────────────────────┘
```

## Thành phần & dữ liệu hiển thị

- Danh sách chỉ chứa thành viên của workspace hiện tại; không tìm kiếm xuyên workspace.
- Mỗi dòng/card hiển thị tên, email, vai trò workspace (`Admin`, `Nhân viên`, `Khách hàng` nếu đã bật luồng portal), trạng thái (`Đang hoạt động`/`Tạm ngưng`) và menu thao tác.
- Bộ lọc vai trò và trạng thái; tìm kiếm tên/email không phân biệt hoa thường.
- Không hiển thị mật khẩu hay thông tin đăng nhập sau khi tạo.
- Vai trò dự án Leader/Member không được sửa ở đây; Admin gán Leader và thành viên trong phần dự án.
- Tài khoản không bị xóa cứng tại màn hình này. Tạm ngưng tài khoản là thao tác có thể khôi phục.
- Tạo tài khoản MVP gồm họ tên, email, vai trò và mật khẩu khởi tạo tối thiểu 12 ký tự. Vai trò `Khách hàng` chỉ khả dụng khi workspace bật portal; nếu module chưa bật thì không cho chọn.

## Thao tác chính và kết quả

1. **Tìm kiếm/lọc:** danh sách cập nhật theo tên/email, vai trò hoặc trạng thái; giữ nguyên workspace scope.
2. **Thêm nhân sự:** mở form gồm tên, email, vai trò workspace và mật khẩu khởi tạo. Validate email hợp lệ và mật khẩu tối thiểu 12 ký tự; email trùng báo lỗi tại trường email. Thành công đóng form, cập nhật danh sách và báo “Đã tạo tài khoản”.
3. **Chỉnh vai trò:** chọn vai trò mới, xác nhận thay đổi; thành công cập nhật badge và báo “Đã cập nhật vai trò”.
4. **Tạm ngưng:** mở xác nhận nêu rõ tên/email tài khoản; xác nhận sẽ ngăn tài khoản đăng nhập, nhưng không xóa dữ liệu hoặc lịch sử.
5. **Kích hoạt lại:** có xác nhận ngắn; thành công đổi trạng thái thành “Đang hoạt động”.
6. **Quyền truy cập:** mục sidebar chỉ hiển thị cho workspace role `admin`; mọi thao tác vẫn được backend kiểm tra. Không dùng vai trò Leader của dự án để mở quyền quản trị nhân sự.

## Trạng thái

- **Đang tải:** skeleton dòng/card, giữ nguyên header và bộ lọc.
- **Có dữ liệu:** bảng desktop hoặc card mobile, có nhãn vai trò/trạng thái bằng chữ.
- **Trống:** “Workspace chưa có nhân sự nào.”; nếu danh sách đang rỗng sau tìm kiếm, “Không tìm thấy nhân sự phù hợp.” và nút “Xóa bộ lọc”.
- **Lỗi tải:** “Chưa tải được danh sách nhân sự.” kèm nút “Thử lại”; không hiển thị dữ liệu cũ như dữ liệu mới.
- **Không có quyền:** “Bạn không có quyền quản lý nhân sự trong workspace này.” và nút quay lại “Việc của tôi”.
- **Tạo thất bại:** lỗi email trùng, dữ liệu chưa hợp lệ hoặc lỗi hệ thống hiển thị gần form; giữ lại các trường không nhạy cảm, xóa mật khẩu khỏi form.
- **Đang gửi:** khóa nút submit để tránh tạo trùng; hiển thị “Đang tạo...” hoặc “Đang lưu...”.

## Microcopy

- Tiêu đề: “Nhân sự”
- Mô tả: “Quản lý tài khoản trong workspace.”
- CTA: “Thêm nhân sự”
- Trường: “Họ và tên”, “Email”, “Vai trò”, “Mật khẩu khởi tạo” (ít nhất 12 ký tự)
- Trạng thái: “Đang hoạt động”, “Tạm ngưng”
- Hành động: “Đổi vai trò”, “Tạm ngưng tài khoản”, “Kích hoạt lại”
- Xác nhận tạm ngưng: “Tài khoản này sẽ không thể đăng nhập. Dữ liệu và lịch sử vẫn được giữ lại.”
- Thành công: “Đã tạo tài khoản”, “Đã cập nhật vai trò”, “Đã tạm ngưng tài khoản”, “Đã kích hoạt lại tài khoản”
