# Sitemap khu vực nội bộ

Phạm vi tài liệu này là `/app`. Portal khách hàng `/portal` để giai đoạn sau, không xuất hiện trong điều hướng MVP. Giao diện dùng chung cho Admin, Leader và Nhân viên; mục và hành động được ẩn/hiện theo quyền thực tế.

## Điều hướng chính

```text
/app
├── /my-tasks                 Việc của tôi
├── /projects                 Dự án
│   └── /projects/:projectId
│       ├── /board            Bảng Kanban (mặc định)
│       ├── /tasks/:taskId    Chi tiết task (drawer/modal hoặc route sâu)
│       └── /members          Thành viên dự án (Admin/Leader)
├── /clients                  Khách hàng (Admin; Leader thấy khách thuộc dự án mình)
├── /team                     Nhân sự (mọi Admin trong workspace)
├── /workload                 Khối lượng công việc (Admin/Leader)
├── /notifications            Thông báo
└── /settings                 Cài đặt workspace (Admin)
```

Trang mặc định sau đăng nhập là **Việc của tôi** cho mọi vai trò. Admin và Leader có thêm lối tắt tới vùng quản lý phù hợp, không thay trang mặc định thành dashboard nhiều số liệu.

## Theo vai trò

| Khu vực | Admin | Leader dự án | Nhân viên |
|---|---|---|---|
| Việc của tôi | Xem việc được giao | Xem việc được giao | Màn hình ưu tiên; nhận/báo bận, checklist, nộp duyệt |
| Dự án | Xem/quản lý toàn workspace | Xem dự án mình phụ trách | Xem các dự án nội bộ ở chế độ chỉ đọc |
| Kanban | Mọi task; quản lý task/cột | Task trong dự án mình; tạo/giao/duyệt | Xem mọi task; chỉ kéo task của mình theo workflow |
| Khách hàng | Quản lý toàn workspace | Xem khách gắn với dự án mình | Không có mục riêng ở MVP |
| Nhân sự | Tab luôn hiển thị; tạo/cập nhật thành viên workspace | Không hiển thị | Không hiển thị |
| Workload | Toàn workspace | Dự án mình phụ trách | Không có mục báo cáo; vẫn thấy task cá nhân |
| Thông báo | Thông báo liên quan | Thông báo liên quan | Thông báo liên quan |
| Cài đặt | Quản lý workspace/module | Không có | Không có |

Vai trò Leader gắn theo từng dự án, không phải một role workspace riêng. Nếu cùng một nhân sự là Leader ở dự án A và Member ở dự án B, UI chỉ hiện hành động quản lý trong dự án A; dự án B tuân theo quyền Member.

## Điều hướng desktop

- Sidebar trái: logo/workspace switcher (để dành cho đa workspace), “Việc của tôi”, “Dự án”; nhóm quản trị gồm “Khách hàng”, “Nhân sự”, “Workload”, “Cài đặt” chỉ hiện khi có quyền.
- “Nhân sự” luôn hiện với mọi tài khoản có workspace role `admin`, không phụ thuộc việc admin đó có tham gia dự án nào. Leader dự án và Nhân viên không thấy tab này; truy cập URL trực tiếp vẫn phải bị backend từ chối nếu không có quyền.
- Thanh trên: tiêu đề/breadcrumb theo ngữ cảnh, tìm kiếm (có thể để trạng thái chưa khả dụng trong MVP), thông báo, menu hồ sơ.
- Trong dự án: tab “Bảng” là mặc định; “Thành viên” chỉ hiện với Admin/Leader. Không đặt mọi project thành một mục con cố định trên sidebar; dùng trang danh sách và project switcher để mở rộng tốt khi số dự án tăng.
- Task detail mở dạng drawer để giữ ngữ cảnh Kanban; URL sâu `/projects/:projectId/tasks/:taskId` cho phép tải lại/chia sẻ liên kết nội bộ.

## Điều hướng mobile

- Thanh điều hướng đáy tối đa 4 mục: **Việc của tôi**, **Dự án**, **Thông báo**, **Thêm**.
- “Thêm” mở danh sách các mục theo quyền: Khách hàng, Nhân sự, Workload, Cài đặt. Không đưa mục bị cấm vào menu.
- Trong “Thêm”, mọi Admin đều thấy mục “Nhân sự”; Leader và Nhân viên không thấy mục này.
- Trong dự án, dùng header có nút quay lại, tên dự án và lựa chọn chế độ xem; board hiển thị một cột mỗi lần, vuốt ngang đổi cột.
- Task detail mở toàn màn hình; nút hành động chính đặt gần đáy và nằm trong vùng dễ chạm.
- Menu project chỉ liệt kê dự án mà user có thể xem. Không dùng menu điều hướng để ngầm cấp quyền thao tác.

## Quy tắc route và quyền

- Route không có quyền truy cập hiển thị trang “Bạn không có quyền xem mục này” và nút quay lại; không render dữ liệu trước rồi mới ẩn.
- Hành động không được phép thì không hiển thị. Nếu quyền thay đổi khi đang mở màn hình, chặn thao tác và tải lại quyền/dữ liệu.
- Nhân viên luôn có thể mở task/project để xem trong phạm vi nội bộ; chỉ các thao tác trên task của mình được hiện theo workflow.
- `/portal` là ứng dụng/khu vực riêng ở giai đoạn sau, dùng chung backend nhưng không trộn menu với `/app`.
