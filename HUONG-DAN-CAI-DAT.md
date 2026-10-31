# Hướng Dẫn Vận Hành Hệ Thống Bằng PM2

## Yêu Cầu Hệ Thống

- Hệ điều hành: Windows 10/11 trở lên
- Node.js: Phiên bản 18+ (tải tại: https://nodejs.org/)
- PM2: `npm install -g pm2`

---

## Các Lệnh Quản Trị Hệ Thống Thường Dùng

Tất cả các thao tác đều thực hiện từ thư mục gốc của dự án (`d:\Coder\dental-care-system`):

| Thao tác | Lệnh thực hiện |
| :--- | :--- |
| **Bật toàn bộ hệ thống** | `pm2 start ecosystem.config.cjs` |
| **Kiểm tra trạng thái các tiến trình** | `pm2 ls` |
| **Xem log trực tiếp** | `pm2 logs` |
| **Xem log riêng backend** | `pm2 logs dental-backend` |
| **Xem log riêng frontend** | `pm2 logs dental-frontend` |
| **Khởi động lại toàn bộ** | `pm2 restart ecosystem.config.cjs` |
| **Tạm dừng hệ thống** | `pm2 stop ecosystem.config.cjs` |
| **Xóa app khỏi danh sách PM2** | `pm2 delete ecosystem.config.cjs` |
| **Lưu trạng thái hiện tại** | `pm2 save` |

---

## Thông Tin Kỹ Thuật

- **Frontend:** React + Vite, chạy tại cổng `5173`.
- **Backend:** Node.js + Express + TypeScript, chạy tại cổng `4000`.
- **Cơ sở dữ liệu:** SQLite lưu tại `backend/data/clinic.db`.
- **Đăng nhập mặc định:**
  - Tài khoản: `admin`
  - Mật khẩu: `123`
