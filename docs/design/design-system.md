# Design system

## Định hướng

- Giao diện nội bộ ưu tiên rõ việc cần làm, chữ dễ đọc và thao tác ít bước; tối ưu mobile trước nhưng không làm desktop thành giao diện phóng to.
- Phong cách tương phản mạnh, nền trắng, chữ đen; xanh dương và xanh lá là cặp màu thương hiệu chủ đạo.
- Bản MVP dùng light theme. Chỉ bổ sung dark theme khi có nhu cầu thực tế, tránh phải duy trì hai bộ trạng thái màu quá sớm.

## Màu

### Palette thương hiệu

```css
:root {
  --blue: #4f48e3;
  --green: #d2fd4b;
  --deep: #6634e2;
  --purple: var(--blue);
  --lime: var(--green);
  --black: #000000;
  --white: #ffffff;
  --ink: #0a0a0a;
  --grey: #8b8b95;
  --line: rgba(0, 0, 0, 0.16);
  --line-w: rgba(255, 255, 255, 0.22);
}
```

### Vai trò màu giao diện

| Vai trò | Màu | Cách dùng |
|---|---|---|
| Nền trang | `--white` | Nền mặc định, giữ không gian thoáng |
| Chữ chính | `--ink` | Tiêu đề, nội dung, icon |
| Chữ phụ | `--grey` | Metadata ngắn; không dùng làm chữ nhỏ trên nền trắng nếu cần tương phản cao |
| Viền | `--line` | Card, input, phân cách trên nền sáng |
| Màu chủ đạo xanh dương | `--blue` (`#4f48e3`) | Link, focus, trạng thái đang chọn, điều hướng active và CTA chính |
| Màu xanh dương đậm | `--deep` (`#6634e2`) | Biến thể đậm cho hover, gradient và trạng thái cần nhấn |
| Màu chủ đạo xanh lá | `--green` (`#d2fd4b`) | Điểm nhấn, CTA phụ, badge cảnh báo/đang chờ; chữ trên nền xanh lá dùng `--black` |
| Bề mặt tương phản | `--black` | Header/panel chọn lọc, không dùng làm nền cho mọi màn hình |
| Viền trên nền tối | `--line-w` | Phân cách trên bề mặt đen/tím đậm |

`--blue` là mã màu xanh dương-xanh tím đã có trong palette gốc (`#4f48e3`); `--purple` và `--lime` được giữ làm alias tương thích. Nút xanh dương dùng chữ trắng; nút xanh lá dùng chữ đen. Không đặt chữ `--grey` trên nền trắng cho nội dung quan trọng. Mọi trạng thái phải có nhãn chữ hoặc icon, không truyền đạt ý nghĩa chỉ bằng màu.

### Màu trạng thái task

Chỉ dùng palette thương hiệu và các sắc nền pha cùng màu; giữ một quy ước xuyên suốt Kanban, chi tiết task và bộ lọc.

| `statusType` | Nhãn | Màu nhận diện | Gợi ý hiển thị |
|---|---|---|---|
| `brief` | Brief | `--grey` | Badge nền xám rất nhạt, chữ `--ink` |
| `ideation` | Lên ý tưởng | `--deep` | Badge nền xanh dương nhạt, chữ `--deep` |
| `production` | Sản xuất | `--blue` | Badge nền xanh dương nhạt, chữ `--blue` |
| `internal_review` | Duyệt nội bộ | `--black` | Badge nền đen, chữ trắng |
| `client_review` | Khách duyệt | `--deep` + `--green` | Chữ xanh dương đậm, chấm xanh lá; kèm thời gian chờ |
| `revision` | Chỉnh sửa | `--blue` | Badge viền xanh dương, nền trắng |
| `scheduled` | Đã lên lịch | `--black` | Badge nền trắng, viền đen |
| `done` | Hoàn thành | `--green` | Badge xanh lá, chữ đen |

Badge bổ sung:

- **Quá hạn:** nền `--black`, chữ trắng, icon đồng hồ/chấm than xanh lá và nhãn “Quá hạn”; hiển thị ngày hạn để phân biệt mức độ.
- **Chờ tiếp nhận:** nền xanh lá, chữ đen, nhãn “Chờ tiếp nhận”.
- **Đã chờ khách X ngày:** nền xanh dương rất nhạt, chữ `--deep`, icon đồng hồ; luôn hiện số ngày và nhãn “Chờ khách”.
- Nếu một task vừa quá hạn vừa chờ khách, hiển thị cả hai badge; không gộp thành một trạng thái.

## Typography

- Font UI: `Be Vietnam Pro`, fallback `system-ui, -apple-system, "Segoe UI", sans-serif`; hỗ trợ dấu tiếng Việt rõ.
- Font số liệu/mã kỹ thuật nếu cần: `ui-monospace`, chỉ dùng ở vùng phụ.
- Body mặc định 16px, line-height 1.5. Không dùng chữ dưới 12px; metadata ưu tiên 14px.
- Tiêu đề trang 28–32px desktop, 24–28px mobile; tiêu đề card 16px, nội dung phụ 14px.
- Dùng câu ngắn, từ phổ thông; nút có động từ cụ thể như “Tạo task”, “Tiếp nhận”, “Gửi duyệt”.

## Layout và spacing

- Lưới theo bội số 4px: `4, 8, 12, 16, 24, 32, 48, 64`.
- Khoảng đệm card 16px mobile, 20–24px desktop; khoảng cách giữa các vùng 24px mobile, 32px desktop.
- Bo góc vừa phải: input/button 8px, card 12px, badge dạng pill.
- Vùng bấm tối thiểu 44×44px; icon luôn có nhãn hoặc accessible name.
- Breakpoint tham chiếu: mobile `<640px`, tablet `640–1023px`, desktop `≥1024px`.
- Trên mobile, ưu tiên một cột nội dung; bảng rộng chuyển thành danh sách/card thay vì thu nhỏ chữ.

## Component cơ bản (shadcn/ui)

- `Button`: variant `default` màu deep, `secondary` trắng/viền, `outline`, `ghost`, `destructive` chỉ dùng cho hành động phá huỷ có xác nhận. Nút chính mỗi vùng tối đa một nút nổi bật.
- `Input`, `Textarea`, `Select`: nhãn luôn hiển thị; lỗi nằm ngay dưới trường; không chỉ dùng placeholder làm nhãn.
- `Badge`: status, quá hạn, chờ khách, chờ tiếp nhận; luôn có text.
- `Card`: task, dự án, thống kê; bấm được thì có hover/focus và vùng bấm rõ.
- `Dialog` desktop / `Drawer` mobile: form tạo/sửa nhanh và task detail; giữ hành động chính trong tầm với.
- `Tabs`: chuyển chế độ xem trong cùng ngữ cảnh, không dùng thay navigation chính.
- `DropdownMenu`: hành động phụ; không giấu thao tác thường dùng như “Tiếp nhận”.
- `Skeleton`, `EmptyState`, `Alert`: trạng thái loading/trống/lỗi có giải thích và hướng xử lý.
- `Toast`: xác nhận thao tác thành công hoặc lỗi tạm thời; lỗi cần sửa dữ liệu phải hiển thị cạnh trường liên quan.

## Kanban và task card

- Card ưu tiên tên task, người phụ trách, hạn; badge chờ khách/quá hạn/chờ tiếp nhận phải nhìn thấy mà không mở chi tiết.
- Hiển thị tên trạng thái và tên cột; không giả định tên cột tùy chỉnh chính là `statusType`.
- Desktop hỗ trợ kéo thả; thao tác bàn phím phải có phương án thay thế.
- Mobile hiển thị một cột mỗi lần, vuốt ngang đổi cột; nhấn giữ để kéo. Luôn có menu “Chuyển sang...” cho người không kéo thả được.
- Cột staff không được chuyển tới (`client_review`, `scheduled`, `done`) hiển thị khóa và giải thích. Nếu thả sai, trả card về vị trí cũ và báo: “Bạn chưa thể chuyển task tới cột này.”
- Task detail chừa vùng cho lịch sử phiên bản file và bình luận; phân biệt “Nội bộ” và “Khách hàng” để sẵn sàng cho portal.

## Accessibility

- Giữ focus nhìn thấy rõ bằng outline màu `--blue`; không bỏ outline mặc định nếu chưa có thay thế.
- Kiểm tra tương phản cho cặp chữ/nền khi triển khai; không dùng `--grey` cho chữ nhỏ trên `--white`.
- Có trạng thái hover, focus, disabled; khóa thao tác phải kèm lý do bằng chữ.
- Tôn trọng `prefers-reduced-motion`; animation kéo thả không phải tín hiệu duy nhất.
