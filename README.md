# QCC Agency Dashboard

App quản lý task cho agency marketing (Kanban kiểu Trello, quy trình duyệt nội bộ / khách hàng).
Bối cảnh, quy tắc nghiệp vụ và phân quyền: xem [CLAUDE.md](CLAUDE.md) và [docs/flow.html](docs/flow.html).

## Cấu trúc
```
apps/api/         Backend NestJS + MongoDB
apps/web/         Frontend Next.js (chưa làm)
packages/shared/  Enum, action, mã lỗi dùng chung
docs/             Flow, API contract, quyết định, tiến độ
```

## Chạy backend lần đầu
Cần: Node.js 20+, pnpm, Docker (hoặc MongoDB Atlas).

```bash
pnpm install
pnpm db:up                                   # bật MongoDB bằng Docker
cp apps/api/.env.example apps/api/.env       # dùng Atlas thì sửa MONGODB_URI
pnpm seed                                    # tạo dữ liệu mẫu
pnpm dev:api                                 # API: http://localhost:4000
```

Mở Swagger: http://localhost:4000/docs
1. Gọi `POST /auth/login` với `admin@qcc.local` / `123456`
2. Copy `accessToken`, bấm **Authorize**, dán vào
3. Thử các API khác

Tài khoản mẫu (mật khẩu `123456`):

| Email | Vai trò |
|---|---|
| admin@qcc.local | Admin |
| leader.a@qcc.local | Leader dự án "Social tháng 11 - Cà phê Mộc" |
| leader.b@qcc.local | Leader dự án "Chạy ads khai trương - Spa Lavender" |
| design@qcc.local, video@qcc.local, content@qcc.local, ads@qcc.local | Nhân viên |

## Kiểm thử
```bash
pnpm test:api        # unit test: phân quyền, quy trình task, vị trí kéo thả
pnpm seed:reset      # tạo lại dữ liệu sạch
pnpm test:smoke      # 54 kịch bản end-to-end qua HTTP (API phải đang chạy)
```
