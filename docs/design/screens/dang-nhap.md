# Màn hình Đăng nhập

## Mục đích & người dùng

Cho Admin, Leader và Nhân viên truy cập khu vực nội bộ `/app`. Màn hình tập trung vào một việc: đăng nhập nhanh, dễ hiểu trên điện thoại và không để lộ mật khẩu.

## Bố cục

### Desktop

- Khung nội dung rộng tối đa 1040px, căn giữa theo cả hai chiều.
- Bên trái là mảng nhận diện xanh dương/đen với logo chữ, câu giới thiệu ngắn và họa tiết hình học xanh lá; bên phải là form trên nền trắng.
- Form rộng khoảng 400px. Không có sidebar hay điều hướng ứng dụng trước khi đăng nhập.

```text
┌──────────────────────────────────────────────────────────────┐
│  ┌────────────────────────┐   ┌───────────────────────────┐ │
│  │ QCC AGENCY             │   │ Chào bạn                  │ │
│  │                        │   │ Đăng nhập để tiếp tục     │ │
│  │ Cùng nhau làm việc     │   │                           │ │
│  │ rõ ràng, đúng hạn.     │   │ Email                     │ │
│  │              ◢ lime   │   │ [_______________________] │ │
│  │                        │   │ Mật khẩu                  │ │
│  │                        │   │ [____________________ 👁] │ │
│  │                        │   │ [       Đăng nhập       ] │ │
│  └────────────────────────┘   └───────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Mobile

- Một cột, nền trắng; logo và lời chào đặt đầu trang, form chiếm chiều rộng khả dụng với lề 20–24px.
- Không dùng hình trang trí lớn làm đẩy form xuống dưới màn hình.
- Bàn phím email dùng kiểu email; bàn phím mật khẩu dùng kiểu password. Nút đăng nhập rộng hết form.

```text
┌─────────────────────────────┐
│ QCC AGENCY                  │
│                             │
│ Chào bạn                    │
│ Đăng nhập để xem công việc  │
│                             │
│ Email                       │
│ [_________________________] │
│ Mật khẩu                    │
│ [_____________________ 👁]  │
│                             │
│ [       Đăng nhập         ] │
└─────────────────────────────┘
```

## Thành phần & dữ liệu hiển thị

- Wordmark “QCC AGENCY” dạng chữ; chưa phụ thuộc asset logo để frontend có thể dựng MVP.
- Tiêu đề “Chào bạn” và mô tả một câu.
- Trường “Email”: bắt buộc, input email, trim khoảng trắng đầu/cuối trước khi gửi.
- Trường “Mật khẩu”: bắt buộc, mặc định che ký tự; nút hiện/ẩn có nhãn hỗ trợ đọc màn hình.
- Nút chính “Đăng nhập”, màu xanh dương `--blue`, chữ trắng; vùng bấm tối thiểu 44px.
- Không hiển thị trường chọn vai trò: tài khoản và quyền được xác định sau khi đăng nhập.
- Không hiển thị “Quên mật khẩu” cho đến khi có luồng đặt lại mật khẩu thực sự.

## Thao tác chính và kết quả

1. Người dùng nhập email và mật khẩu rồi bấm “Đăng nhập” hoặc Enter.
2. Kiểm tra email hợp lệ và mật khẩu không rỗng ở client; lỗi được hiển thị cạnh trường tương ứng.
3. Trong khi gửi, nút chuyển thành trạng thái loading và bị khóa để tránh gửi lặp.
4. Thành công: chuyển tới `/app/my-tasks`; nếu sau này hỗ trợ deep link nội bộ thì quay lại đúng route được yêu cầu sau khi đăng nhập.
5. Sai thông tin hoặc tài khoản không hoạt động: hiển thị cùng một thông báo chung, không tiết lộ email có tồn tại hay không.
6. Giữ nguyên email sau lỗi; không giữ mật khẩu trong form sau khi request thất bại.

## Trạng thái

- **Mặc định:** hai trường trống; focus ban đầu ở Email.
- **Đang tải:** spinner trong nút, nút disabled, không xóa dữ liệu đang nhập.
- **Validation:** “Vui lòng nhập email hợp lệ.” / “Vui lòng nhập mật khẩu.”
- **Đăng nhập thất bại:** alert ngay phía trên form, nội dung “Email hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại.”
- **Mất kết nối/lỗi server:** “Chưa thể kết nối. Vui lòng thử lại sau.” Có nút thử lại bằng hành động gửi lại form.
- **Không có quyền:** không áp dụng cho trang login; lỗi quyền sau đăng nhập được xử lý ở route đích.

## Microcopy

- Nút: “Đăng nhập”
- Lời giới thiệu: “Đăng nhập để xem công việc của bạn.”
- Lỗi thông tin: “Email hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại.”
- Lỗi kết nối: “Chưa thể kết nối. Vui lòng thử lại sau.”
- Nút hiện mật khẩu: “Hiện mật khẩu”; khi mở: “Ẩn mật khẩu”
